// index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const dns = require('dns').promises;
const net = require('net');

const { sequelize } = require('./models/index');
const { connectMongo } = require('./config/mongo');

// Rutas MySQL
const planesRoutes = require('./routes/planesRoutes');
const empresasRoutes = require('./routes/empresasRoutes');
const rolesRoutes = require('./routes/rolesRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const lockersRoutes = require('./routes/lockersRoutes');
const accesosRoutes = require('./routes/accesosRoutes');
const suscripcionesRoutes = require('./routes/suscripcionesRoutes');
const eventosRoutes = require('./routes/eventosRoutes');
const loginMovilRoutes = require('./routes/loginMovilRoute');
const paypalRoutes = require('./routes/paypalRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const lockersSensorsRoutes = require('./routes/lockersSensorsRoutes');
const alertasRoutes = require('./routes/alertasRoutes');

// Rutas Mongo (API agrupada + compat)
const { api: temperaturasRouter, compat: temperaturaCompat } = require('./routes/temperaturas');

// Rutas QR/commands
const qrRoutes = require('./routes/qrRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// ---- Health & Diagnóstico (no dependen de DB) ----
app.get('/', (_req, res) => res.json({ ok: true }));
app.get('/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// Diagnóstico de red a MySQL (desde Render)
async function tcpProbe(host, port, timeoutMs = 7000) {
  const { address } = await dns.lookup(host);
  return await new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const done = (ok, error) => { try { socket.destroy(); } catch {} ; resolve({ ok, ip: address, error }); };
    socket.setTimeout(timeoutMs);
    socket.on('connect', () => done(true));
    socket.on('timeout', () => done(false, 'TIMEOUT'));
    socket.on('error', (e) => done(false, e.code || e.message));
  });
}
app.get('/tcpcheck', async (_req, res) => {
  const host = process.env.DB_HOST;
  const port = Number(process.env.DB_PORT) || 3306;
  try {
    const r = await tcpProbe(host, port);
    res.json({ host, port, ...r });
  } catch (e) {
    res.status(500).json({ host, port, error: e.message });
  }
});

// Verificación rápida de Sequelize (sin sync)
app.get('/dbcheck', async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.send('mysql ok');
  } catch (e) {
    res.status(500).send(String(e));
  }
});

// --- Monta QR primero ---
app.use('/api', qrRoutes);

// Rutas MySQL
app.use('/api/planes', planesRoutes);
app.use('/api/empresas', empresasRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/lockers', lockersRoutes);
app.use('/api/accesos', accesosRoutes);
app.use('/api/suscripciones', suscripcionesRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/movil', loginMovilRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api', lockersSensorsRoutes);

// Rutas Mongo
app.use('/api/temperaturas', temperaturasRouter);
app.use('/api', temperaturaCompat);

// Conexión y arranque
const PORT = process.env.PORT || 5000;
const MUST_CONNECT = process.env.BOOT_WITHOUT_DB !== 'true'; // si es true, arranca sin MySQL

(async () => {
  try {
    if (MUST_CONNECT) {
      // Primero verifica que el host/puerto sean alcanzables
      try {
        const host = process.env.DB_HOST;
        const port = Number(process.env.DB_PORT) || 3306;
        const probe = await tcpProbe(host, port);
        if (!probe.ok) {
          throw new Error(`TCP a MySQL falló (${host}:${port}) -> ${probe.error || 'UNKNOWN'}`);
        }
        console.log(`🔌 TCP OK a MySQL ${host}:${port} (${probe.ip})`);
      } catch (e) {
        console.warn('⚠️  tcpcheck previo falló:', e.message);
      }

      await sequelize.authenticate();
      console.log('✅ MySQL reachable');
      await sequelize.sync({ alter: false });
      console.log('✅ Sequelize sync ok');
    } else {
      console.warn('⚠️ BOOT_WITHOUT_DB=true → arrancando sin conectar a MySQL');
    }

    // MongoDB
    await connectMongo(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lockers_iot');
    console.log('✅ Conectado a MongoDB');

    // Limpieza de índices duplicados + syncIndexes (QrSession, Command)
    try {
      const mongoose = require('mongoose');
      const QrSession = require('./models/QrSession');
      const Command   = require('./models/Command');

      async function dropDuplicateIndex(model, field) {
        const col = model.collection;
        const indexes = await col.indexes();
        const dups = indexes.filter(i => JSON.stringify(i.key) === JSON.stringify({ [field]: 1 }));
        for (let i = 1; i < dups.length; i++) {
          try {
            await col.dropIndex(dups[i].name);
            console.log(`🧹 Drop index duplicado ${dups[i].name} en ${col.collectionName}`);
          } catch (e) {
            console.warn(`No se pudo dropear ${dups[i].name}:`, e.message);
          }
        }
      }

      await dropDuplicateIndex(QrSession, 'expires_at');
      await dropDuplicateIndex(Command, 'expires_at');
      await QrSession.syncIndexes?.();
      await Command.syncIndexes?.();
      console.log('✅ Índices Mongo verificados/sincronizados');
    } catch (e) {
      console.warn('ℹ️ Verificación de índices Mongo saltada:', e.message);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Bodegix backend corriendo en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    // Si se permite arrancar sin DB, no tumbar el proceso
    if (!MUST_CONNECT) {
      app.listen(PORT, () => {
        console.log(`🚀 (sin MySQL) Bodegix backend corriendo en el puerto ${PORT}`);
      });
    } else {
      process.exit(1);
    }
  }
})();

// Manejo de errores no capturados
process.on('unhandledRejection', (reason) => {
  console.error('🧨 UnhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('🧨 UncaughtException:', err);
});
