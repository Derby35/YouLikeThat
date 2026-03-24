const mongoose = require('mongoose');

// many-to-many join table between watchlists and players
const watchlistPlayerSchema = new mongoose.Schema({
  watchlist: { type: mongoose.Schema.Types.ObjectId, ref: 'Watchlist', required: true },
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  addedAt: { type: Date, default: Date.now }
});

watchlistPlayerSchema.index({ watchlist: 1, player: 1 }, { unique: true });

module.exports = mongoose.model('WatchlistPlayer', watchlistPlayerSchema);
