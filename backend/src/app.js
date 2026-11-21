const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const pinoHttp = require('pino-http');
const config = require('./config');
const logger = require('./utils/logger');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Avatars are served as plain images from another origin (the frontend),
// so they need to be exempt from the default same-origin resource policy.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(pinoHttp({ logger }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
// Only this one subfolder is exposed — never the whole public/ directory.
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
