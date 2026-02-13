const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const streakService = require('../services/streakService');
const catchAsync = require('../utils/catchAsync');

// Get current user's streak stats
router.get('/stats', protect, catchAsync(async (req, res) => {
  const stats = await streakService.getStreakStats(req.user._id);

  res.json({
    status: 'success',
    data: stats
  });
}));

// Reset streak (for testing)
router.post('/reset', protect, catchAsync(async (req, res) => {
  const result = await streakService.resetStreak(req.user._id);

  res.json({
    status: 'success',
    data: result
  });
}));

module.exports = router;