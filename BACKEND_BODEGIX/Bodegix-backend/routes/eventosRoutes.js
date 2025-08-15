const express = require('express');
const router = express.Router();
const eventosController = require('../controllers/eventosController');
const auth = require('../middlewares/authMiddleware');

router.get('/', auth, eventosController.getEventos);
router.post('/', auth, eventosController.createEvento);
module.exports = router;