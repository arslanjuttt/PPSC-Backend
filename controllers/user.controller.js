const asyncHandler = require('../utils/asyncHandler');
const sendSuccess = require('../utils/sendSuccess');
const userService = require('../services/user.service');
const ApiError = require('../utils/ApiError');

const requireUser = async (userId) => {
  const user = await userService.getProfile(userId);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

const signUp = asyncHandler(async (req, res) => {
  const { token, user, message } = await userService.signUp(req.body);
  sendSuccess(res, 201, { message, token, user });
});

const login = asyncHandler(async (req, res) => {
  const result = await userService.login(req.body);
  sendSuccess(res, 200, { message: 'Login successful', ...result });
});

const forgotPassword = asyncHandler(async (req, res) => {
  await userService.forgotPassword(req.body.email);
  sendSuccess(res, 200, { message: 'OTP has been sent to your email' });
});

const verifyOtp = asyncHandler(async (req, res) => {
  await userService.verifyOtp(req.body);
  sendSuccess(res, 200, { message: 'OTP verified successfully' });
});

const resetPassword = asyncHandler(async (req, res) => {
  await userService.resetPassword(req.body);
  sendSuccess(res, 200, { message: 'Password reset successfully' });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const user = await userService.verifyEmail(req.user.id, req.body.otp);
  sendSuccess(res, 200, { message: 'Email verified successfully', user });
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  await userService.resendVerificationEmail(req.user.id);
  sendSuccess(res, 200, { message: 'Verification email sent successfully' });
});

const getProfile = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, { user: await requireUser(req.user.id) });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  if (!user) throw new ApiError(404, 'User not found');
  sendSuccess(res, 200, { message: 'Profile updated successfully', user });
});

const getStats = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, { stats: await userService.getStats(req.user.id) });
});

const recordTestResult = asyncHandler(async (req, res) => {
  const { stats } = await userService.recordTestResult(req.user.id, req.body);
  sendSuccess(res, 200, { message: 'Test result recorded successfully', stats });
});

const getTestHistory = asyncHandler(async (req, res) => {
  const results = await userService.getTestHistory(req.user.id);
  sendSuccess(res, 200, { results });
});

const getLeaderboard = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, { leaderboard: await userService.getLeaderboard() });
});

module.exports = {
  signUp,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  getProfile,
  updateProfile,
  getStats,
  recordTestResult,
  getTestHistory,
  getLeaderboard,
};
