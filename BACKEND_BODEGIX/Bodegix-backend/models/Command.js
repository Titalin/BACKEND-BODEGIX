// models/Command.js
const { Schema, model, Types } = require('mongoose');

const CommandSchema = new Schema({
  locker_id: { type: String, required: true, index: true },         // LOCKER_XXX
  action: { type: String, enum: ['OPEN'], required: true },
  status: { type: String, enum: ['pending', 'done'], default: 'pending', index: true },
  session_id: { type: Types.ObjectId, ref: 'QrSession' },
  created_at: { type: Date, default: Date.now, index: true },
  ack_at: { type: Date },
}, {
  versionKey: false,
  collection: 'commands'
});

CommandSchema.index({ locker_id: 1, status: 1, created_at: 1 });

module.exports = model('Command', CommandSchema);
