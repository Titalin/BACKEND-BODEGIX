// routes/lockersSensorsRoutes.js
const express = require('express');
const db = require('../models');           // <- tu índice de Sequelize
const Temperatura = require('../models/Temperatura'); // <- modelo Mongoose
const router = express.Router();

const Locker = db.Locker; // en tu árbol existe models/Locker.js

function toMongoLockerId(id) {
  if (id == null) return id;
  const s = String(id).trim();
  return /^LOCKER_/i.test(s) ? s.toUpperCase() : `LOCKER_${s.padStart(3, '0')}`;
}

// Sanity check: /api/ping
router.get('/ping', (_req, res) => res.json({ ok: true }));

/**
 * GET /api/lockers-with-sensors?user_id=5
 * Devuelve lockers del usuario con su última lectura de Mongo.
 */
router.get('/lockers-with-sensors', async (req, res) => {
  try {
    const userId = Number(req.query.user_id);
    if (!userId) return res.status(400).json({ error: 'user_id requerido' });

    const lockers = await Locker.findAll({
      where: { usuario_id: userId },
      raw: true,
    });

    if (!lockers.length) return res.json([]);

    const merged = await Promise.all(
      lockers.map(async (lk) => {
        const mongoId = toMongoLockerId(lk.identificador);
        let sensores = null;

        if (lk.estado === 'activo') {
          const doc = await Temperatura.findOne(
            { locker_id: mongoId },
            { temperatura: 1, humedad: 1, peso: 1, timestamp: 1 }
          ).sort({ timestamp: -1, created_at: -1 }).lean();

          if (doc) {
            sensores = {
              temperatura: doc.temperatura,
              humedad: doc.humedad,
              peso: doc.peso ?? null,
              fecha: doc.timestamp || '',
            };
          }
        }
        return { ...lk, sensores };
      })
    );

    res.json(merged);
  } catch (err) {
    console.error('GET /lockers-with-sensors error:', err);
    res.status(500).json({ error: 'Error al obtener lockers y sensores' });
  }
});

module.exports = router; // <- MUY IMPORTANTE
