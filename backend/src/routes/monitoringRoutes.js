const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/status', authMiddleware, (req, res) => {
  res.json({ ok: true, message: 'Monitoring placeholder.' });
});

module.exports = router;