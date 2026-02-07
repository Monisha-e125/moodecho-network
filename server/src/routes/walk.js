const express = require('express');
const walkController = require('../controllers/walkController');
const { protect } = require('../middlewares/auth');
const { body } = require('express-validator');

const router = express.Router();

// All routes require authentication
router.use(protect);

// POST /api/walk - Create a new mood walk (find match and generate)
router.post('/', walkController.createWalk);

// GET /api/walk/recommendations - Get personalized walk recommendations
router.get('/recommendations', walkController.getRecommendations);

// GET /api/walk/history - Get user's walk history
router.get('/history', walkController.getWalkHistory);

// GET /api/walk/:walkId - Get single walk details
router.get('/:walkId', walkController.getWalk);

// PATCH /api/walk/:walkId/start - Start a walk
router.patch('/:walkId/start', walkController.startWalk);

// PATCH /api/walk/:walkId/complete - Complete walk with feedback
router.patch('/:walkId/complete', [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('comment').optional().isLength({ max: 500 })
], walkController.completeWalk);

// DELETE /api/walk/:walkId - Abandon a walk
router.delete('/:walkId', walkController.abandonWalk);

module.exports = router;