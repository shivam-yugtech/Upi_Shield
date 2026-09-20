require('dotenv').config();

const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { errorHandler } = require('./middleware/errorHandler');
const { healthHandler } = require('./routes/health');
const keywordsRouter = require('./routes/keywords');
const reportRouter = require('./routes/report');
const scanRouter = require('./routes/scan');

function corsOrigin() {
  const configured = (process.env.CLIENT_ORIGIN || '*').trim();
  if (configured === '*') {
    return true;
  }
  const origins = configured.split(',').map((value) => value.trim()).filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
}

function createApp() {
  const app = express();

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigin(),
    })
  );
  app.use(express.json({ limit: '10kb' }));

  const isTest = process.env.NODE_ENV === 'test';

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: isTest ? 1000 : 100,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { success: false, error: 'Too many requests. Please try again later.' },
    })
  );

  app.use(
    '/api/report',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: isTest ? 1000 : 20,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { success: false, error: 'Too many reports. Please try again later.' },
    })
  );

  app.get('/health', healthHandler);
  app.use('/api/keywords', keywordsRouter);
  app.use('/api/scan', scanRouter);
  app.use('/api/report', reportRouter);

  app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Not found.' });
  });

  app.use(errorHandler);

  return app;
}

module.exports = { createApp, app: createApp() };
