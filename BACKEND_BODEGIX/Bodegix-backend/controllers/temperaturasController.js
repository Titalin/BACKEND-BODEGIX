// controllers/temperaturasController.js
const Temperatura = require('../models/Temperatura');

// GET /api/temperatura/:lockerId
// Devuelve el último registro como ARRAY de 1 elemento (compatibilidad con tu app)
exports.getUltimaPorLocker = async (req, res) => {
  try {
    const { lockerId } = req.params;
    const doc = await Temperatura.findOne({ locker_id: lockerId })
      .sort({ timestamp: -1 })
      .lean();

    if (!doc) return res.json([]);
    res.json([{
      temperatura: doc.temperatura,
      humedad: doc.humedad,
      peso: doc.peso ?? null,
      timestamp: doc.timestamp
    }]);
  } catch (e) {
    console.error('getUltimaPorLocker:', e);
    res.status(500).json({ error: 'Error interno' });
  }
};

// POST /api/temperatura
// Ingesta desde IoT (ESP32)
exports.ingresarDato = async (req, res) => {
  try {
    const { locker_id, temperatura, humedad, peso, timestamp } = req.body;
    if (!locker_id || temperatura == null || humedad == null) {
      return res.status(400).json({ error: 'locker_id, temperatura y humedad son requeridos' });
    }
    const nuevo = await Temperatura.create({
      locker_id,
      temperatura,
      humedad,
      peso: peso ?? 0,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    });
    res.status(201).json(nuevo);
  } catch (e) {
    console.error('ingresarDato:', e);
    res.status(500).json({ error: 'Error interno' });
  }
};

// (opcional) GET /api/lockers/:lockerId/history?limit=50
exports.getHistorial = async (req, res) => {
  try {
    const { lockerId } = req.params;
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 500);
    const docs = await Temperatura.find({ locker_id: lockerId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    res.json(docs);
  } catch (e) {
    console.error('getHistorial:', e);
    res.status(500).json({ error: 'Error interno' });
  }
};
