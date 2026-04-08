/**
 * populate-headshots.js
 *
 * Batch-populates espnId + headshotUrl for every player in the DB
 * that is missing one. Uses the same ESPN search API chain as the
 * live lookup endpoint. Adds a 700ms delay between calls to avoid
 * rate-limiting.
 *
 * Run from the server/ directory:
 *   node scripts/populate-headshots.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const https    = require('https');
const mongoose = require('mongoose');
const Player   = require('../models/Player');

/* ── HTTP helper ─────────────────────────────────────────── */
const fetchJson = (url) =>
  new Promise((resolve, reject) => {
    const opts = {
      headers: {
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept':          'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 10000,
    };
    const req = https.get(url, opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse failed: ${e.message}`)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
  });

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── ESPN lookup for a single player name ────────────────── */
const espnLookup = async (name) => {
  const url  = `https://site.api.espn.com/apis/search/v2?query=${encodeURIComponent(name)}&sport=football&league=nfl&limit=8`;
  const data = await fetchJson(url);

  const playerSection = (data?.results || []).find((r) => r.type === 'player');
  const hits          = (playerSection?.contents || []).filter((c) => c.uid?.includes('l:28'));

  if (!hits.length) return null;

  /* Try to find the best match by display name */
  const nameLower = name.toLowerCase().replace(/[^a-z ]/g, '');
  let hit = hits.find((c) => {
    const dn = (c.displayName || '').toLowerCase().replace(/[^a-z ]/g, '');
    return dn === nameLower;
  }) || hits[0]; // fall back to first result

  const espnId     = String(hit.uid || '').replace(/.*~a:/, '');
  const headshotUrl = `https://a.espncdn.com/i/headshots/nfl/players/full/${espnId}.png`;

  return { espnId, headshotUrl, displayName: hit.displayName };
};

/* ── Main ────────────────────────────────────────────────── */
const main = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  const allPlayers = await Player.find({}, 'name headshotUrl espnId');
  /* Process ALL players so we can re-run safely if something missed */
  const toProcess  = allPlayers.filter((p) => !p.espnId || !p.headshotUrl);

  console.log(`Players to update: ${toProcess.length} / ${allPlayers.length}\n`);

  let ok = 0, fail = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const player = toProcess[i];
    process.stdout.write(`[${i + 1}/${toProcess.length}] ${player.name.padEnd(30)} `);

    try {
      await delay(700); // polite rate-limit buffer
      const result = await espnLookup(player.name);

      if (result && result.espnId) {
        await Player.updateOne(
          { _id: player._id },
          { espnId: result.espnId, headshotUrl: result.headshotUrl }
        );
        console.log(`✓  id:${result.espnId}  (${result.displayName})`);
        ok++;
      } else {
        console.log('✗  not found on ESPN');
        fail++;
      }
    } catch (err) {
      console.log(`✗  error: ${err.message}`);
      fail++;
      await delay(1500); // extra pause after an error
    }
  }

  console.log(`\n${'─'.repeat(55)}`);
  console.log(`✅  Done:  ${ok} updated,  ${fail} failed`);

  if (fail > 0) {
    console.log('\nPlayers that failed (re-run the script to retry):');
    const stillMissing = await Player.find({ $or: [{ espnId: '' }, { headshotUrl: '' }] }, 'name');
    stillMissing.forEach((p) => console.log('  •', p.name));
  }

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error('Fatal error:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
