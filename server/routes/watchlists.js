const express = require('express');
const router = express.Router();
const {
  getWatchlists,
  getWatchlistById,
  createWatchlist,
  updateWatchlist,
  deleteWatchlist,
  addPlayer,
  removePlayer,
  getAllWatchlistsAdmin
} = require('../controllers/watchlistController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, getWatchlists);
router.get('/admin/all', protect, adminOnly, getAllWatchlistsAdmin);
router.get('/:id', protect, getWatchlistById);
router.post('/', protect, createWatchlist);
router.put('/:id', protect, updateWatchlist);
router.delete('/:id', protect, deleteWatchlist);
router.post('/:id/players', protect, addPlayer);
router.delete('/:id/players/:playerId', protect, removePlayer);

module.exports = router;
