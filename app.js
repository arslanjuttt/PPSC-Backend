const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const testRoutes = require('./routes/test.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const normalizeUrl = (url) => (url ? url.replace(/\/$/, '') : '');
const clientUrl = normalizeUrl(process.env.CLIENT_URL || 'http://localhost:3000');

const app = express();
const allowedOrigins = [clientUrl];

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '10kb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tests', testRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
