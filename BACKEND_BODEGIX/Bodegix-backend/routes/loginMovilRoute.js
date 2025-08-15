// routes/loginMovilRoute.js

const express = require('express');
const router = express.Router();


// Importa tu controlador (ajusta la ruta si tu estructura de carpetas es diferente)
const loginMovilController = require('../controllers/loginMovilController');

// Ruta POST /api/movil/login
router.post('/login', loginMovilController.loginEmpleadoMovil);

module.exports = router;
