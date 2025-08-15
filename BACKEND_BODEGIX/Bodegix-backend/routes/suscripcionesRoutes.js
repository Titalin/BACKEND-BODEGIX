const express = require('express');
const router = express.Router();
const suscripcionesController = require('../controllers/suscripcionesController');
const auth = require('../middlewares/authMiddleware');

// Reporte (si quieres que requiera token, agrega 'auth' como middleware)
router.get('/reporte', suscripcionesController.getReporteSuscripciones);

// NUEVOS endpoints basados en vistas SQL
router.get('/ultimas', auth, suscripcionesController.getUltimasPorEmpresa);  // <--- NUEVO
router.get('/mensuales', auth, suscripcionesController.getMensuales);        // <--- NUEVO

// Estado de suscripción por empresa (devuelve { activa: true/false })
router.get('/status', auth, suscripcionesController.getEstadoEmpresa);

// Listar todas las suscripciones
router.get('/', auth, suscripcionesController.getSuscripciones);

// Obtener una suscripción por ID
router.get('/:id', auth, suscripcionesController.getSuscripcionById);

// Crear suscripción
router.post('/', auth, suscripcionesController.createSuscripcion);

// Actualizar suscripción
router.put('/:id', auth, suscripcionesController.updateSuscripcion);

// Eliminar suscripción
router.delete('/:id', auth, suscripcionesController.deleteSuscripcion);

module.exports = router;
