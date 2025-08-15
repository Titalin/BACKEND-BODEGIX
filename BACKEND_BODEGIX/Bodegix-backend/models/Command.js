// models/Command.js
const mongoose = require('mongoose');

const CommandSchema = new mongoose.Schema({
  locker_id:  { type: Number, required: true },
  command:    { type: String, enum: ['OPEN','CLOSE'], required: true },
  state:      { type: String, enum: ['PENDING','SENT','EXPIRED'], default: 'PENDING' },
  // Igual que arriba: SOLO una definición
  expires_at: { type: Date, required: true, expires: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Command', CommandSchema);
