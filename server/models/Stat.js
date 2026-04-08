const mongoose = require('mongoose');

const statSchema = new mongoose.Schema({
  player:           { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  season:           { type: Number, default: 2024 },
  gamesPlayed:      { type: Number, default: 0 },
  passingYards:     { type: Number, default: 0 },
  passingTDs:       { type: Number, default: 0 },
  interceptions:    { type: Number, default: 0 },
  rushingYards:     { type: Number, default: 0 },
  rushingTDs:       { type: Number, default: 0 },
  receivingYards:   { type: Number, default: 0 },
  receivingTDs:     { type: Number, default: 0 },
  receptions:       { type: Number, default: 0 },
  fantasyPoints:    { type: Number, default: 0 },
});

statSchema.index({ player: 1, season: 1 }, { unique: true });

module.exports = mongoose.model('Stat', statSchema);
