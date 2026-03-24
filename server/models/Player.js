const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  espnId:       { type: String, default: '' },
  name:         { type: String, required: true, trim: true },
  position:     { type: String, required: true, enum: ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'] },
  jerseyNumber: { type: Number },
  teamName:     { type: String, default: '' },
  teamAbbr:     { type: String, default: '' },
  age:          { type: Number },
  headshotUrl:  { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
