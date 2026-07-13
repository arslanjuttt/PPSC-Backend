const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');
const TestResult = require('../models/TestResult');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/jwt.util');
const { sendOtpEmail, sendEmailVerificationOtp } = require('../config/email');

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_VERIFIED_EXPIRY_MS = 15 * 60 * 1000;
const EMAIL_VERIFY_EXPIRY_MS = 24 * 60 * 60 * 1000;
const PRIVATE_FIELDS = '-password -otp -emailVerifyOtp';

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  city: user.city,
  profileImage: user.profileImage,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  stats: user.stats,
});

const generateEmailVerificationOtp = () => crypto.randomInt(100000, 999999).toString();

const sendVerificationEmailToUser = async (user) => {
  const otp = generateEmailVerificationOtp();

  try {
    await sendEmailVerificationOtp(user.email, otp, user.name);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new ApiError(500, 'Failed to send verification email. Please try again later.');
  }

  user.emailVerifyOtp = otp;
  user.emailVerifyExpiresAt = Date.now() + EMAIL_VERIFY_EXPIRY_MS;
  await user.save();
};

const findUserByEmail = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

const signUp = async ({ name, email, password, phone, city }) => {
  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 10),
    phone: phone || '',
    city: city || '',
    isEmailVerified: false,
  });

  await sendVerificationEmailToUser(user);

  return {
    token: signToken({ id: user._id, email: user.email }),
    user: formatUser(user),
    message: 'Account created. Please verify your email.',
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, 'Invalid credentials');
  }

  return {
    token: signToken({ id: user._id, email: user.email }),
    user: formatUser(user),
  };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'No account found with this email address');
  }

  const otp = crypto.randomInt(100000, 999999).toString();

  try {
    await sendOtpEmail(email, otp);
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    throw new ApiError(500, 'Failed to send OTP email. Please try again later.');
  }

  user.otp = otp;
  user.otpExpiresAt = Date.now() + OTP_EXPIRY_MS;
  user.otpVerified = false;
  user.otpVerifiedExpiresAt = null;
  await user.save();
};

const verifyOtp = async ({ email, otp }) => {
  const user = await User.findOne({ email });
  if (!user || !user.otp || user.otp !== otp) {
    throw new ApiError(400, 'Invalid OTP');
  }
  if (user.otpExpiresAt && user.otpExpiresAt < Date.now()) {
    throw new ApiError(400, 'OTP expired');
  }

  user.otp = '';
  user.otpExpiresAt = null;
  user.otpVerified = true;
  user.otpVerifiedExpiresAt = Date.now() + OTP_VERIFIED_EXPIRY_MS;
  await user.save();
};

const verifyEmail = async (userId, otp) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.isEmailVerified) {
    throw new ApiError(400, 'Email is already verified');
  }
  if (!user.emailVerifyOtp || user.emailVerifyOtp !== otp) {
    throw new ApiError(400, 'Invalid verification code');
  }
  if (user.emailVerifyExpiresAt && user.emailVerifyExpiresAt < Date.now()) {
    throw new ApiError(400, 'Verification code expired. Please request a new one.');
  }

  user.isEmailVerified = true;
  user.emailVerifyOtp = '';
  user.emailVerifyExpiresAt = null;
  await user.save();

  return formatUser(user);
};

const resendVerificationEmail = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.isEmailVerified) {
    throw new ApiError(400, 'Email is already verified');
  }

  await sendVerificationEmailToUser(user);
};

const resetPassword = async ({ email, password }) => {
  const user = await findUserByEmail(email);

  if (!user.otpVerified) {
    throw new ApiError(403, 'OTP verification required before resetting password');
  }
  if (user.otpVerifiedExpiresAt && user.otpVerifiedExpiresAt < Date.now()) {
    throw new ApiError(403, 'OTP verification expired. Please verify OTP again.');
  }

  user.password = await bcrypt.hash(password, 10);
  user.otpVerified = false;
  user.otpVerifiedExpiresAt = null;
  await user.save();
};

const recordTestResult = async (
  userId,
  { correctAnswers, incorrectAnswers, score, totalQuestions, unattempted, subject, source }
) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  const stats = user.stats || {};
  stats.testsTaken = (stats.testsTaken || 0) + 1;
  stats.correctAnswers = (stats.correctAnswers || 0) + correctAnswers;
  stats.incorrectAnswers = (stats.incorrectAnswers || 0) + incorrectAnswers;
  stats.lastScore = score;

  const total = stats.correctAnswers + stats.incorrectAnswers;
  stats.accuracy = total > 0 ? Math.round((stats.correctAnswers / total) * 100) : 0;
  stats.streak = score >= 50 ? (stats.streak || 0) + 1 : 0;

  user.stats = stats;
  await user.save();

  const testResult = await TestResult.create({
    userId,
    score,
    correctAnswers,
    incorrectAnswers,
    totalQuestions: totalQuestions || correctAnswers + incorrectAnswers + (unattempted || 0),
    unattempted: unattempted || 0,
    subject: subject || '',
    source: source || 'practice',
  });

  return { stats, testResult };
};

const getTestHistory = async (userId, limit = 20) => {
  return TestResult.find({ userId }).sort({ createdAt: -1 }).limit(limit);
};

module.exports = {
  signUp,
  login,
  forgotPassword,
  verifyOtp,
  verifyEmail,
  resendVerificationEmail,
  resetPassword,
  getProfile: (userId) => User.findById(userId).select(PRIVATE_FIELDS),
  updateProfile: (userId, data) =>
    User.findByIdAndUpdate(userId, { $set: data }, { new: true, runValidators: true }).select(PRIVATE_FIELDS),
  getStats: async (userId) => (await User.findById(userId).select('stats'))?.stats || {},
  recordTestResult,
  getTestHistory,
  getLeaderboard: () => User.find({}).sort({ 'stats.lastScore': -1 }).limit(10).select('name stats'),
};
