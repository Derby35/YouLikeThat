const express = require('express');
const router  = express.Router();
const { lookupEspnPlayer, getAllPlayers, getPlayerById, createPlayer, updatePlayer, deletePlayer, getPlayerAllStats, getPlayerStatsByYear, adminBatchUpdate } = require('../controllers/playerController');
const { protect, adminOnly } = require('../middleware/auth');

/* specific routes BEFORE /:id wildcard */
router.get('/espn-lookup', protect, adminOnly, lookupEspnPlayer);

router.get('/',     protect, getAllPlayers);
router.get('/:id/stats',       protect, getPlayerAllStats);
router.get('/:id/stats/:year', protect, getPlayerStatsByYear);
router.put('/:id/full',        protect, adminOnly, adminBatchUpdate);
router.get('/:id',  protect, getPlayerById);
router.post('/',    protect, adminOnly, createPlayer);
router.put('/:id',  protect, adminOnly, updatePlayer);
router.delete('/:id', protect, adminOnly, deletePlayer);

module.exports = router;
