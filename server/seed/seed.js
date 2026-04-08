require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User          = require('../models/User');
const Player        = require('../models/Player');
const Stat          = require('../models/Stat');
const Watchlist     = require('../models/Watchlist');
const WatchlistPlayer = require('../models/WatchlistPlayer');

/* ── PPR fantasy-points calculator (used to verify totals) ── */
const fpts = (s) => +(
  (s.passingYards  ||0)*0.04 + (s.passingTDs    ||0)*4  + (s.interceptions||0)*-2 +
  (s.rushingYards  ||0)*0.1  + (s.rushingTDs    ||0)*6  +
  (s.receivingYards||0)*0.1  + (s.receivingTDs  ||0)*6  + (s.receptions   ||0)*1
).toFixed(1);

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
      User.deleteMany({}), Player.deleteMany({}), Stat.deleteMany({}),
      Watchlist.deleteMany({}), WatchlistPlayer.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    /* ── Users ─────────────────────────────────────────────── */
    const salt  = await bcrypt.genSalt(10);
    const admin = await User.create({ username: 'admin',      passwordHash: await bcrypt.hash('Admin123!',  salt), role: 'admin' });
    const john  = await User.create({ username: 'john_doe',   passwordHash: await bcrypt.hash('Password1!', salt), role: 'standard' });
    const jane  = await User.create({ username: 'jane_smith', passwordHash: await bcrypt.hash('Password1!', salt), role: 'standard' });
    console.log('Users seeded (3)');

    /* ═══════════════════════════════════════════════════════
       PLAYERS  —  120 total  (QB:32  RB:36  WR:36  TE:16)
       NO kickers, NO DEF/DST, NO IDP
    ═══════════════════════════════════════════════════════ */
    const players = await Player.insertMany([

      /* ── QBs (32) — one quality starter per team ────────── */
      { name: 'Lamar Jackson',       position:'QB', jerseyNumber: 8,  teamName:'Baltimore Ravens',         teamAbbr:'BAL', age:27 },
      { name: 'Josh Allen',          position:'QB', jerseyNumber:17,  teamName:'Buffalo Bills',            teamAbbr:'BUF', age:28 },
      { name: 'Jalen Hurts',         position:'QB', jerseyNumber: 1,  teamName:'Philadelphia Eagles',      teamAbbr:'PHI', age:26 },
      { name: 'Joe Burrow',          position:'QB', jerseyNumber: 9,  teamName:'Cincinnati Bengals',       teamAbbr:'CIN', age:28 },
      { name: 'Patrick Mahomes',     position:'QB', jerseyNumber:15,  teamName:'Kansas City Chiefs',       teamAbbr:'KC',  age:29 },
      { name: 'Brock Purdy',         position:'QB', jerseyNumber:13,  teamName:'San Francisco 49ers',      teamAbbr:'SF',  age:25 },
      { name: 'Jayden Daniels',      position:'QB', jerseyNumber: 5,  teamName:'Washington Commanders',    teamAbbr:'WSH', age:23 },
      { name: 'Baker Mayfield',      position:'QB', jerseyNumber: 6,  teamName:'Tampa Bay Buccaneers',     teamAbbr:'TB',  age:30 },
      { name: 'Sam Darnold',         position:'QB', jerseyNumber:14,  teamName:'Minnesota Vikings',        teamAbbr:'MIN', age:27 },
      { name: 'Jordan Love',         position:'QB', jerseyNumber:10,  teamName:'Green Bay Packers',        teamAbbr:'GB',  age:26 },
      { name: 'Justin Herbert',      position:'QB', jerseyNumber:10,  teamName:'Los Angeles Chargers',     teamAbbr:'LAC', age:26 },
      { name: 'Caleb Williams',      position:'QB', jerseyNumber:18,  teamName:'Chicago Bears',            teamAbbr:'CHI', age:23 },
      { name: 'Anthony Richardson',  position:'QB', jerseyNumber: 5,  teamName:'Indianapolis Colts',       teamAbbr:'IND', age:22 },
      { name: 'C.J. Stroud',         position:'QB', jerseyNumber: 7,  teamName:'Houston Texans',           teamAbbr:'HOU', age:23 },
      { name: 'Kyler Murray',        position:'QB', jerseyNumber: 1,  teamName:'Arizona Cardinals',        teamAbbr:'ARI', age:27 },
      { name: 'Trevor Lawrence',     position:'QB', jerseyNumber:16,  teamName:'Jacksonville Jaguars',     teamAbbr:'JAX', age:25 },
      { name: 'Kirk Cousins',        position:'QB', jerseyNumber: 8,  teamName:'Atlanta Falcons',          teamAbbr:'ATL', age:36 },
      { name: 'Tua Tagovailoa',      position:'QB', jerseyNumber: 1,  teamName:'Miami Dolphins',           teamAbbr:'MIA', age:26 },
      { name: 'Dak Prescott',        position:'QB', jerseyNumber: 4,  teamName:'Dallas Cowboys',           teamAbbr:'DAL', age:31 },
      { name: 'Geno Smith',          position:'QB', jerseyNumber: 7,  teamName:'Seattle Seahawks',         teamAbbr:'SEA', age:34 },
      { name: 'Jared Goff',          position:'QB', jerseyNumber:16,  teamName:'Detroit Lions',            teamAbbr:'DET', age:30 },
      { name: 'Bo Nix',              position:'QB', jerseyNumber:10,  teamName:'Denver Broncos',           teamAbbr:'DEN', age:24 },
      { name: 'Russell Wilson',      position:'QB', jerseyNumber: 3,  teamName:'Pittsburgh Steelers',      teamAbbr:'PIT', age:36 },
      { name: 'Drake Maye',          position:'QB', jerseyNumber:10,  teamName:'New England Patriots',     teamAbbr:'NE',  age:22 },
      { name: 'Aaron Rodgers',       position:'QB', jerseyNumber: 8,  teamName:'New York Jets',            teamAbbr:'NYJ', age:41 },
      { name: 'Derek Carr',          position:'QB', jerseyNumber: 4,  teamName:'New Orleans Saints',       teamAbbr:'NO',  age:33 },
      { name: 'Matthew Stafford',    position:'QB', jerseyNumber: 9,  teamName:'Los Angeles Rams',         teamAbbr:'LAR', age:36 },
      { name: 'Will Levis',          position:'QB', jerseyNumber: 8,  teamName:'Tennessee Titans',         teamAbbr:'TEN', age:25 },
      { name: 'Bryce Young',         position:'QB', jerseyNumber: 9,  teamName:'Carolina Panthers',        teamAbbr:'CAR', age:23 },
      { name: 'Aidan O\'Connell',    position:'QB', jerseyNumber: 4,  teamName:'Las Vegas Raiders',        teamAbbr:'LV',  age:26 },
      { name: 'Jameis Winston',      position:'QB', jerseyNumber: 5,  teamName:'Cleveland Browns',         teamAbbr:'CLE', age:31 },
      { name: 'Daniel Jones',        position:'QB', jerseyNumber: 8,  teamName:'New York Giants',          teamAbbr:'NYG', age:27 },

      /* ── RBs (36) ────────────────────────────────────────── */
      { name: 'Saquon Barkley',      position:'RB', jerseyNumber:26,  teamName:'Philadelphia Eagles',      teamAbbr:'PHI', age:27 },
      { name: 'Derrick Henry',       position:'RB', jerseyNumber:22,  teamName:'Baltimore Ravens',         teamAbbr:'BAL', age:30 },
      { name: 'Christian McCaffrey', position:'RB', jerseyNumber:23,  teamName:'San Francisco 49ers',      teamAbbr:'SF',  age:28 },
      { name: "De'Von Achane",       position:'RB', jerseyNumber:28,  teamName:'Miami Dolphins',           teamAbbr:'MIA', age:23 },
      { name: 'Bijan Robinson',      position:'RB', jerseyNumber: 7,  teamName:'Atlanta Falcons',          teamAbbr:'ATL', age:23 },
      { name: 'Josh Jacobs',         position:'RB', jerseyNumber: 8,  teamName:'Green Bay Packers',        teamAbbr:'GB',  age:26 },
      { name: 'Kyren Williams',      position:'RB', jerseyNumber:23,  teamName:'Los Angeles Rams',         teamAbbr:'LAR', age:24 },
      { name: 'James Cook',          position:'RB', jerseyNumber: 4,  teamName:'Buffalo Bills',            teamAbbr:'BUF', age:24 },
      { name: 'Breece Hall',         position:'RB', jerseyNumber:20,  teamName:'New York Jets',            teamAbbr:'NYJ', age:23 },
      { name: 'Jonathan Taylor',     position:'RB', jerseyNumber:28,  teamName:'Indianapolis Colts',       teamAbbr:'IND', age:25 },
      { name: 'Travis Etienne',      position:'RB', jerseyNumber: 1,  teamName:'Jacksonville Jaguars',     teamAbbr:'JAX', age:25 },
      { name: 'Alvin Kamara',        position:'RB', jerseyNumber:41,  teamName:'New Orleans Saints',       teamAbbr:'NO',  age:29 },
      { name: 'Jahmyr Gibbs',        position:'RB', jerseyNumber:26,  teamName:'Detroit Lions',            teamAbbr:'DET', age:22 },
      { name: 'David Montgomery',    position:'RB', jerseyNumber: 5,  teamName:'Detroit Lions',            teamAbbr:'DET', age:27 },
      { name: 'Aaron Jones Sr.',     position:'RB', jerseyNumber:33,  teamName:'Minnesota Vikings',        teamAbbr:'MIN', age:30 },
      { name: 'Joe Mixon',           position:'RB', jerseyNumber:28,  teamName:'Houston Texans',           teamAbbr:'HOU', age:28 },
      { name: 'Tony Pollard',        position:'RB', jerseyNumber:20,  teamName:'Tennessee Titans',         teamAbbr:'TEN', age:27 },
      { name: 'Rachaad White',       position:'RB', jerseyNumber:29,  teamName:'Tampa Bay Buccaneers',     teamAbbr:'TB',  age:26 },
      { name: "D'Andre Swift",       position:'RB', jerseyNumber: 0,  teamName:'Chicago Bears',            teamAbbr:'CHI', age:25 },
      { name: 'Brian Robinson Jr.',  position:'RB', jerseyNumber: 8,  teamName:'Washington Commanders',    teamAbbr:'WSH', age:25 },
      { name: 'Najee Harris',        position:'RB', jerseyNumber:22,  teamName:'Pittsburgh Steelers',      teamAbbr:'PIT', age:26 },
      { name: 'Chuba Hubbard',       position:'RB', jerseyNumber:30,  teamName:'Carolina Panthers',        teamAbbr:'CAR', age:25 },
      { name: 'Javonte Williams',    position:'RB', jerseyNumber:33,  teamName:'Denver Broncos',           teamAbbr:'DEN', age:24 },
      { name: 'Zack Moss',           position:'RB', jerseyNumber:21,  teamName:'Cincinnati Bengals',       teamAbbr:'CIN', age:27 },
      { name: 'Kenneth Walker III',  position:'RB', jerseyNumber: 9,  teamName:'Seattle Seahawks',         teamAbbr:'SEA', age:24 },
      { name: 'Raheem Mostert',      position:'RB', jerseyNumber:31,  teamName:'Miami Dolphins',           teamAbbr:'MIA', age:32 },
      { name: 'Nick Chubb',          position:'RB', jerseyNumber:24,  teamName:'Cleveland Browns',         teamAbbr:'CLE', age:28 },
      { name: 'Gus Edwards',         position:'RB', jerseyNumber:35,  teamName:'Los Angeles Chargers',     teamAbbr:'LAC', age:29 },
      { name: 'Jaylen Warren',       position:'RB', jerseyNumber:30,  teamName:'Pittsburgh Steelers',      teamAbbr:'PIT', age:25 },
      { name: 'Rico Dowdle',         position:'RB', jerseyNumber:23,  teamName:'Dallas Cowboys',           teamAbbr:'DAL', age:26 },
      { name: 'James Conner',        position:'RB', jerseyNumber: 6,  teamName:'Arizona Cardinals',        teamAbbr:'ARI', age:29 },
      { name: 'Zamir White',         position:'RB', jerseyNumber:35,  teamName:'Las Vegas Raiders',        teamAbbr:'LV',  age:24 },
      { name: 'Tank Bigsby',         position:'RB', jerseyNumber:30,  teamName:'Jacksonville Jaguars',     teamAbbr:'JAX', age:23 },
      { name: 'Blake Corum',         position:'RB', jerseyNumber:24,  teamName:'Los Angeles Rams',         teamAbbr:'LAR', age:22 },
      { name: 'Kendre Miller',       position:'RB', jerseyNumber:23,  teamName:'New Orleans Saints',       teamAbbr:'NO',  age:23 },
      { name: 'Tyrone Tracy Jr.',    position:'RB', jerseyNumber:29,  teamName:'New York Giants',          teamAbbr:'NYG', age:24 },

      /* ── WRs (36) ────────────────────────────────────────── */
      { name: "Ja'Marr Chase",       position:'WR', jerseyNumber: 1,  teamName:'Cincinnati Bengals',       teamAbbr:'CIN', age:24 },
      { name: 'CeeDee Lamb',         position:'WR', jerseyNumber:88,  teamName:'Dallas Cowboys',           teamAbbr:'DAL', age:25 },
      { name: 'Amon-Ra St. Brown',   position:'WR', jerseyNumber:14,  teamName:'Detroit Lions',            teamAbbr:'DET', age:24 },
      { name: 'Tyreek Hill',         position:'WR', jerseyNumber:10,  teamName:'Miami Dolphins',           teamAbbr:'MIA', age:30 },
      { name: 'Justin Jefferson',    position:'WR', jerseyNumber:18,  teamName:'Minnesota Vikings',        teamAbbr:'MIN', age:25 },
      { name: 'Puka Nacua',          position:'WR', jerseyNumber:17,  teamName:'Los Angeles Rams',         teamAbbr:'LAR', age:23 },
      { name: 'A.J. Brown',          position:'WR', jerseyNumber:11,  teamName:'Philadelphia Eagles',      teamAbbr:'PHI', age:27 },
      { name: 'Malik Nabers',        position:'WR', jerseyNumber: 1,  teamName:'New York Giants',          teamAbbr:'NYG', age:21 },
      { name: 'Brian Thomas Jr.',    position:'WR', jerseyNumber: 7,  teamName:'Jacksonville Jaguars',     teamAbbr:'JAX', age:22 },
      { name: 'Drake London',        position:'WR', jerseyNumber: 5,  teamName:'Atlanta Falcons',          teamAbbr:'ATL', age:23 },
      { name: 'Zay Flowers',         position:'WR', jerseyNumber: 4,  teamName:'Baltimore Ravens',         teamAbbr:'BAL', age:23 },
      { name: 'Terry McLaurin',      position:'WR', jerseyNumber:17,  teamName:'Washington Commanders',    teamAbbr:'WSH', age:29 },
      { name: 'Mike Evans',          position:'WR', jerseyNumber:13,  teamName:'Tampa Bay Buccaneers',     teamAbbr:'TB',  age:31 },
      { name: 'Ladd McConkey',       position:'WR', jerseyNumber:15,  teamName:'Los Angeles Chargers',     teamAbbr:'LAC', age:23 },
      { name: 'Tee Higgins',         position:'WR', jerseyNumber: 5,  teamName:'Cincinnati Bengals',       teamAbbr:'CIN', age:25 },
      { name: 'Courtland Sutton',    position:'WR', jerseyNumber:14,  teamName:'Denver Broncos',           teamAbbr:'DEN', age:29 },
      { name: 'Chris Olave',         position:'WR', jerseyNumber:12,  teamName:'New Orleans Saints',       teamAbbr:'NO',  age:24 },
      { name: 'DeVonta Smith',       position:'WR', jerseyNumber: 6,  teamName:'Philadelphia Eagles',      teamAbbr:'PHI', age:26 },
      { name: 'Stefon Diggs',        position:'WR', jerseyNumber:14,  teamName:'Houston Texans',           teamAbbr:'HOU', age:31 },
      { name: 'Davante Adams',       position:'WR', jerseyNumber:17,  teamName:'Las Vegas Raiders',        teamAbbr:'LV',  age:32 },
      { name: 'George Pickens',      position:'WR', jerseyNumber:14,  teamName:'Pittsburgh Steelers',      teamAbbr:'PIT', age:23 },
      { name: 'Jaylen Waddle',       position:'WR', jerseyNumber:17,  teamName:'Miami Dolphins',           teamAbbr:'MIA', age:26 },
      { name: 'DJ Moore',            position:'WR', jerseyNumber: 2,  teamName:'Chicago Bears',            teamAbbr:'CHI', age:27 },
      { name: 'Brandon Aiyuk',       position:'WR', jerseyNumber:11,  teamName:'San Francisco 49ers',      teamAbbr:'SF',  age:26 },
      { name: 'Rashee Rice',         position:'WR', jerseyNumber: 4,  teamName:'Kansas City Chiefs',       teamAbbr:'KC',  age:24 },
      { name: 'Xavier Worthy',       position:'WR', jerseyNumber: 1,  teamName:'Kansas City Chiefs',       teamAbbr:'KC',  age:22 },
      { name: 'Rome Odunze',         position:'WR', jerseyNumber:15,  teamName:'Chicago Bears',            teamAbbr:'CHI', age:23 },
      { name: 'Marvin Harrison Jr.', position:'WR', jerseyNumber:18,  teamName:'Arizona Cardinals',        teamAbbr:'ARI', age:22 },
      { name: 'Jaxon Smith-Njigba',  position:'WR', jerseyNumber:11,  teamName:'Seattle Seahawks',         teamAbbr:'SEA', age:23 },
      { name: 'DeAndre Hopkins',     position:'WR', jerseyNumber:10,  teamName:'Tennessee Titans',         teamAbbr:'TEN', age:32 },
      { name: 'Jerry Jeudy',         position:'WR', jerseyNumber: 3,  teamName:'Cleveland Browns',         teamAbbr:'CLE', age:25 },
      { name: 'Keenan Allen',        position:'WR', jerseyNumber:13,  teamName:'Chicago Bears',            teamAbbr:'CHI', age:32 },
      { name: 'Adam Thielen',        position:'WR', jerseyNumber: 4,  teamName:'Carolina Panthers',        teamAbbr:'CAR', age:34 },
      { name: 'Tank Dell',           position:'WR', jerseyNumber: 3,  teamName:'Houston Texans',           teamAbbr:'HOU', age:24 },
      { name: 'Quentin Johnston',    position:'WR', jerseyNumber: 1,  teamName:'Los Angeles Chargers',     teamAbbr:'LAC', age:23 },
      { name: 'Diontae Johnson',     position:'WR', jerseyNumber:11,  teamName:'Baltimore Ravens',         teamAbbr:'BAL', age:28 },

      /* ── TEs (16) ────────────────────────────────────────── */
      { name: 'Trey McBride',        position:'TE', jerseyNumber:85,  teamName:'Arizona Cardinals',        teamAbbr:'ARI', age:24 },
      { name: 'Sam LaPorta',         position:'TE', jerseyNumber:85,  teamName:'Detroit Lions',            teamAbbr:'DET', age:23 },
      { name: 'Mark Andrews',        position:'TE', jerseyNumber:89,  teamName:'Baltimore Ravens',         teamAbbr:'BAL', age:29 },
      { name: 'Travis Kelce',        position:'TE', jerseyNumber:87,  teamName:'Kansas City Chiefs',       teamAbbr:'KC',  age:35 },
      { name: 'Evan Engram',         position:'TE', jerseyNumber:17,  teamName:'Jacksonville Jaguars',     teamAbbr:'JAX', age:30 },
      { name: 'Jake Ferguson',       position:'TE', jerseyNumber:87,  teamName:'Dallas Cowboys',           teamAbbr:'DAL', age:24 },
      { name: 'Cole Kmet',           position:'TE', jerseyNumber:85,  teamName:'Chicago Bears',            teamAbbr:'CHI', age:25 },
      { name: 'David Njoku',         position:'TE', jerseyNumber:85,  teamName:'Cleveland Browns',         teamAbbr:'CLE', age:28 },
      { name: 'Pat Freiermuth',      position:'TE', jerseyNumber:88,  teamName:'Pittsburgh Steelers',      teamAbbr:'PIT', age:25 },
      { name: 'Kyle Pitts',          position:'TE', jerseyNumber: 8,  teamName:'Atlanta Falcons',          teamAbbr:'ATL', age:24 },
      { name: 'Dallas Goedert',      position:'TE', jerseyNumber:88,  teamName:'Philadelphia Eagles',      teamAbbr:'PHI', age:29 },
      { name: 'Dalton Kincaid',      position:'TE', jerseyNumber:86,  teamName:'Buffalo Bills',            teamAbbr:'BUF', age:26 },
      { name: 'Isaiah Likely',       position:'TE', jerseyNumber:80,  teamName:'Baltimore Ravens',         teamAbbr:'BAL', age:25 },
      { name: 'Jonnu Smith',         position:'TE', jerseyNumber:81,  teamName:'Miami Dolphins',           teamAbbr:'MIA', age:29 },
      { name: 'Cade Otton',          position:'TE', jerseyNumber:87,  teamName:'Tampa Bay Buccaneers',     teamAbbr:'TB',  age:25 },
      { name: 'Gerald Everett',      position:'TE', jerseyNumber: 7,  teamName:'Los Angeles Chargers',     teamAbbr:'LAC', age:31 },
    ]);

    const p = (name) => { const r = players.find(x => x.name === name); if (!r) throw new Error(`Player not found: ${name}`); return r; };
    const qb = (d) => ({ ...d, fantasyPoints: fpts(d) });
    const sk = (d) => ({ ...d, fantasyPoints: fpts(d) });

    console.log(`Players seeded (${players.length})`);
    const byPos = players.reduce((a,p) => { a[p.position] = (a[p.position]||0)+1; return a; }, {});
    console.log('  Breakdown:', Object.entries(byPos).map(([k,v])=>`${k}:${v}`).join('  '));

    /* ═══════════════════════════════════════════════════════
       STATS — 2024 NFL regular season (PPR)
    ═══════════════════════════════════════════════════════ */
    await Stat.insertMany([

      /* QBs */
      qb({ player:p('Lamar Jackson')._id,      season:2024, gamesPlayed:17, passingYards:4172, passingTDs:41, interceptions: 4, rushingYards: 915, rushingTDs: 4 }),
      qb({ player:p('Josh Allen')._id,         season:2024, gamesPlayed:17, passingYards:3731, passingTDs:28, interceptions: 6, rushingYards: 531, rushingTDs:12 }),
      qb({ player:p('Jalen Hurts')._id,        season:2024, gamesPlayed:16, passingYards:3903, passingTDs:35, interceptions: 7, rushingYards: 629, rushingTDs:14 }),
      qb({ player:p('Joe Burrow')._id,         season:2024, gamesPlayed:17, passingYards:4918, passingTDs:43, interceptions: 6, rushingYards:  89, rushingTDs: 2 }),
      qb({ player:p('Patrick Mahomes')._id,    season:2024, gamesPlayed:17, passingYards:4183, passingTDs:31, interceptions:11, rushingYards: 389, rushingTDs: 4 }),
      qb({ player:p('Brock Purdy')._id,        season:2024, gamesPlayed:17, passingYards:4280, passingTDs:28, interceptions:12, rushingYards: 141, rushingTDs: 2 }),
      qb({ player:p('Jayden Daniels')._id,     season:2024, gamesPlayed:17, passingYards:3568, passingTDs:25, interceptions: 9, rushingYards: 891, rushingTDs: 6 }),
      qb({ player:p('Baker Mayfield')._id,     season:2024, gamesPlayed:17, passingYards:4500, passingTDs:41, interceptions: 9, rushingYards:  98, rushingTDs: 2 }),
      qb({ player:p('Sam Darnold')._id,        season:2024, gamesPlayed:14, passingYards:3718, passingTDs:35, interceptions:12, rushingYards: 108, rushingTDs: 1 }),
      qb({ player:p('Jordan Love')._id,        season:2024, gamesPlayed:16, passingYards:4159, passingTDs:25, interceptions:11, rushingYards:  63, rushingTDs: 2 }),
      qb({ player:p('Justin Herbert')._id,     season:2024, gamesPlayed:17, passingYards:3870, passingTDs:23, interceptions: 9, rushingYards: 107, rushingTDs: 2 }),
      qb({ player:p('Caleb Williams')._id,     season:2024, gamesPlayed:17, passingYards:3541, passingTDs:20, interceptions: 6, rushingYards: 226, rushingTDs: 4 }),
      qb({ player:p('Anthony Richardson')._id, season:2024, gamesPlayed:11, passingYards:1814, passingTDs:10, interceptions: 7, rushingYards: 534, rushingTDs: 8 }),
      qb({ player:p('C.J. Stroud')._id,        season:2024, gamesPlayed:14, passingYards:2898, passingTDs:15, interceptions: 7, rushingYards:  68, rushingTDs: 0 }),
      qb({ player:p('Kyler Murray')._id,       season:2024, gamesPlayed:16, passingYards:3989, passingTDs:26, interceptions: 8, rushingYards: 394, rushingTDs: 3 }),
      qb({ player:p('Trevor Lawrence')._id,    season:2024, gamesPlayed:11, passingYards:2045, passingTDs:11, interceptions: 9, rushingYards: 144, rushingTDs: 0 }),
      qb({ player:p('Kirk Cousins')._id,       season:2024, gamesPlayed:14, passingYards:3508, passingTDs:18, interceptions:16, rushingYards:  75, rushingTDs: 2 }),
      qb({ player:p('Tua Tagovailoa')._id,     season:2024, gamesPlayed: 8, passingYards:2165, passingTDs:16, interceptions: 8, rushingYards:  60, rushingTDs: 0 }),
      qb({ player:p('Dak Prescott')._id,       season:2024, gamesPlayed: 8, passingYards:1978, passingTDs:11, interceptions: 4, rushingYards:  37, rushingTDs: 0 }),
      qb({ player:p('Geno Smith')._id,         season:2024, gamesPlayed:14, passingYards:2666, passingTDs:20, interceptions: 8, rushingYards: 105, rushingTDs: 0 }),
      qb({ player:p('Jared Goff')._id,         season:2024, gamesPlayed:17, passingYards:4629, passingTDs:37, interceptions:12, rushingYards:  64, rushingTDs: 0 }),
      qb({ player:p('Bo Nix')._id,             season:2024, gamesPlayed:16, passingYards:3307, passingTDs:29, interceptions:12, rushingYards: 242, rushingTDs: 5 }),
      qb({ player:p('Russell Wilson')._id,     season:2024, gamesPlayed:11, passingYards:2482, passingTDs:16, interceptions: 5, rushingYards: 205, rushingTDs: 2 }),
      qb({ player:p('Drake Maye')._id,         season:2024, gamesPlayed:13, passingYards:2276, passingTDs:15, interceptions:10, rushingYards: 262, rushingTDs: 4 }),
      qb({ player:p('Aaron Rodgers')._id,      season:2024, gamesPlayed:12, passingYards:3897, passingTDs:28, interceptions:11, rushingYards:  91, rushingTDs: 0 }),
      qb({ player:p('Derek Carr')._id,         season:2024, gamesPlayed: 8, passingYards:1468, passingTDs: 8, interceptions: 5, rushingYards:  32, rushingTDs: 0 }),
      qb({ player:p('Matthew Stafford')._id,   season:2024, gamesPlayed:13, passingYards:3762, passingTDs:20, interceptions: 8, rushingYards:  23, rushingTDs: 0 }),
      qb({ player:p('Will Levis')._id,         season:2024, gamesPlayed:14, passingYards:2697, passingTDs:13, interceptions:13, rushingYards: 147, rushingTDs: 1 }),
      qb({ player:p('Bryce Young')._id,        season:2024, gamesPlayed:13, passingYards:2453, passingTDs: 8, interceptions: 7, rushingYards: 210, rushingTDs: 2 }),
      qb({ player:p("Aidan O'Connell")._id,    season:2024, gamesPlayed:11, passingYards:2025, passingTDs:11, interceptions:10, rushingYards:  88, rushingTDs: 0 }),
      qb({ player:p('Jameis Winston')._id,     season:2024, gamesPlayed: 6, passingYards:1475, passingTDs: 6, interceptions: 5, rushingYards:  42, rushingTDs: 0 }),
      qb({ player:p('Daniel Jones')._id,       season:2024, gamesPlayed: 7, passingYards:1433, passingTDs: 4, interceptions: 5, rushingYards: 143, rushingTDs: 1 }),

      /* RBs */
      sk({ player:p('Saquon Barkley')._id,     season:2024, gamesPlayed:17, rushingYards:2005, rushingTDs:13, receivingYards: 278, receivingTDs:2, receptions:35 }),
      sk({ player:p('Derrick Henry')._id,      season:2024, gamesPlayed:16, rushingYards:1921, rushingTDs:16, receivingYards: 120, receivingTDs:1, receptions:18 }),
      sk({ player:p('Christian McCaffrey')._id,season:2024, gamesPlayed:16, rushingYards:1459, rushingTDs:14, receivingYards: 328, receivingTDs:3, receptions:43 }),
      sk({ player:p("De'Von Achane")._id,      season:2024, gamesPlayed:13, rushingYards: 905, rushingTDs: 8, receivingYards: 426, receivingTDs:4, receptions:52 }),
      sk({ player:p('Bijan Robinson')._id,     season:2024, gamesPlayed:17, rushingYards:1074, rushingTDs: 7, receivingYards: 614, receivingTDs:4, receptions:75 }),
      sk({ player:p('Josh Jacobs')._id,        season:2024, gamesPlayed:17, rushingYards:1329, rushingTDs:15, receivingYards: 301, receivingTDs:1, receptions:38 }),
      sk({ player:p('Kyren Williams')._id,     season:2024, gamesPlayed:15, rushingYards:1170, rushingTDs:12, receivingYards: 283, receivingTDs:2, receptions:38 }),
      sk({ player:p('James Cook')._id,         season:2024, gamesPlayed:17, rushingYards:1009, rushingTDs:16, receivingYards: 342, receivingTDs:0, receptions:44 }),
      sk({ player:p('Breece Hall')._id,        season:2024, gamesPlayed:17, rushingYards: 994, rushingTDs: 9, receivingYards: 591, receivingTDs:2, receptions:55 }),
      sk({ player:p('Jonathan Taylor')._id,    season:2024, gamesPlayed:17, rushingYards:1054, rushingTDs:11, receivingYards: 234, receivingTDs:1, receptions:32 }),
      sk({ player:p('Travis Etienne')._id,     season:2024, gamesPlayed:17, rushingYards: 760, rushingTDs: 5, receivingYards: 392, receivingTDs:2, receptions:50 }),
      sk({ player:p('Alvin Kamara')._id,       season:2024, gamesPlayed:17, rushingYards:1100, rushingTDs: 9, receivingYards: 429, receivingTDs:2, receptions:54 }),
      sk({ player:p('Jahmyr Gibbs')._id,       season:2024, gamesPlayed:16, rushingYards:1103, rushingTDs:10, receivingYards: 370, receivingTDs:3, receptions:47 }),
      sk({ player:p('David Montgomery')._id,   season:2024, gamesPlayed:16, rushingYards: 856, rushingTDs:11, receivingYards: 175, receivingTDs:0, receptions:24 }),
      sk({ player:p('Aaron Jones Sr.')._id,    season:2024, gamesPlayed:17, rushingYards: 794, rushingTDs: 7, receivingYards: 391, receivingTDs:3, receptions:58 }),
      sk({ player:p('Joe Mixon')._id,          season:2024, gamesPlayed:17, rushingYards:1101, rushingTDs: 6, receivingYards: 377, receivingTDs:3, receptions:44 }),
      sk({ player:p('Tony Pollard')._id,       season:2024, gamesPlayed:17, rushingYards: 803, rushingTDs: 4, receivingYards: 199, receivingTDs:2, receptions:30 }),
      sk({ player:p('Rachaad White')._id,      season:2024, gamesPlayed:17, rushingYards: 990, rushingTDs: 7, receivingYards: 288, receivingTDs:1, receptions:37 }),
      sk({ player:p("D'Andre Swift")._id,      season:2024, gamesPlayed:17, rushingYards: 784, rushingTDs: 6, receivingYards: 214, receivingTDs:1, receptions:30 }),
      sk({ player:p('Brian Robinson Jr.')._id, season:2024, gamesPlayed:17, rushingYards:1104, rushingTDs: 7, receivingYards: 106, receivingTDs:0, receptions:15 }),
      sk({ player:p('Najee Harris')._id,       season:2024, gamesPlayed:17, rushingYards:1028, rushingTDs: 6, receivingYards: 188, receivingTDs:0, receptions:32 }),
      sk({ player:p('Chuba Hubbard')._id,      season:2024, gamesPlayed:17, rushingYards:1014, rushingTDs: 8, receivingYards: 264, receivingTDs:1, receptions:37 }),
      sk({ player:p('Javonte Williams')._id,   season:2024, gamesPlayed:16, rushingYards: 765, rushingTDs: 5, receivingYards: 202, receivingTDs:1, receptions:25 }),
      sk({ player:p('Zack Moss')._id,          season:2024, gamesPlayed:17, rushingYards: 904, rushingTDs: 8, receivingYards: 167, receivingTDs:1, receptions:24 }),
      sk({ player:p('Kenneth Walker III')._id, season:2024, gamesPlayed:16, rushingYards: 900, rushingTDs: 7, receivingYards: 168, receivingTDs:0, receptions:27 }),
      sk({ player:p('Raheem Mostert')._id,     season:2024, gamesPlayed:14, rushingYards: 741, rushingTDs: 8, receivingYards: 141, receivingTDs:1, receptions:22 }),
      sk({ player:p('Nick Chubb')._id,         season:2024, gamesPlayed: 5, rushingYards: 225, rushingTDs: 4, receivingYards:  18, receivingTDs:0, receptions: 4 }),
      sk({ player:p('Gus Edwards')._id,        season:2024, gamesPlayed:14, rushingYards: 669, rushingTDs: 7, receivingYards:  71, receivingTDs:0, receptions: 9 }),
      sk({ player:p('Jaylen Warren')._id,      season:2024, gamesPlayed:17, rushingYards: 491, rushingTDs: 3, receivingYards: 241, receivingTDs:2, receptions:29 }),
      sk({ player:p('Rico Dowdle')._id,        season:2024, gamesPlayed:17, rushingYards:1079, rushingTDs: 9, receivingYards: 225, receivingTDs:0, receptions:32 }),
      sk({ player:p('James Conner')._id,       season:2024, gamesPlayed:14, rushingYards: 682, rushingTDs: 5, receivingYards: 244, receivingTDs:1, receptions:33 }),
      sk({ player:p('Zamir White')._id,        season:2024, gamesPlayed:16, rushingYards: 785, rushingTDs: 7, receivingYards: 117, receivingTDs:0, receptions:16 }),
      sk({ player:p('Tank Bigsby')._id,        season:2024, gamesPlayed:17, rushingYards: 638, rushingTDs: 4, receivingYards:  98, receivingTDs:1, receptions:13 }),
      sk({ player:p('Blake Corum')._id,        season:2024, gamesPlayed:14, rushingYards: 423, rushingTDs: 5, receivingYards: 101, receivingTDs:0, receptions:14 }),
      sk({ player:p('Kendre Miller')._id,      season:2024, gamesPlayed:12, rushingYards: 614, rushingTDs: 5, receivingYards: 111, receivingTDs:0, receptions:15 }),
      sk({ player:p('Tyrone Tracy Jr.')._id,   season:2024, gamesPlayed:14, rushingYards: 601, rushingTDs: 4, receivingYards: 150, receivingTDs:0, receptions:19 }),

      /* WRs */
      sk({ player:p("Ja'Marr Chase")._id,      season:2024, gamesPlayed:17, receivingYards:1708, receivingTDs:17, receptions:100 }),
      sk({ player:p('CeeDee Lamb')._id,        season:2024, gamesPlayed:17, receivingYards:1194, receivingTDs:11, receptions: 95 }),
      sk({ player:p('Amon-Ra St. Brown')._id,  season:2024, gamesPlayed:17, receivingYards:1263, receivingTDs:10, receptions:119 }),
      sk({ player:p('Tyreek Hill')._id,        season:2024, gamesPlayed:17, receivingYards:1100, receivingTDs: 6, receptions: 81 }),
      sk({ player:p('Justin Jefferson')._id,   season:2024, gamesPlayed:17, receivingYards:1533, receivingTDs:10, receptions:103 }),
      sk({ player:p('Puka Nacua')._id,         season:2024, gamesPlayed:17, receivingYards:1025, receivingTDs: 4, receptions: 94 }),
      sk({ player:p('A.J. Brown')._id,         season:2024, gamesPlayed:16, receivingYards:1020, receivingTDs: 7, receptions: 67 }),
      sk({ player:p('Malik Nabers')._id,       season:2024, gamesPlayed:16, receivingYards:1204, receivingTDs: 7, receptions:109 }),
      sk({ player:p('Brian Thomas Jr.')._id,   season:2024, gamesPlayed:17, receivingYards:1282, receivingTDs:10, receptions: 87 }),
      sk({ player:p('Drake London')._id,       season:2024, gamesPlayed:17, receivingYards:1271, receivingTDs: 6, receptions:100 }),
      sk({ player:p('Zay Flowers')._id,        season:2024, gamesPlayed:17, receivingYards:1138, receivingTDs: 6, receptions: 97 }),
      sk({ player:p('Terry McLaurin')._id,     season:2024, gamesPlayed:17, receivingYards:1096, receivingTDs:13, receptions: 68 }),
      sk({ player:p('Mike Evans')._id,         season:2024, gamesPlayed:17, receivingYards:1006, receivingTDs: 9, receptions: 65 }),
      sk({ player:p('Ladd McConkey')._id,      season:2024, gamesPlayed:17, receivingYards:1149, receivingTDs: 6, receptions: 82 }),
      sk({ player:p('Tee Higgins')._id,        season:2024, gamesPlayed:12, receivingYards: 911, receivingTDs:10, receptions: 60 }),
      sk({ player:p('Courtland Sutton')._id,   season:2024, gamesPlayed:17, receivingYards:1081, receivingTDs:10, receptions: 72 }),
      sk({ player:p('Chris Olave')._id,        season:2024, gamesPlayed: 9, receivingYards: 757, receivingTDs: 2, receptions: 47 }),
      sk({ player:p('DeVonta Smith')._id,      season:2024, gamesPlayed:16, receivingYards: 833, receivingTDs: 6, receptions: 72 }),
      sk({ player:p('Stefon Diggs')._id,       season:2024, gamesPlayed: 8, receivingYards: 496, receivingTDs: 2, receptions: 47 }),
      sk({ player:p('Davante Adams')._id,      season:2024, gamesPlayed:16, receivingYards:1144, receivingTDs: 7, receptions:100 }),
      sk({ player:p('George Pickens')._id,     season:2024, gamesPlayed:16, receivingYards: 900, receivingTDs: 3, receptions: 59 }),
      sk({ player:p('Jaylen Waddle')._id,      season:2024, gamesPlayed:14, receivingYards: 936, receivingTDs: 7, receptions: 69 }),
      sk({ player:p('DJ Moore')._id,           season:2024, gamesPlayed:17, receivingYards:1064, receivingTDs: 8, receptions: 77 }),
      sk({ player:p('Brandon Aiyuk')._id,      season:2024, gamesPlayed:14, receivingYards:1012, receivingTDs: 6, receptions: 75 }),
      sk({ player:p('Rashee Rice')._id,        season:2024, gamesPlayed: 4, receivingYards: 288, receivingTDs: 3, receptions: 20 }),
      sk({ player:p('Xavier Worthy')._id,      season:2024, gamesPlayed:17, receivingYards: 638, receivingTDs: 7, receptions: 59 }),
      sk({ player:p('Rome Odunze')._id,        season:2024, gamesPlayed:17, receivingYards: 709, receivingTDs: 4, receptions: 61 }),
      sk({ player:p('Marvin Harrison Jr.')._id,season:2024, gamesPlayed:17, receivingYards:1023, receivingTDs: 8, receptions: 66 }),
      sk({ player:p('Jaxon Smith-Njigba')._id, season:2024, gamesPlayed:17, receivingYards:1130, receivingTDs: 5, receptions:100 }),
      sk({ player:p('DeAndre Hopkins')._id,    season:2024, gamesPlayed:14, receivingYards: 821, receivingTDs: 4, receptions: 69 }),
      sk({ player:p('Jerry Jeudy')._id,        season:2024, gamesPlayed:16, receivingYards: 741, receivingTDs: 4, receptions: 63 }),
      sk({ player:p('Keenan Allen')._id,       season:2024, gamesPlayed:17, receivingYards: 765, receivingTDs: 4, receptions: 72 }),
      sk({ player:p('Adam Thielen')._id,       season:2024, gamesPlayed:14, receivingYards: 614, receivingTDs: 5, receptions: 56 }),
      sk({ player:p('Tank Dell')._id,          season:2024, gamesPlayed: 7, receivingYards: 398, receivingTDs: 3, receptions: 35 }),
      sk({ player:p('Quentin Johnston')._id,   season:2024, gamesPlayed:16, receivingYards: 594, receivingTDs: 3, receptions: 47 }),
      sk({ player:p('Diontae Johnson')._id,    season:2024, gamesPlayed:15, receivingYards: 717, receivingTDs: 4, receptions: 72 }),

      /* TEs */
      sk({ player:p('Trey McBride')._id,       season:2024, gamesPlayed:17, receivingYards:1146, receivingTDs: 6, receptions:111 }),
      sk({ player:p('Sam LaPorta')._id,        season:2024, gamesPlayed:17, receivingYards: 777, receivingTDs:10, receptions: 72 }),
      sk({ player:p('Mark Andrews')._id,       season:2024, gamesPlayed:17, receivingYards: 886, receivingTDs: 6, receptions: 67 }),
      sk({ player:p('Travis Kelce')._id,       season:2024, gamesPlayed:17, receivingYards: 823, receivingTDs: 3, receptions: 62 }),
      sk({ player:p('Evan Engram')._id,        season:2024, gamesPlayed:17, receivingYards: 858, receivingTDs: 4, receptions: 76 }),
      sk({ player:p('Jake Ferguson')._id,      season:2024, gamesPlayed:17, receivingYards: 812, receivingTDs: 6, receptions: 73 }),
      sk({ player:p('Cole Kmet')._id,          season:2024, gamesPlayed:17, receivingYards: 719, receivingTDs: 6, receptions: 77 }),
      sk({ player:p('David Njoku')._id,        season:2024, gamesPlayed:17, receivingYards: 765, receivingTDs: 5, receptions: 61 }),
      sk({ player:p('Pat Freiermuth')._id,     season:2024, gamesPlayed:17, receivingYards: 700, receivingTDs: 7, receptions: 64 }),
      sk({ player:p('Kyle Pitts')._id,         season:2024, gamesPlayed:17, receivingYards: 790, receivingTDs: 3, receptions: 72 }),
      sk({ player:p('Dallas Goedert')._id,     season:2024, gamesPlayed:14, receivingYards: 830, receivingTDs: 5, receptions: 68 }),
      sk({ player:p('Dalton Kincaid')._id,     season:2024, gamesPlayed:12, receivingYards: 548, receivingTDs: 2, receptions: 51 }),
      sk({ player:p('Isaiah Likely')._id,      season:2024, gamesPlayed:17, receivingYards: 713, receivingTDs: 7, receptions: 65 }),
      sk({ player:p('Jonnu Smith')._id,        season:2024, gamesPlayed:17, receivingYards: 884, receivingTDs: 8, receptions: 73 }),
      sk({ player:p('Cade Otton')._id,         season:2024, gamesPlayed:17, receivingYards: 516, receivingTDs: 4, receptions: 52 }),
      sk({ player:p('Gerald Everett')._id,     season:2024, gamesPlayed:14, receivingYards: 492, receivingTDs: 3, receptions: 46 }),
    ]);
    console.log('Stats seeded (120)');

    /* ── Watchlists ──────────────────────────────────────── */
    const wl1 = await Watchlist.create({ name:'Top QBs 2024',  description:'Best QBs this season',         owner:john._id });
    const wl2 = await Watchlist.create({ name:'Fantasy Picks', description:'My must-have fantasy players', owner:john._id });
    const wl3 = await Watchlist.create({ name:'Speed Demons',  description:'Fastest playmakers in NFL',    owner:jane._id });

    await WatchlistPlayer.insertMany([
      { watchlist:wl1._id, player:p('Lamar Jackson')._id },
      { watchlist:wl1._id, player:p('Josh Allen')._id },
      { watchlist:wl1._id, player:p('Joe Burrow')._id },
      { watchlist:wl1._id, player:p('Patrick Mahomes')._id },
      { watchlist:wl2._id, player:p('Saquon Barkley')._id },
      { watchlist:wl2._id, player:p('Travis Kelce')._id },
      { watchlist:wl2._id, player:p("Ja'Marr Chase")._id },
      { watchlist:wl2._id, player:p('Justin Jefferson')._id },
      { watchlist:wl3._id, player:p('Tyreek Hill')._id },
      { watchlist:wl3._id, player:p("De'Von Achane")._id },
      { watchlist:wl3._id, player:p('Justin Jefferson')._id },
    ]);
    console.log('Watchlists seeded (3)');

    console.log('\n✅ Seed complete');
    console.log(`   FINAL PLAYER COUNT: ${players.length}`);
    console.log('   admin      / Admin123!');
    console.log('   john_doe   / Password1!');
    console.log('   jane_smith / Password1!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
