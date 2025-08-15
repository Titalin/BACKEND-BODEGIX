// models/QrSession.js
const { Schema, model } = require('mongoose');

const QrSessionSchema = new Schema({
  code: { type: String, required: true, unique: true, index: true }, // RAW del QR
  locker_id: { type: String, required: true, index: true },          // LOCKER_XXX
  empresa_id: { type: String, required: false },
  consumed: { type: Boolean, default: false, index: true },
  used_at: { type: Date },
  expires_at: { type: Date, required: true, index: true },           // TTL absoluto
  created_at: { type: Date, default: Date.now, index: true },
}, {
  versionKey: false,
  collection: 'qr_sessions'
});

// TTL (expira exactamente en expires_at)
QrSessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = model('QrSession', QrSessionSchema);
