const express = require('express');
const { Plan } = require('../models');
const auth = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/', auth, async (_req, res) => {
  const rows = await Plan.findAll();
  res.json(rows);
});

module.exports = router;
