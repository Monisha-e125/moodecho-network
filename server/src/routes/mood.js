const express = require('express');
const moodController = require('../controllers/moodController');
const { protect } = require('../middlewares/auth');
const { validateMoodLog } = require('../middlewares/validator');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/', validateMoodLog, moodController.logMood);
router.get('/', moodController.getMoodHistory);
router.get('/stats', moodController.getMoodStats);
router.get('/:id', moodController.getMood);
router.delete('/:id', moodController.deleteMood);

module.exports = router;