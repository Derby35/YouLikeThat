const https = require('https');
const Player = require('../models/Player');
const Stat   = require('../models/Stat');
const WatchlistPlayer = require('../models/WatchlistPlayer');

/* ── Helper: fetch a URL and return parsed JSON ── */
const fetchJson = (url) =>
  new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });

/* ── ESPN stat name → our schema field mapping ── */
const ESPN_STAT_MAP = {
  passingYards:          'passingYards',
  passingTouchdowns:     'passingTDs',
  interceptions:         'interceptions',
  rushingYards:          'rushingYards',
  rushingTouchdowns:     'rushingTDs',
  receivingYards:        'receivingYards',
  receivingTouchdowns:   'receivingTDs',
  receptions:            'receptions',
  gamesPlayed:           'gamesPlayed',
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
    /* 1 – search for the athlete */
    const searchUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes?limit=5&search=${encodeURIComponent(name)}`;
    const searchData = await fetchJson(searchUrl);
    const athletes = searchData?.athletes || searchData?.items || [];
    if (!athletes.length) return res.status(404).json({ message: 'Player not found on ESPN' });

    const athlete = athletes[0];
    const espnId  = athlete.id || athlete.uid?.replace('s:20~a:', '');

    /* 2 – fetch that athlete's stats */
    let parsedStats = {};
    try {
      const statsUrl  = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes/${espnId}/stats`;
      const statsData = await fetchJson(statsUrl);
      const categories = statsData?.categories || [];

      categories.forEach((cat) => {
        (cat.stats || []).forEach((s) => {
          const ourField = ESPN_STAT_MAP[s.name];
          if (ourField && s.value !== undefined) {
            parsedStats[ourField] = Math.round(s.value);
          }
        });
      });

      parsedStats.fantasyPoints = parseFloat(calcFantasyPoints(parsedStats).toFixed(1));
    } catch (_) {
      /* stats lookup failed — that's OK, return player info without stats */
    }

    /* 3 – build response */
    const result = {
      espnId,
      name:         athlete.displayName || athlete.fullName || name,
      position:     athlete.position?.abbreviation || '',
      jerseyNumber: athlete.jersey ? Number(athlete.jersey) : undefined,
      age:          athlete.age    ? Number(athlete.age)    : undefined,
      college:      athlete.college?.shortName || athlete.college?.name || '',
      headshotUrl:  athlete.headshot?.href || '',
      teamName:     athlete.team?.displayName || '',
      teamAbbr:     athlete.team?.abbreviation || '',
      stats: parsedStats,
    };

    res.json(result);
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
