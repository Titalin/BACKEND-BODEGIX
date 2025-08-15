const express = require('express');
const router = express.Router();
const empresasController = require('../controllers/empresasController'); // ✅ coincide con plural
const auth = require('../middlewares/authMiddleware');

// CRUD protegido
router.get('/', auth, empresasController.getEmpresas);
router.get('/:id', auth, empresasController.getEmpresaById);
router.post('/', auth, empresasController.createEmpresa);
router.put('/:id', auth, empresasController.updateEmpresa);
router.delete('/:id', auth, empresasController.deleteEmpresa);

module.exports = router;
