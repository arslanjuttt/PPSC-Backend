const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    score: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    incorrectAnswers: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    unattempted: { type: Number, default: 0 },
    subject: { type: String, default: '' },
    source: { type: String, enum: ['practice', 'mock'], default: 'practice' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TestResult', testResultSchema);
