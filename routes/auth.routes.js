const express = require('express');
const userController = require('../controllers/user.controller');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const requireEmailVerified = require('../middleware/requireEmailVerified.middleware');
const { authLimiter, strictAuthLimiter } = require('../middleware/rateLimit.middleware');
const {
  signUpSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} = require('../validators');

const router = express.Router();

router.use(authLimiter);

router.post('/signup', validate(signUpSchema), userController.signUp);
router.post('/login', validate(loginSchema), userController.login);
router.post('/forgot-password', strictAuthLimiter, validate(forgotPasswordSchema), userController.forgotPassword);
router.post('/verify-otp', strictAuthLimiter, validate(verifyOtpSchema), userController.verifyOtp);
router.post('/reset-password', strictAuthLimiter, validate(resetPasswordSchema), userController.resetPassword);
router.post('/verify-email', authMiddleware, validate(verifyEmailSchema), userController.verifyEmail);
router.post('/resend-verification', authMiddleware, strictAuthLimiter, userController.resendVerificationEmail);

module.exports = router;
