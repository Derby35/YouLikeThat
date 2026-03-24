const Watchlist = require('../models/Watchlist');
const WatchlistPlayer = require('../models/WatchlistPlayer');

const getWatchlists = async (req, res) => {
  try {
    const watchlists = await Watchlist.find({ owner: req.user._id }).sort({ createdAt: -1 });

    // tack on player counts for each watchlist
    const withCounts = await Promise.all(
      watchlists.map(async (wl) => {
        const count = await WatchlistPlayer.countDocuments({ watchlist: wl._id });
        return { ...wl.toObject(), playerCount: count };
      })
    );
    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllWatchlistsAdmin = async (req, res) => {
  try {
    const watchlists = await Watchlist.find()
      .populate('owner', 'username')
      .sort({ createdAt: -1 });
    res.json(watchlists);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getWatchlistById = async (req, res) => {
  try {
    const watchlist = await Watchlist.findById(req.params.id).populate('owner', 'username');
    if (!watchlist) return res.status(404).json({ message: 'Watchlist not found' });

    if (
      watchlist.owner._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const entries = await WatchlistPlayer.find({ watchlist: watchlist._id })
      .populate('player', 'name position jerseyNumber teamName teamAbbr');

    res.json({ ...watchlist.toObject(), players: entries.map((e) => e.player) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createWatchlist = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const watchlist = await Watchlist.create({ name, description, owner: req.user._id });
    res.status(201).json(watchlist);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateWatchlist = async (req, res) => {
  try {
    const watchlist = await Watchlist.findById(req.params.id);
    if (!watchlist) return res.status(404).json({ message: 'Watchlist not found' });

    if (watchlist.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updated = await Watchlist.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteWatchlist = async (req, res) => {
  try {
    const watchlist = await Watchlist.findById(req.params.id);
    if (!watchlist) return res.status(404).json({ message: 'Watchlist not found' });

    if (watchlist.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await WatchlistPlayer.deleteMany({ watchlist: watchlist._id });
    await Watchlist.findByIdAndDelete(req.params.id);
    res.json({ message: 'Watchlist deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addPlayer = async (req, res) => {
  try {
    const watchlist = await Watchlist.findById(req.params.id);
    if (!watchlist) return res.status(404).json({ message: 'Watchlist not found' });

    if (watchlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { playerId } = req.body;
    const existing = await WatchlistPlayer.findOne({ watchlist: watchlist._id, player: playerId });
    if (existing) {
      return res.status(400).json({ message: 'Player already in this watchlist' });
    }

    await WatchlistPlayer.create({ watchlist: watchlist._id, player: playerId });
    res.status(201).json({ message: 'Player added to watchlist' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const removePlayer = async (req, res) => {
  try {
    const watchlist = await Watchlist.findById(req.params.id);
    if (!watchlist) return res.status(404).json({ message: 'Watchlist not found' });

    if (watchlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await WatchlistPlayer.findOneAndDelete({
      watchlist: watchlist._id,
      player: req.params.playerId
    });
    res.json({ message: 'Player removed from watchlist' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getWatchlists,
  getWatchlistById,
  createWatchlist,
  updateWatchlist,
  deleteWatchlist,
  addPlayer,
  removePlayer,
  getAllWatchlistsAdmin
};
