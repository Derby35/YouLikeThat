const Player = require('../models/Player');

const getAllPlayers = async (req, res) => {
  try {
    const { teamAbbr, position, search } = req.query;
    const filter = {};
    if (teamAbbr) filter.teamAbbr = teamAbbr.toUpperCase();
    if (position)  filter.position = position;
    if (search)    filter.name = { $regex: search, $options: 'i' };

    // join stats so we can sort by fantasy points (they live on Stat, not Player)
    const players = await Player.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'stats',
          localField: '_id',
          foreignField: 'player',
          as: 'statData',
        },
      },
      {
        $addFields: {
          fantasyPoints: {
            $ifNull: [{ $arrayElemAt: ['$statData.fantasyPoints', 0] }, 0],
          },
        },
      },
      { $sort: { fantasyPoints: -1, name: 1 } },
      { $project: { statData: 0 } },
    ]);
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPlayerById = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ message: 'Player not found' });
    res.json(player);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createPlayer = async (req, res) => {
  try {
    const player = await Player.create(req.body);
    res.status(201).json(player);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updatePlayer = async (req, res) => {
  try {
    const player = await Player.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!player) return res.status(404).json({ message: 'Player not found' });
    res.json(player);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deletePlayer = async (req, res) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);
    if (!player) return res.status(404).json({ message: 'Player not found' });
    res.json({ message: 'Player deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllPlayers, getPlayerById, createPlayer, updatePlayer, deletePlayer };
