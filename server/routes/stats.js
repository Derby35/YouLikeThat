const express = require('express');
const router = express.Router();
const { getAllStats, getStatsByPlayer, createStat, updateStat, deleteStat } = require('../controllers/statController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, getAllStats);
router.get('/player/:playerId', protect, getStatsByPlayer);
router.post('/', protect, adminOnly, createStat);
router.put('/:id', protect, adminOnly, updateStat);
router.delete('/:id', protect, adminOnly, deleteStat);

module.exports = router;
