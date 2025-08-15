// models/QrSession.js
const mongoose = require('mongoose');

const QrSessionSchema = new mongoose.Schema({
  code:       { type: String, required: true },
  status:     { type: String, enum: ['NEW','USED','EXPIRED'], default: 'NEW' },
  // TTL por fecha exacta; NO agregues index:true ni schema.index duplicado
  expires_at: { type: Date, required: true, expires: 0 },
}, { timestamps: true });

module.exports = mongoose.model('QrSession', QrSessionSchema);
