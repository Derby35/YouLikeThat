require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User        = require('../models/User');
const Player      = require('../models/Player');
const Stat        = require('../models/Stat');
const Watchlist   = require('../models/Watchlist');
const WatchlistPlayer = require('../models/WatchlistPlayer');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
      User.deleteMany({}), Player.deleteMany({}), Stat.deleteMany({}),
      Watchlist.deleteMany({}), WatchlistPlayer.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // users
    const salt = await bcrypt.genSalt(10);
    const admin = await User.create({ username: 'admin',      passwordHash: await bcrypt.hash('Admin123!',  salt), role: 'admin' });
    const john  = await User.create({ username: 'john_doe',   passwordHash: await bcrypt.hash('Password1!', salt), role: 'standard' });
    const jane  = await User.create({ username: 'jane_smith', passwordHash: await bcrypt.hash('Password1!', salt), role: 'standard' });
    console.log('Users seeded (3)');

    // players - top NFL skill-position guys from the 2024 season
    const players = await Player.insertMany([
      // QBs
      { name: 'Lamar Jackson',        position: 'QB', jerseyNumber: 8,  teamName: 'Baltimore Ravens',         teamAbbr: 'BAL', age: 27 },
      { name: 'Josh Allen',           position: 'QB', jerseyNumber: 17, teamName: 'Buffalo Bills',            teamAbbr: 'BUF', age: 28 },
      { name: 'Jalen Hurts',          position: 'QB', jerseyNumber: 1,  teamName: 'Philadelphia Eagles',      teamAbbr: 'PHI', age: 26 },
      { name: 'Joe Burrow',           position: 'QB', jerseyNumber: 9,  teamName: 'Cincinnati Bengals',       teamAbbr: 'CIN', age: 28 },
      { name: 'Jayden Daniels',       position: 'QB', jerseyNumber: 5,  teamName: 'Washington Commanders',    teamAbbr: 'WSH', age: 23 },
      { name: 'Baker Mayfield',       position: 'QB', jerseyNumber: 6,  teamName: 'Tampa Bay Buccaneers',     teamAbbr: 'TB',  age: 30 },
      { name: 'Patrick Mahomes',      position: 'QB', jerseyNumber: 15, teamName: 'Kansas City Chiefs',       teamAbbr: 'KC',  age: 29 },
      { name: 'Sam Darnold',          position: 'QB', jerseyNumber: 14, teamName: 'Minnesota Vikings',        teamAbbr: 'MIN', age: 27 },
      { name: 'Brock Purdy',          position: 'QB', jerseyNumber: 13, teamName: 'San Francisco 49ers',      teamAbbr: 'SF',  age: 25 },
      { name: 'Jordan Love',          position: 'QB', jerseyNumber: 10, teamName: 'Green Bay Packers',        teamAbbr: 'GB',  age: 26 },
      { name: 'Caleb Williams',       position: 'QB', jerseyNumber: 18, teamName: 'Chicago Bears',            teamAbbr: 'CHI', age: 23 },
      { name: 'Tua Tagovailoa',       position: 'QB', jerseyNumber: 1,  teamName: 'Miami Dolphins',           teamAbbr: 'MIA', age: 26 },
      { name: 'Justin Herbert',       position: 'QB', jerseyNumber: 10, teamName: 'Los Angeles Chargers',     teamAbbr: 'LAC', age: 26 },
      { name: 'Anthony Richardson',   position: 'QB', jerseyNumber: 5,  teamName: 'Indianapolis Colts',       teamAbbr: 'IND', age: 22 },
      { name: 'Dak Prescott',         position: 'QB', jerseyNumber: 4,  teamName: 'Dallas Cowboys',           teamAbbr: 'DAL', age: 31 },
      { name: 'Geno Smith',           position: 'QB', jerseyNumber: 7,  teamName: 'Seattle Seahawks',         teamAbbr: 'SEA', age: 34 },

      // RBs
      { name: 'Saquon Barkley',       position: 'RB', jerseyNumber: 26, teamName: 'Philadelphia Eagles',      teamAbbr: 'PHI', age: 27 },
      { name: 'Derrick Henry',        position: 'RB', jerseyNumber: 22, teamName: 'Baltimore Ravens',         teamAbbr: 'BAL', age: 30 },
      { name: 'Christian McCaffrey',  position: 'RB', jerseyNumber: 23, teamName: 'San Francisco 49ers',      teamAbbr: 'SF',  age: 28 },
      { name: "De'Von Achane",        position: 'RB', jerseyNumber: 28, teamName: 'Miami Dolphins',           teamAbbr: 'MIA', age: 23 },
      { name: 'Bijan Robinson',       position: 'RB', jerseyNumber: 7,  teamName: 'Atlanta Falcons',          teamAbbr: 'ATL', age: 23 },
      { name: 'Josh Jacobs',          position: 'RB', jerseyNumber: 8,  teamName: 'Green Bay Packers',        teamAbbr: 'GB',  age: 26 },
      { name: 'Kyren Williams',       position: 'RB', jerseyNumber: 23, teamName: 'Los Angeles Rams',         teamAbbr: 'LAR', age: 24 },
      { name: 'James Cook',           position: 'RB', jerseyNumber: 4,  teamName: 'Buffalo Bills',            teamAbbr: 'BUF', age: 24 },
      { name: 'Breece Hall',          position: 'RB', jerseyNumber: 20, teamName: 'New York Jets',            teamAbbr: 'NYJ', age: 23 },
      { name: 'Jonathan Taylor',      position: 'RB', jerseyNumber: 28, teamName: 'Indianapolis Colts',       teamAbbr: 'IND', age: 25 },
      { name: 'Travis Etienne',       position: 'RB', jerseyNumber: 1,  teamName: 'Jacksonville Jaguars',     teamAbbr: 'JAX', age: 25 },
      { name: 'Brian Robinson Jr.',   position: 'RB', jerseyNumber: 8,  teamName: 'Washington Commanders',    teamAbbr: 'WSH', age: 25 },
      { name: 'Tony Pollard',         position: 'RB', jerseyNumber: 20, teamName: 'Tennessee Titans',         teamAbbr: 'TEN', age: 27 },
      { name: 'Rachaad White',        position: 'RB', jerseyNumber: 29, teamName: 'Tampa Bay Buccaneers',     teamAbbr: 'TB',  age: 26 },
      { name: "D'Andre Swift",        position: 'RB', jerseyNumber: 0,  teamName: 'Chicago Bears',            teamAbbr: 'CHI', age: 25 },
      { name: 'Aaron Jones Sr.',      position: 'RB', jerseyNumber: 33, teamName: 'Minnesota Vikings',        teamAbbr: 'MIN', age: 30 },

      // WRs
      { name: "Ja'Marr Chase",        position: 'WR', jerseyNumber: 1,  teamName: 'Cincinnati Bengals',       teamAbbr: 'CIN', age: 24 },
      { name: 'CeeDee Lamb',          position: 'WR', jerseyNumber: 88, teamName: 'Dallas Cowboys',           teamAbbr: 'DAL', age: 25 },
      { name: 'Amon-Ra St. Brown',    position: 'WR', jerseyNumber: 14, teamName: 'Detroit Lions',            teamAbbr: 'DET', age: 24 },
      { name: 'Tyreek Hill',          position: 'WR', jerseyNumber: 10, teamName: 'Miami Dolphins',           teamAbbr: 'MIA', age: 30 },
      { name: 'Justin Jefferson',     position: 'WR', jerseyNumber: 18, teamName: 'Minnesota Vikings',        teamAbbr: 'MIN', age: 25 },
      { name: 'Puka Nacua',           position: 'WR', jerseyNumber: 17, teamName: 'Los Angeles Rams',         teamAbbr: 'LAR', age: 23 },
      { name: 'A.J. Brown',           position: 'WR', jerseyNumber: 11, teamName: 'Philadelphia Eagles',      teamAbbr: 'PHI', age: 27 },
      { name: 'Malik Nabers',         position: 'WR', jerseyNumber: 1,  teamName: 'New York Giants',          teamAbbr: 'NYG', age: 21 },
      { name: 'Brian Thomas Jr.',     position: 'WR', jerseyNumber: 7,  teamName: 'Jacksonville Jaguars',     teamAbbr: 'JAX', age: 22 },
      { name: 'Drake London',         position: 'WR', jerseyNumber: 5,  teamName: 'Atlanta Falcons',          teamAbbr: 'ATL', age: 23 },
      { name: 'Zay Flowers',          position: 'WR', jerseyNumber: 4,  teamName: 'Baltimore Ravens',         teamAbbr: 'BAL', age: 23 },
      { name: 'Terry McLaurin',       position: 'WR', jerseyNumber: 17, teamName: 'Washington Commanders',    teamAbbr: 'WSH', age: 29 },
      { name: 'Mike Evans',           position: 'WR', jerseyNumber: 13, teamName: 'Tampa Bay Buccaneers',     teamAbbr: 'TB',  age: 31 },
      { name: 'Ladd McConkey',        position: 'WR', jerseyNumber: 15, teamName: 'Los Angeles Chargers',     teamAbbr: 'LAC', age: 23 },
      { name: 'Keenan Allen',         position: 'WR', jerseyNumber: 13, teamName: 'Chicago Bears',            teamAbbr: 'CHI', age: 32 },
      { name: 'Tee Higgins',          position: 'WR', jerseyNumber: 5,  teamName: 'Cincinnati Bengals',       teamAbbr: 'CIN', age: 25 },
      { name: 'Courtland Sutton',     position: 'WR', jerseyNumber: 14, teamName: 'Denver Broncos',           teamAbbr: 'DEN', age: 29 },
      { name: 'Chris Olave',          position: 'WR', jerseyNumber: 12, teamName: 'New Orleans Saints',       teamAbbr: 'NO',  age: 24 },
      { name: 'DeVonta Smith',        position: 'WR', jerseyNumber: 6,  teamName: 'Philadelphia Eagles',      teamAbbr: 'PHI', age: 26 },
      { name: 'Stefon Diggs',         position: 'WR', jerseyNumber: 14, teamName: 'Houston Texans',           teamAbbr: 'HOU', age: 31 },

      // TEs
      { name: 'Trey McBride',         position: 'TE', jerseyNumber: 85, teamName: 'Arizona Cardinals',        teamAbbr: 'ARI', age: 24 },
      { name: 'Sam LaPorta',          position: 'TE', jerseyNumber: 85, teamName: 'Detroit Lions',            teamAbbr: 'DET', age: 23 },
      { name: 'Mark Andrews',         position: 'TE', jerseyNumber: 89, teamName: 'Baltimore Ravens',         teamAbbr: 'BAL', age: 29 },
      { name: 'Travis Kelce',         position: 'TE', jerseyNumber: 87, teamName: 'Kansas City Chiefs',       teamAbbr: 'KC',  age: 35 },
      { name: 'Evan Engram',          position: 'TE', jerseyNumber: 17, teamName: 'Jacksonville Jaguars',     teamAbbr: 'JAX', age: 30 },
      { name: 'Jake Ferguson',        position: 'TE', jerseyNumber: 87, teamName: 'Dallas Cowboys',           teamAbbr: 'DAL', age: 24 },
      { name: 'Cole Kmet',            position: 'TE', jerseyNumber: 85, teamName: 'Chicago Bears',            teamAbbr: 'CHI', age: 25 },
      { name: 'David Njoku',          position: 'TE', jerseyNumber: 85, teamName: 'Cleveland Browns',         teamAbbr: 'CLE', age: 28 },
      { name: 'Pat Freiermuth',       position: 'TE', jerseyNumber: 88, teamName: 'Pittsburgh Steelers',      teamAbbr: 'PIT', age: 25 },
      { name: 'Kyle Pitts',           position: 'TE', jerseyNumber: 8,  teamName: 'Atlanta Falcons',          teamAbbr: 'ATL', age: 24 },
    ]);

    const p = (name) => players.find((x) => x.name === name);
    console.log(`Players seeded (${players.length})`);

    // stats (2024 season)
    await Stat.insertMany([
      // QBs
      { player: p('Lamar Jackson')._id,       season: 2024, gamesPlayed: 17, passingYards: 4172, passingTDs: 41, interceptions: 4,  rushingYards: 915, rushingTDs: 4,  fantasyPoints: 532.1 },
      { player: p('Josh Allen')._id,          season: 2024, gamesPlayed: 17, passingYards: 3731, passingTDs: 28, interceptions: 6,  rushingYards: 531, rushingTDs: 12, fantasyPoints: 448.9 },
      { player: p('Jalen Hurts')._id,         season: 2024, gamesPlayed: 16, passingYards: 3903, passingTDs: 35, interceptions: 7,  rushingYards: 629, rushingTDs: 14, fantasyPoints: 468.8 },
      { player: p('Joe Burrow')._id,          season: 2024, gamesPlayed: 17, passingYards: 4918, passingTDs: 43, interceptions: 6,  rushingYards: 89,  rushingTDs: 2,  fantasyPoints: 421.0 },
      { player: p('Jayden Daniels')._id,      season: 2024, gamesPlayed: 17, passingYards: 3568, passingTDs: 25, interceptions: 9,  rushingYards: 891, rushingTDs: 6,  fantasyPoints: 387.6 },
      { player: p('Baker Mayfield')._id,      season: 2024, gamesPlayed: 17, passingYards: 4500, passingTDs: 41, interceptions: 9,  rushingYards: 98,  rushingTDs: 2,  fantasyPoints: 388.0 },
      { player: p('Patrick Mahomes')._id,     season: 2024, gamesPlayed: 17, passingYards: 4183, passingTDs: 31, interceptions: 11, rushingYards: 389, rushingTDs: 4,  fantasyPoints: 362.5 },
      { player: p('Sam Darnold')._id,         season: 2024, gamesPlayed: 14, passingYards: 3718, passingTDs: 35, interceptions: 12, rushingYards: 108, rushingTDs: 1,  fantasyPoints: 315.7 },
      { player: p('Brock Purdy')._id,         season: 2024, gamesPlayed: 17, passingYards: 4280, passingTDs: 28, interceptions: 12, rushingYards: 141, rushingTDs: 2,  fantasyPoints: 330.5 },
      { player: p('Jordan Love')._id,         season: 2024, gamesPlayed: 16, passingYards: 4159, passingTDs: 25, interceptions: 11, rushingYards: 63,  rushingTDs: 2,  fantasyPoints: 300.2 },
      { player: p('Caleb Williams')._id,      season: 2024, gamesPlayed: 17, passingYards: 3541, passingTDs: 20, interceptions: 6,  rushingYards: 226, rushingTDs: 4,  fantasyPoints: 309.7 },
      { player: p('Tua Tagovailoa')._id,      season: 2024, gamesPlayed: 8,  passingYards: 2165, passingTDs: 16, interceptions: 8,  rushingYards: 60,  rushingTDs: 0,  fantasyPoints: 186.8 },
      { player: p('Justin Herbert')._id,      season: 2024, gamesPlayed: 17, passingYards: 3870, passingTDs: 23, interceptions: 9,  rushingYards: 107, rushingTDs: 2,  fantasyPoints: 299.8 },
      { player: p('Anthony Richardson')._id,  season: 2024, gamesPlayed: 11, passingYards: 1814, passingTDs: 10, interceptions: 7,  rushingYards: 534, rushingTDs: 8,  fantasyPoints: 274.6 },
      { player: p('Dak Prescott')._id,        season: 2024, gamesPlayed: 8,  passingYards: 1978, passingTDs: 11, interceptions: 4,  rushingYards: 37,  rushingTDs: 0,  fantasyPoints: 162.0 },
      { player: p('Geno Smith')._id,          season: 2024, gamesPlayed: 14, passingYards: 2666, passingTDs: 20, interceptions: 8,  rushingYards: 105, rushingTDs: 0,  fantasyPoints: 216.2 },

      // RBs
      { player: p('Saquon Barkley')._id,      season: 2024, gamesPlayed: 17, rushingYards: 2005, rushingTDs: 13, receivingYards: 278,  receivingTDs: 2, receptions: 35, fantasyPoints: 389.3 },
      { player: p('Derrick Henry')._id,       season: 2024, gamesPlayed: 16, rushingYards: 1921, rushingTDs: 16, receivingYards: 120,  receivingTDs: 1, receptions: 18, fantasyPoints: 384.1 },
      { player: p('Christian McCaffrey')._id, season: 2024, gamesPlayed: 16, rushingYards: 1459, rushingTDs: 14, receivingYards: 328,  receivingTDs: 3, receptions: 43, fantasyPoints: 381.9 },
      { player: p("De'Von Achane")._id,       season: 2024, gamesPlayed: 13, rushingYards: 905,  rushingTDs: 8,  receivingYards: 426,  receivingTDs: 4, receptions: 52, fantasyPoints: 286.1 },
      { player: p('Bijan Robinson')._id,      season: 2024, gamesPlayed: 17, rushingYards: 1074, rushingTDs: 7,  receivingYards: 614,  receivingTDs: 4, receptions: 75, fantasyPoints: 286.8 },
      { player: p('Josh Jacobs')._id,         season: 2024, gamesPlayed: 17, rushingYards: 1329, rushingTDs: 15, receivingYards: 301,  receivingTDs: 1, receptions: 38, fantasyPoints: 330.9 },
      { player: p('Kyren Williams')._id,      season: 2024, gamesPlayed: 15, rushingYards: 1170, rushingTDs: 12, receivingYards: 283,  receivingTDs: 2, receptions: 38, fantasyPoints: 311.3 },
      { player: p('James Cook')._id,          season: 2024, gamesPlayed: 17, rushingYards: 1009, rushingTDs: 16, receivingYards: 342,  receivingTDs: 0, receptions: 44, fantasyPoints: 282.9 },
      { player: p('Breece Hall')._id,         season: 2024, gamesPlayed: 17, rushingYards: 994,  rushingTDs: 9,  receivingYards: 591,  receivingTDs: 2, receptions: 55, fantasyPoints: 278.5 },
      { player: p('Jonathan Taylor')._id,     season: 2024, gamesPlayed: 17, rushingYards: 1054, rushingTDs: 11, receivingYards: 234,  receivingTDs: 1, receptions: 32, fantasyPoints: 266.4 },
      { player: p('Travis Etienne')._id,      season: 2024, gamesPlayed: 17, rushingYards: 760,  rushingTDs: 5,  receivingYards: 392,  receivingTDs: 2, receptions: 50, fantasyPoints: 199.2 },
      { player: p('Brian Robinson Jr.')._id,  season: 2024, gamesPlayed: 17, rushingYards: 1104, rushingTDs: 7,  receivingYards: 106,  receivingTDs: 0, receptions: 15, fantasyPoints: 186.4 },
      { player: p('Tony Pollard')._id,        season: 2024, gamesPlayed: 17, rushingYards: 803,  rushingTDs: 4,  receivingYards: 199,  receivingTDs: 2, receptions: 30, fantasyPoints: 172.3 },
      { player: p('Rachaad White')._id,       season: 2024, gamesPlayed: 17, rushingYards: 990,  rushingTDs: 7,  receivingYards: 288,  receivingTDs: 1, receptions: 37, fantasyPoints: 238.8 },
      { player: p("D'Andre Swift")._id,       season: 2024, gamesPlayed: 17, rushingYards: 784,  rushingTDs: 6,  receivingYards: 214,  receivingTDs: 1, receptions: 30, fantasyPoints: 185.4 },
      { player: p('Aaron Jones Sr.')._id,     season: 2024, gamesPlayed: 17, rushingYards: 794,  rushingTDs: 7,  receivingYards: 391,  receivingTDs: 3, receptions: 58, fantasyPoints: 246.1 },

      // WRs
      { player: p("Ja'Marr Chase")._id,       season: 2024, gamesPlayed: 17, receivingYards: 1708, receivingTDs: 17, receptions: 100, fantasyPoints: 388.8 },
      { player: p('CeeDee Lamb')._id,         season: 2024, gamesPlayed: 17, receivingYards: 1194, receivingTDs: 11, receptions: 95,  fantasyPoints: 290.4 },
      { player: p('Amon-Ra St. Brown')._id,   season: 2024, gamesPlayed: 17, receivingYards: 1263, receivingTDs: 10, receptions: 119, fantasyPoints: 316.3 },
      { player: p('Tyreek Hill')._id,         season: 2024, gamesPlayed: 17, receivingYards: 1100, receivingTDs: 6,  receptions: 81,  fantasyPoints: 230.0 },
      { player: p('Justin Jefferson')._id,    season: 2024, gamesPlayed: 17, receivingYards: 1533, receivingTDs: 10, receptions: 103, fantasyPoints: 336.3 },
      { player: p('Puka Nacua')._id,          season: 2024, gamesPlayed: 17, receivingYards: 1025, receivingTDs: 4,  receptions: 94,  fantasyPoints: 230.5 },
      { player: p('A.J. Brown')._id,          season: 2024, gamesPlayed: 16, receivingYards: 1020, receivingTDs: 7,  receptions: 67,  fantasyPoints: 221.0 },
      { player: p('Malik Nabers')._id,        season: 2024, gamesPlayed: 16, receivingYards: 1204, receivingTDs: 7,  receptions: 109, fantasyPoints: 291.4 },
      { player: p('Brian Thomas Jr.')._id,    season: 2024, gamesPlayed: 17, receivingYards: 1282, receivingTDs: 10, receptions: 87,  fantasyPoints: 297.2 },
      { player: p('Drake London')._id,        season: 2024, gamesPlayed: 17, receivingYards: 1271, receivingTDs: 6,  receptions: 100, fantasyPoints: 287.1 },
      { player: p('Zay Flowers')._id,         season: 2024, gamesPlayed: 17, receivingYards: 1138, receivingTDs: 6,  receptions: 97,  fantasyPoints: 269.8 },
      { player: p('Terry McLaurin')._id,      season: 2024, gamesPlayed: 17, receivingYards: 1096, receivingTDs: 13, receptions: 68,  fantasyPoints: 285.6 },
      { player: p('Mike Evans')._id,          season: 2024, gamesPlayed: 17, receivingYards: 1006, receivingTDs: 9,  receptions: 65,  fantasyPoints: 230.6 },
      { player: p('Ladd McConkey')._id,       season: 2024, gamesPlayed: 17, receivingYards: 1149, receivingTDs: 6,  receptions: 82,  fantasyPoints: 261.9 },
      { player: p('Keenan Allen')._id,        season: 2024, gamesPlayed: 17, receivingYards: 765,  receivingTDs: 4,  receptions: 72,  fantasyPoints: 188.5 },
      { player: p('Tee Higgins')._id,         season: 2024, gamesPlayed: 12, receivingYards: 911,  receivingTDs: 10, receptions: 60,  fantasyPoints: 221.1 },
      { player: p('Courtland Sutton')._id,    season: 2024, gamesPlayed: 17, receivingYards: 1081, receivingTDs: 10, receptions: 72,  fantasyPoints: 258.1 },
      { player: p('Chris Olave')._id,         season: 2024, gamesPlayed: 9,  receivingYards: 757,  receivingTDs: 2,  receptions: 47,  fantasyPoints: 170.7 },
      { player: p('DeVonta Smith')._id,       season: 2024, gamesPlayed: 16, receivingYards: 833,  receivingTDs: 6,  receptions: 72,  fantasyPoints: 211.3 },
      { player: p('Stefon Diggs')._id,        season: 2024, gamesPlayed: 8,  receivingYards: 496,  receivingTDs: 2,  receptions: 47,  fantasyPoints: 115.6 },

      // TEs
      { player: p('Trey McBride')._id,        season: 2024, gamesPlayed: 17, receivingYards: 1146, receivingTDs: 6,  receptions: 111, fantasyPoints: 281.6 },
      { player: p('Sam LaPorta')._id,         season: 2024, gamesPlayed: 17, receivingYards: 777,  receivingTDs: 10, receptions: 72,  fantasyPoints: 207.7 },
      { player: p('Mark Andrews')._id,        season: 2024, gamesPlayed: 17, receivingYards: 886,  receivingTDs: 6,  receptions: 67,  fantasyPoints: 194.6 },
      { player: p('Travis Kelce')._id,        season: 2024, gamesPlayed: 17, receivingYards: 823,  receivingTDs: 3,  receptions: 62,  fantasyPoints: 148.3 },
      { player: p('Evan Engram')._id,         season: 2024, gamesPlayed: 17, receivingYards: 858,  receivingTDs: 4,  receptions: 76,  fantasyPoints: 196.8 },
      { player: p('Jake Ferguson')._id,       season: 2024, gamesPlayed: 17, receivingYards: 812,  receivingTDs: 6,  receptions: 73,  fantasyPoints: 192.2 },
      { player: p('Cole Kmet')._id,           season: 2024, gamesPlayed: 17, receivingYards: 719,  receivingTDs: 6,  receptions: 77,  fantasyPoints: 187.9 },
      { player: p('David Njoku')._id,         season: 2024, gamesPlayed: 17, receivingYards: 765,  receivingTDs: 5,  receptions: 61,  fantasyPoints: 172.5 },
      { player: p('Pat Freiermuth')._id,      season: 2024, gamesPlayed: 17, receivingYards: 700,  receivingTDs: 7,  receptions: 64,  fantasyPoints: 174.0 },
      { player: p('Kyle Pitts')._id,          season: 2024, gamesPlayed: 17, receivingYards: 790,  receivingTDs: 3,  receptions: 72,  fantasyPoints: 172.0 },
    ]);
    console.log('Stats seeded');

    // watchlists
    const wl1 = await Watchlist.create({ name: 'Top QBs 2024',   description: 'Best QBs this season',          owner: john._id });
    const wl2 = await Watchlist.create({ name: 'Fantasy Picks',  description: 'My must-have fantasy players',  owner: john._id });
    const wl3 = await Watchlist.create({ name: 'Speed Demons',   description: 'Fastest playmakers in the NFL', owner: jane._id });

    await WatchlistPlayer.insertMany([
      { watchlist: wl1._id, player: p('Lamar Jackson')._id },
      { watchlist: wl1._id, player: p('Josh Allen')._id },
      { watchlist: wl1._id, player: p('Joe Burrow')._id },
      { watchlist: wl1._id, player: p('Patrick Mahomes')._id },
      { watchlist: wl2._id, player: p('Saquon Barkley')._id },
      { watchlist: wl2._id, player: p('Travis Kelce')._id },
      { watchlist: wl2._id, player: p("Ja'Marr Chase")._id },
      { watchlist: wl2._id, player: p('Justin Jefferson')._id },
      { watchlist: wl3._id, player: p('Tyreek Hill')._id },
      { watchlist: wl3._id, player: p("De'Von Achane")._id },
      { watchlist: wl3._id, player: p('Justin Jefferson')._id },
    ]);
    console.log('Watchlists seeded (3)');

    console.log('\nSeed complete — 80 players with full 2024 stats');
    console.log('  admin      / Admin123!');
    console.log('  john_doe   / Password1!');
    console.log('  jane_smith / Password1!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
