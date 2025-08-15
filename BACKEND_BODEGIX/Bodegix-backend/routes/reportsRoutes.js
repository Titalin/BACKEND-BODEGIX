const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');

router.get('/ingresos/totales', reportsController.getIngresosTotales);
router.get('/ingresos/totales-por-fecha', reportsController.getIngresosTotalesPorFecha);
router.get('/ingresos/mensuales', reportsController.getIngresosMensuales);
router.get('/ingresos/por-empresa', reportsController.getIngresosPorEmpresa);

module.exports = router;
