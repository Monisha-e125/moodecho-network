const express = require('express');
const matchController = require('../controllers/matchController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// GET /api/match - Find a match for current user
router.get('/', matchController.findMatch);

// GET /api/match/profile - Get user's own mood profile
router.get('/profile', matchController.getMyProfile);

// GET /api/match/history - Get match history
router.get('/history', matchController.getMatchHistory);

// GET /api/match/compatibility/:targetUserId - Get compatibility with specific user
router.get('/compatibility/:targetUserId', matchController.getCompatibility);

module.exports = router;