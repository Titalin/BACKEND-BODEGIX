const { Schema, model } = require('mongoose');

// Colección: lockers_iot.temperaturas
const TemperaturaSchema = new Schema(
  {
    locker_id: { type: String, required: true, index: true },
    temperatura: { type: Number, required: true },
    humedad: { type: Number, required: true },
    peso: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'temperaturas'
  }
);

TemperaturaSchema.index({ locker_id: 1, timestamp: -1 });

module.exports = model('Temperatura', TemperaturaSchema);
