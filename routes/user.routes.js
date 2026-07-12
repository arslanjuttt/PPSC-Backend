const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const requireEmailVerified = require('../middleware/requireEmailVerified.middleware');
const validate = require('../middleware/validate.middleware');
const { updateProfileSchema, recordTestResultSchema } = require('../validators');

const router = express.Router();

router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, requireEmailVerified, validate(updateProfileSchema), userController.updateProfile);
router.get('/stats', authMiddleware, requireEmailVerified, userController.getStats);
router.post('/stats/test-result', authMiddleware, requireEmailVerified, validate(recordTestResultSchema), userController.recordTestResult);
router.get('/test-history', authMiddleware, requireEmailVerified, userController.getTestHistory);
router.get('/leaderboard', userController.getLeaderboard);

module.exports = router;
