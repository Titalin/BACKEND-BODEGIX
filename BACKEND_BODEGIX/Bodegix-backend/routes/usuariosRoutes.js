// routes/usuariosRoutes.js
const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const auth = require('../middlewares/authMiddleware'); 

// Listar usuarios
router.get('/admin', auth, usuariosController.getUsuariosAdmin);
router.get('/', auth, usuariosController.getUsuarios);

// Crear usuario
router.post('/', auth, usuariosController.createUsuario);

// Login (sin auth)
router.post('/login', usuariosController.loginUsuario);

// Logout
router.post('/logout', auth, usuariosController.logoutUsuario);

// Actualizar usuario
router.put('/:id', auth, usuariosController.updateUsuario);

// Eliminar usuario
router.delete('/:id', auth, usuariosController.deleteUsuario);

// Obtener usuario por ID (nueva ruta)
router.get('/:id', auth, usuariosController.getUsuarioById);

// Login con Google
router.post('/google-login', usuariosController.loginConGoogle);

module.exports = router;
