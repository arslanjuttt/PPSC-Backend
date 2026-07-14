const express = require('express');
const sendSuccess = require('../utils/sendSuccess');

const MOCK_TESTS = [
  { id: 1, title: 'Mock Test 1', questionCount: 50, duration: 60, subject: 'Mixed subjects', description: '50 MCQs mixed from all subjects' },
  { id: 2, title: 'Mock Test 2', questionCount: 100, duration: 120, subject: 'Mixed subjects', description: '100 MCQs mixed from all subjects' },
  { id: 3, title: 'Mock Test 3', questionCount: 150, duration: 180, subject: 'Mixed subjects', description: '150 MCQs mixed from all subjects' },
  { id: 4, title: 'Mock Test 4', questionCount: 200, duration: 240, subject: 'Mixed subjects', description: '200 MCQs mixed from all subjects' },
];

const router = express.Router();

router.get('/', (req, res) => {
  sendSuccess(res, 200, { message: 'Test data loaded', tests: MOCK_TESTS });
});

module.exports = router;
