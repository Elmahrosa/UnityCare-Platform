const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/status', authMiddleware, (req, res) => {
  res.json({ ok: true, message: 'IoT placeholder (integration roadmap).' });
});

module.exports = router;