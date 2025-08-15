const express = require('express');
const router = express.Router();
const accesosController = require('../controllers/accesosController');
const auth = require('../middlewares/authMiddleware');

router.get('/', auth, accesosController.getAccesos);
router.post('/', auth, accesosController.createAcceso);
module.exports = router;