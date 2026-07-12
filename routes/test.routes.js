const express = require('express');
const sendSuccess = require('../utils/sendSuccess');

const MOCK_TESTS = [
  { id: 1, title: 'PPSC Mock Test 1', subject: 'General Knowledge', duration: 30 },
  { id: 2, title: 'PPSC Mock Test 2', subject: 'Pakistan Affairs', duration: 45 },
];

const router = express.Router();

router.get('/', (req, res) => {
  sendSuccess(res, 200, { message: 'Test data loaded', tests: MOCK_TESTS });
});

module.exports = router;
