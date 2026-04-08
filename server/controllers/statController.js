const Stat = require('../models/Stat');

const getAllStats = async (req, res) => {
  try {
    const stats = await Stat.find()
      .populate('player', 'name position teamAbbr')
      .sort({ fantasyPoints: -1 });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getStatsByPlayer = async (req, res) => {
  try {
    const stats = await Stat.find({ player: req.params.playerId })
      .populate('player', 'name position teamAbbr')
      .sort({ season: -1 });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createStat = async (req, res) => {
  try {
    const stat = await Stat.create(req.body);
    res.status(201).json(stat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateStat = async (req, res) => {
  try {
    const stat = await Stat.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!stat) return res.status(404).json({ message: 'Stat not found' });
    res.json(stat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteStat = async (req, res) => {
  try {
    const stat = await Stat.findByIdAndDelete(req.params.id);
    if (!stat) return res.status(404).json({ message: 'Stat not found' });
    res.json({ message: 'Stat deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllStats, getStatsByPlayer, createStat, updateStat, deleteStat };
