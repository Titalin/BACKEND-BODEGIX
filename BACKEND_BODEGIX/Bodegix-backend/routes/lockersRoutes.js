const express = require('express');
const router = express.Router();
const lockersController = require('../controllers/lockersController');
const auth = require('../middlewares/authMiddleware');
const checkSubscription = require('../middlewares/checkSubscription');

router.use(auth);

// Si quieres bloquear también la vista, agrega checkSubscription en GET
router.get('/', lockersController.getLockers);

router.post('/', checkSubscription, lockersController.createLocker);
router.put('/:id', checkSubscription, lockersController.updateLocker);
router.delete('/:id', checkSubscription, lockersController.deleteLocker);

router.get('/empresa/:empresa_id', lockersController.getLockersPorEmpresa);
router.get('/usuario/:id', lockersController.getLockersPorUsuario);

module.exports = router;
