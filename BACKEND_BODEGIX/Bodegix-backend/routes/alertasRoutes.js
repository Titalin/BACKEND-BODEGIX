const express = require('express');
const router = express.Router();
const alertas = require('../controllers/alertasController');

router.get('/ping', (_req, res) => res.json({ ok: true }));
router.get('/usuario/:id', alertas.getAlertasPorUsuario);

module.exports = router;
