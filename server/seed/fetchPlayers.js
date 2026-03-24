// one-time fetch of 2024 NFL stats from ESPN, saves top 120 players to mongo
// run: npm run fetch  (fall back to npm run seed if ESPN is down)

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const https = require('https');

const Player = require('../models/Player');
const Stat = require('../models/Stat');

// basic https GET with a 30s timeout
function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'YouLikeThat/1.0' } }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse failed for ' + url)); }
      });
    });
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout: ' + url)); });
    req.on('error', reject);
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// standard PPR scoring
function calcFantasyPoints(s) {
  return (
    (s.passingYards  / 25)  + (s.passingTDs    * 4)  - (s.interceptions * 2) +
    (s.rushingYards  / 10)  + (s.rushingTDs    * 6)  +
    (s.receivingYards / 10) + (s.receivingTDs  * 6)  + (s.receptions * 1)
  );
}

// grab 2024 regular-season stats for a single player from ESPN
async function fetchPlayerStats(espnId) {
  const url = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/athletes/${espnId}/statistics`;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const data = await get(url);
      const categories = data?.splits?.categories || [];

      const stat = {
        gamesPlayed: 0,
        passingYards: 0, passingTDs: 0, interceptions: 0,
        rushingYards: 0, rushingTDs: 0,
        receivingYards: 0, receivingTDs: 0, receptions: 0,
      };

      for (const cat of categories) {
        // each category has an array of {name, value} objects
        const statsArr = cat.stats || [];
        const pick = (label) => {
          const s = statsArr.find((s) => s.name === label);
          return s ? (parseFloat(s.value) || 0) : 0;
        };
        if (cat.name === 'general')   { stat.gamesPlayed   = pick('gamesPlayed'); }
        if (cat.name === 'passing')   { stat.passingYards   = pick('passingYards');   stat.passingTDs    = pick('passingTouchdowns'); stat.interceptions = pick('interceptions'); }
        if (cat.name === 'rushing')   { stat.rushingYards   = pick('rushingYards');   stat.rushingTDs    = pick('rushingTouchdowns'); }
        if (cat.name === 'receiving') { stat.receivingYards = pick('receivingYards'); stat.receivingTDs  = pick('receivingTouchdowns'); stat.receptions = pick('receptions'); }
      }

      stat.fantasyPoints = parseFloat(calcFantasyPoints(stat).toFixed(1));
      return stat;
    } catch { if (attempt < 2) await sleep(500); }
  }
  return null;
}

const SKILL_POSITIONS = new Set(['QB', 'RB', 'WR', 'TE']);

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Player.deleteMany({});
  await Stat.deleteMany({});
  console.log('Cleared existing players and stats');

  console.log('Fetching NFL teams...');
  const teamsData = await get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams?limit=32');
  const teams = teamsData?.sports?.[0]?.leagues?.[0]?.teams?.map((t) => t.team) || [];
  console.log(`Found ${teams.length} teams`);

  // pull every skill-position player off each team's roster
  const allPlayers = [];

  for (const team of teams) {
    process.stdout.write(`  ${team.abbreviation}...`);
    try {
      const rosterData = await get(
        `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${team.id}/roster`
      );
      const athletes = rosterData?.athletes || [];
      let teamCount = 0;

      for (const group of athletes) {
        for (const athlete of (group.items || [])) {
          const posAbbr = athlete.position?.abbreviation || '';
          if (!SKILL_POSITIONS.has(posAbbr)) continue;
          allPlayers.push({
            espnId:       String(athlete.id),
            name:         athlete.fullName || athlete.displayName,
            position:     posAbbr,
            jerseyNumber: parseInt(athlete.jersey) || null,
            teamName:     team.displayName,
            teamAbbr:     team.abbreviation,
            age:          athlete.age || null,
            headshotUrl:  athlete.headshot?.href || '',
          });
          teamCount++;
        }
      }
      process.stdout.write(` ${teamCount} players\n`);
    } catch (err) {
      process.stdout.write(` failed (${err.message})\n`);
    }
    await sleep(150);
  }

  console.log(`\nTotal roster players: ${allPlayers.length}`);
  console.log('Fetching 2024 stats for each player...');

  const enriched = [];
  let done = 0;
  for (const p of allPlayers) {
    const stats = await fetchPlayerStats(p.espnId);
    enriched.push({ player: p, stats });
    done++;
    if (done % 50 === 0) {
      console.log(`  ${done}/${allPlayers.length} (${Math.round(done / allPlayers.length * 100)}%) done`);
    }
    await sleep(80);
  }

  // keep only the top 120 by fantasy points -- bench warmers fall off
  enriched.sort((a, b) => (b.stats?.fantasyPoints ?? 0) - (a.stats?.fantasyPoints ?? 0));
  const top120 = enriched.slice(0, 120);

  const insertedPlayers = await Player.insertMany(top120.map((e) => e.player));
  console.log(`Inserted ${insertedPlayers.length} players`);

  const statDocs = [];
  for (let i = 0; i < insertedPlayers.length; i++) {
    const s = top120[i].stats;
    if (!s) continue;
    statDocs.push({
      player: insertedPlayers[i]._id, season: 2024,
      gamesPlayed: s.gamesPlayed, passingYards: s.passingYards, passingTDs: s.passingTDs,
      interceptions: s.interceptions, rushingYards: s.rushingYards, rushingTDs: s.rushingTDs,
      receivingYards: s.receivingYards, receivingTDs: s.receivingTDs,
      receptions: s.receptions, fantasyPoints: s.fantasyPoints,
    });
  }
  await Stat.insertMany(statDocs);
  console.log(`Inserted ${statDocs.length} stat records`);

  console.log('\nTop 10 by fantasy points:');
  top120.slice(0, 10).forEach((e, i) =>
    console.log(`  ${i + 1}. ${e.player.name} (${e.player.position}, ${e.player.teamAbbr}) — ${e.stats?.fantasyPoints ?? 0} pts, ${e.stats?.gamesPlayed ?? 0} games`)
  );

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => { console.error('Fetch failed:', err.message); mongoose.disconnect(); process.exit(1); });
