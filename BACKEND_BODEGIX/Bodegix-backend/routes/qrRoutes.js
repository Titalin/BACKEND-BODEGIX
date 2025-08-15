// routes/qrRoutes.js
const express = require('express');
const crypto = require('crypto');
const QrSession = require('../models/QrSession');
const Command = require('../models/Command');
let toMongoLockerId;
try {
  // usamos tu helper si existe
  ({ toMongoLockerId } = require('../utils/lockerId'));
} catch {
  // fallback por si no está disponible
  toMongoLockerId = (id) => {
    if (id == null) return id;
    const s = String(id).trim();
    return /^LOCKER_/i.test(s) ? s.toUpperCase() : `LOCKER_${s.padStart(3, '0')}`;
  };
}

const router = express.Router();

function apiBaseFromReq(req) {
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http');
  const host = req.get('host');
  return `${proto}://${host}`;
}

function randomHex(n = 16) {
  return crypto.randomBytes(n).toString('hex'); // 32 chars
}

/**
 * POST /api/qr-sessions
 * body: { lockerId, empresaId?, expiresInMs?=15000, asUrl?=false }
 * Crea una sesión QR (válida por ~15s). Responde RAW code o URL con ?c=...
 */
router.post('/qr-sessions', async (req, res) => {
  try {
    const { lockerId, empresaId, expiresInMs = 15000, asUrl = false } = req.body || {};
    if (!lockerId) return res.status(400).json({ ok: false, error: 'lockerId requerido' });

    const locker_id = toMongoLockerId(lockerId);
    const code = randomHex(16);
    const expires_at = new Date(Date.now() + Math.max(1000, Number(expiresInMs)));

    const doc = await QrSession.create({
      code, locker_id, empresa_id: empresaId ? String(empresaId) : undefined, expires_at
    });

    const payload = asUrl
      ? `${apiBaseFromReq(req)}/api/qr/scan?c=${code}`
      : code;

    res.json({ ok: true, sessionId: String(doc._id), expiresInMs: expiresInMs, payload });
  } catch (err) {
    console.error('POST /qr-sessions error:', err);
    res.status(500).json({ ok: false, error: 'error_crear_sesion' });
  }
});

/**
 * GET  /api/qr/scan?c=RAW
 * POST /api/qr/scan     body { code: RAW }
 * Consume la sesión QR y crea un Command OPEN para el locker.
 */
async function consumeAndCreateCommand(raw, res) {
  try {
    if (!raw) return res.status(400).json({ ok: false, error: 'missing_code' });

    const session = await QrSession.findOne({ code: String(raw).trim() }).lean();
    if (!session) return res.json({ ok: false, error: 'expired_or_invalid' });

    if (session.consumed) return res.json({ ok: false, error: 'already_used' });
    if (new Date(session.expires_at).getTime() < Date.now())
      return res.json({ ok: false, error: 'expired_or_invalid' });

    // marca consumida
    await QrSession.updateOne({ _id: session._id }, { $set: { consumed: true, used_at: new Date() } });

    // crea comando OPEN
    const cmd = await Command.create({
      locker_id: session.locker_id,
      action: 'OPEN',
      status: 'pending',
      session_id: session._id
    });

    res.json({ ok: true, commandId: String(cmd._id), locker_id: session.locker_id, action: 'OPEN' });
  } catch (err) {
    console.error('consumeAndCreateCommand error:', err);
    res.status(500).json({ ok: false, error: 'error_scan' });
  }
}

router.get('/qr/scan', async (req, res) => {
  const code = req.query.c;
  return consumeAndCreateCommand(code, res);
});

router.post('/qr/scan', async (req, res) => {
  const { code } = req.body || {};
  return consumeAndCreateCommand(code, res);
});

/**
 * GET /api/lockers/:lockerId/next-command
 * Devuelve el próximo command PENDING para ese locker.
 */
router.get('/lockers/:lockerId/next-command', async (req, res) => {
  try {
    const locker_id = toMongoLockerId(req.params.lockerId);
    const cmd = await Command.findOne(
      { locker_id, status: 'pending' },
      { locker_id: 1, action: 1, created_at: 1 }
    )
      .sort({ created_at: 1 }) // primero en entrar, primero en salir
      .lean();

    if (!cmd) return res.json({ ok: true, command: null });

    res.json({
      ok: true,
      command: {
        id: String(cmd._id),
        locker_id: cmd.locker_id,
        action: cmd.action
      }
    });
  } catch (err) {
    console.error('GET /lockers/:lockerId/next-command error:', err);
    res.status(500).json({ ok: false, error: 'error_next_command' });
  }
});

/**
 * POST /api/commands/:id/ack
 * body: { success: boolean }
 * Marca el comando como "done".
 */
router.post('/commands/:id/ack', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ ok: false, error: 'missing_id' });

    const { success } = req.body || {};
    const upd = await Command.updateOne(
      { _id: id },
      { $set: { status: 'done', ack_at: new Date() } }
    );

    if (!upd.matchedCount) {
      return res.status(404).json({ ok: false, error: 'not_found' });
    }
    res.json({ ok: true, success: !!success });
  } catch (err) {
    console.error('POST /commands/:id/ack error:', err);
    res.status(500).json({ ok: false, error: 'error_ack' });
  }
});

module.exports = router;
