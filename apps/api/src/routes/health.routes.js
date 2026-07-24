const express = require('express');
const { sequelize } = require('../config/database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await sequelize.authenticate();

    res.json({
      status: 'ok',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      message: error.message
    });
  }
});

module.exports = router;
