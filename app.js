const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const testRoutes = require('./routes/test.routes');
const transcriptRoutes = require('./routes/transcript.routes');
const chatRoutes = require('./routes/chat.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/transcript', transcriptRoutes);
app.use('/api/chat', chatRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
