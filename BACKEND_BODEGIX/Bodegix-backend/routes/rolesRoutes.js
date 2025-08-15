const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/rolesController');
const auth = require('../middlewares/authMiddleware');

router.get('/', auth, rolesController.getRoles);
module.exports = router;