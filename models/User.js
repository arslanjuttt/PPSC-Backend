const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    city: { type: String, default: '' },
    profileImage: { type: String, default: '' },
    role: { type: String, default: 'student' },
    otp: { type: String, default: '' },
    otpExpiresAt: { type: Date, default: null },
    otpVerified: { type: Boolean, default: false },
    otpVerifiedExpiresAt: { type: Date, default: null },
    isEmailVerified: { type: Boolean, default: false },
    emailVerifyOtp: { type: String, default: '' },
    emailVerifyExpiresAt: { type: Date, default: null },
    stats: {
      testsTaken: { type: Number, default: 0 },
      correctAnswers: { type: Number, default: 0 },
      incorrectAnswers: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
      lastScore: { type: Number, default: 0 },
      lastPassDate: { type: String, default: null },
      accuracy: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
