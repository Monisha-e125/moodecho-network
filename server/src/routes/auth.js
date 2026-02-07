const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { validateRegistration, validateLogin, validatePasswordChange } = require('../middlewares/validator');
const{ authLimiter } = require('../middlewares/rateLimiter');
const router = express.Router();

// Public routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/register', authLimiter, validateRegistration, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);

// Protected routes (require authentication)
router.use(protect);

router.get('/me', authController.getMe);
router.patch('/update-profile', authController.updateProfile);
router.patch('/change-password', validatePasswordChange, authController.changePassword);

module.exports = router;