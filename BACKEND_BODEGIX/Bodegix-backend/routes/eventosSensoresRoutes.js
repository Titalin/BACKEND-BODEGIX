const express = require('express');
const router = express.Router();
const controller = require('../controllers/firebaseSensoresController');

router.get('/:id_locker', controller.getUltimoSensorPorLocker);

module.exports = router;
