const https = require('https');
const Player = require('../models/Player');
const Stat   = require('../models/Stat');
const WatchlistPlayer = require('../models/WatchlistPlayer');

/* ── Helper: fetch a URL and return parsed JSON ── */
const fetchJson = (url) =>
  new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse failed for ${url}: ${e.message}`)); }
      });
    }).on('error', reject);
  });

/* ── ESPN team ID → abbreviation ── */
const ESPN_TEAM = {
  1:'ATL',2:'BUF',3:'CHI',4:'CIN',5:'CLE',6:'DAL',7:'DEN',8:'DET',
  9:'GB',10:'TEN',11:'IND',12:'KC',13:'LV',14:'LAR',15:'MIA',16:'MIN',
  17:'NE',18:'NO',19:'NYG',20:'NYJ',21:'PHI',22:'ARI',23:'PIT',24:'LAC',
  25:'SF',26:'SEA',27:'TB',28:'WSH',29:'CAR',30:'JAX',33:'BAL',34:'HOU',
};

/* ── ESPN stat name → our schema field mapping ──
   ESPN uses different casing/names across endpoints;
   list every known variant so we don't miss anything.   */
const ESPN_STAT_MAP = {
  /* Passing */
  passingYards:          'passingYards',
  passingTouchdowns:     'passingTDs',
  interceptions:         'interceptions',
  /* Rushing */
  rushingYards:          'rushingYards',
  rushingTouchdowns:     'rushingTDs',
  /* Receiving */
  receivingYards:        'receivingYards',
  receivingTouchdowns:   'receivingTDs',
  receptions:            'receptions',
  /* Games played — ESPN uses several different keys */
  gamesPlayed:           'gamesPlayed',
  GamesPlayed:           'gamesPlayed',
  games:                 'gamesPlayed',
  GP:                    'gamesPlayed',
  gp:                    'gamesPlayed',
  'games played':        'gamesPlayed',
};

/* ── Fantasy points calculator (PPR) ── */
const calcFantasyPoints = (s) =>
  (s.passingYards   || 0) * 0.04  +
  (s.passingTDs     || 0) * 4     +
  (s.interceptions  || 0) * -2    +
  (s.rushingYards   || 0) * 0.1   +
  (s.rushingTDs     || 0) * 6     +
  (s.receivingYards || 0) * 0.1   +
  (s.receivingTDs   || 0) * 6     +
  (s.receptions     || 0) * 1;

/* ────────────────────────────────────────────────────
   GET /api/players/espn-lookup?name=Patrick%20Mahomes
   Searches ESPN's unofficial API, returns player info
   + parsed season stats ready for our schema.
──────────────────────────────────────────────────── */
const lookupEspnPlayer = async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ message: 'name query param required' });

  try {
    /* 1 – search via ESPN v2 search → get espnId + basic info */
    const searchUrl  = `https://site.api.espn.com/apis/search/v2?query=${encodeURIComponent(name)}&sport=football&league=nfl&limit=5`;
    const searchData = await fetchJson(searchUrl);

    /* find first NFL player result */
    const playerResults = (searchData?.results || []).find(r => r.type === 'player');
    const hit = (playerResults?.contents || []).find(c => c.uid?.includes('l:28')); // l:28 = NFL
    if (!hit) return res.status(404).json({ message: 'Player not found on ESPN' });

    const espnId   = String(hit.uid || '').replace(/.*~a:/, '');
    const teamName = hit.subtitle || '';
    const headshotUrl = hit.image?.default || `https://a.espncdn.com/i/headshots/nfl/players/full/${espnId}.png`;

    /* 2 – core athlete detail → jersey, age, height, weight, team ID */
    let jersey, age, height, weight, teamAbbr = '', college = '';
    try {
      const coreUrl  = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/${espnId}?lang=en&region=us`;
      const coreData = await fetchJson(coreUrl);
      jersey  = coreData.jersey  ? Number(coreData.jersey)  : undefined;
      age     = coreData.age     ? Number(coreData.age)     : undefined;
      height  = coreData.displayHeight || '';
      weight  = coreData.displayWeight || '';
      college = coreData.college?.name || '';
      /* parse team ID from $ref like ".../teams/2?..." */
      const teamRef = coreData.team?.$ref || '';
      const teamIdMatch = teamRef.match(/teams\/(\d+)/);
      if (teamIdMatch) teamAbbr = ESPN_TEAM[Number(teamIdMatch[1])] || '';
    } catch (_) { /* non-critical */ }

    /* 3 – stats overview → Regular Season stats + position inference
       ESPN's overview has two parallel structures we mine:
         a) statistics.names + statistics.splits[].stats  (flat)
         b) statistics.categories[].names + categories[].values (grouped)
       We try both so nothing is missed, including gamesPlayed.       */
    let parsedStats = {};
    let position    = '';
    try {
      const overviewUrl  = `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${espnId}/overview`;
      const overviewData = await fetchJson(overviewUrl);
      const statObj      = overviewData?.statistics;

      if (statObj) {
        /* ── a) flat names + splits ── */
        const flatNames = statObj.names || statObj.labels || [];
        const splits    = statObj.splits || [];
        const regSeason = splits.find(s => /regular/i.test(s.displayName)) || splits[0];
        if (regSeason && flatNames.length) {
          const vals = regSeason.stats || regSeason.values || [];
          flatNames.forEach((statName, idx) => {
            const ourField = ESPN_STAT_MAP[statName];
            if (ourField && vals[idx] !== undefined) {
              const num = parseFloat(String(vals[idx]).replace(/,/g, ''));
              if (!isNaN(num)) parsedStats[ourField] = Math.round(num);
            }
          });
        }

        /* ── b) category breakdown (passing / rushing / receiving) ── */
        const cats = statObj.categories || [];
        cats.forEach(cat => {
          const catNames  = cat.names  || cat.labels || [];
          const catVals   = cat.values || cat.stats  || [];
          catNames.forEach((statName, idx) => {
            const ourField = ESPN_STAT_MAP[statName];
            if (ourField && catVals[idx] !== undefined) {
              const num = parseFloat(String(catVals[idx]).replace(/,/g, ''));
              if (!isNaN(num)) parsedStats[ourField] = Math.round(num);
            }
          });
        });

        /* ── c) gamesPlayed explicit fallback ─────────────────────
           ESPN often stores GP at the top level of the statObj or
           inside the first split's displayValue map.              */
        if (!parsedStats.gamesPlayed) {
          const gp =
            statObj.gamesPlayed             ??
            statObj.splits?.[0]?.gamesPlayed??
            overviewData?.athlete?.statistics?.gamesPlayed;
          if (gp != null) parsedStats.gamesPlayed = Math.round(Number(gp));
        }

        /* ── position from category names ── */
        const catNames = cats.map(c => (c.name || c.displayName || '').toLowerCase());
        if (catNames.some(n => n.includes('passing')))           position = 'QB';
        else if (catNames.some(n => n.includes('rushing')) &&
                 !catNames.some(n => n.includes('receiving')))   position = 'RB';
        else if (catNames.some(n => n.includes('receiving')))    position = 'WR';

        parsedStats.fantasyPoints = parseFloat(calcFantasyPoints(parsedStats).toFixed(1));
      }
    } catch (_) { /* non-critical — stats stay empty */ }

    res.json({
      espnId,
      name:         hit.displayName || name,
      position,
      jerseyNumber: jersey,
      age,
      college,
      height,
      weight,
      headshotUrl,
      teamName,
      teamAbbr,
      stats: parsedStats,
    });
  } catch (err) {
    res.status(500).json({ message: 'ESPN lookup failed', error: err.message });
  }
};

/* ────────────────────────────────────────────────────
   GET /api/players
──────────────────────────────────────────────────── */
const getAllPlayers = async (req, res) => {
  try {
    const { teamAbbr, position, search } = req.query;
    const filter = {};
    if (teamAbbr) filter.teamAbbr = teamAbbr.toUpperCase();
    if (position) filter.position = position;
    if (search)   filter.name = { $regex: search, $options: 'i' };

    const players = await Player.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'stats',
          localField: '_id',
          foreignField: 'player',
          as: 'statData',
        },
      },
      {
        $addFields: {
          fantasyPoints: {
            $ifNull: [{ $arrayElemAt: ['$statData.fantasyPoints', 0] }, 0],
          },
        },
      },
      { $sort: { fantasyPoints: -1, name: 1 } },
      { $project: { statData: 0 } },
    ]);
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ────────────────────────────────────────────────────
   GET /api/players/:id
──────────────────────────────────────────────────── */
const getPlayerById = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ message: 'Player not found' });
    res.json(player);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ────────────────────────────────────────────────────
   POST /api/players
   Body may include a `stats` object — if present, a
   Stat document is created alongside the player.
──────────────────────────────────────────────────── */
const createPlayer = async (req, res) => {
  try {
    const { stats: statsPayload, ...playerData } = req.body;
    const player = await Player.create(playerData);

    /* auto-create stat record */
    const statFields = statsPayload && Object.keys(statsPayload).length
      ? { ...statsPayload, player: player._id, season: statsPayload.season || 2024 }
      : { player: player._id, season: 2024 };

    /* recalculate fantasy points so they're never stale */
    statFields.fantasyPoints = parseFloat(calcFantasyPoints(statFields).toFixed(1));

    await Stat.create(statFields);

    res.status(201).json(player);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ────────────────────────────────────────────────────
   PUT /api/players/:id
──────────────────────────────────────────────────── */
const updatePlayer = async (req, res) => {
  try {
    const player = await Player.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!player) return res.status(404).json({ message: 'Player not found' });
    res.json(player);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ────────────────────────────────────────────────────
   DELETE /api/players/:id
   Cascade-deletes: Stats + WatchlistPlayer entries.
──────────────────────────────────────────────────── */
const deletePlayer = async (req, res) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);
    if (!player) return res.status(404).json({ message: 'Player not found' });

    /* remove all associated data */
    await Promise.all([
      Stat.deleteMany({ player: req.params.id }),
      WatchlistPlayer.deleteMany({ player: req.params.id }),
    ]);

    res.json({ message: 'Player and all associated data deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  lookupEspnPlayer,
  getAllPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer,
};
