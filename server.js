require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const chatRoutes = require('./routes/chat');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 30,
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get('/api/models', (req, res) => {
  const { getAvailableModels } = require('./config/providers');
  res.json({ models: getAvailableModels() });
});

app.use('/api/chat', authMiddleware, chatRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log('');
  console.log('  ChatFlow started!');
  console.log('  http://localhost:' + PORT);
  console.log('');
  const providers = [];
  if (process.env.OPENAI_API_KEY) providers.push('OpenAI');
  if (process.env.ANTHROPIC_API_KEY) providers.push('Claude');
  if (process.env.GEMINI_API_KEY) providers.push('Gemini');
  if (providers.length === 0) {
    console.warn('  WARNING: No API keys configured!');
  } else {
    console.log('  Providers: ' + providers.join(', '));
  }
  console.log('');
});

module.exports = app;