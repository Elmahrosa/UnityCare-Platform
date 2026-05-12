const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Placeholder endpoint — implement real chain logic later
router.get('/status', authMiddleware.verifyToken, (req, res) => {
  res.json({
    ok: true,
    message: 'Blockchain module placeholder. Implement per deployment contract.'
  });
});

module.exports = router;