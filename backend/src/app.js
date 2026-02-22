// backend/src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

const authRoutes = require('./routes/auth');
const operatorRoutes = require('./routes/operator');

const errorHandler = require('./middleware/errorHandler');
const securityHeaders = require('./middleware/securityHeaders');
const sanitizeInput = require('./middleware/sanitizeInput');
const { createRateLimit } = require('./middleware/rateLimit');

// Rutas de módulos existentes
const userRoutes = require('./modules/users/user.routes');
const datasetRoutes = require('./modules/catalog/dataset.routes');
const externalDatasetRoutes = require('./modules/catalog/externalDataset.routes');

const negotiationTypeRoutes = require('./modules/contracts/negotiationType.routes');
const accessRequestRoutes = require('./modules/contracts/accessRequest.routes');
const contractRoutes = require('./modules/contracts/contract.routes');
const exchangeRoutes = require('./modules/exchange/exchange.routes');
const auditRoutes = require('./modules/audit/audit.routes');
const datasetUploadRoutes = require('./modules/catalog/upload.routes');
const supportRoutes = require('./modules/support/support.routes');
const selfDescriptionRoutes = require('./modules/selfDescription/selfDescription.routes');
dotenv.config();

const app = express();
app.disable('x-powered-by');

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:4000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const globalRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: 'Demasiadas peticiones globales'
});

const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: 'Demasiados intentos de autenticación, inténtalo más tarde'
});

// Middlewares globales
app.use(globalRateLimit);
app.use(securityHeaders);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origen no permitido por CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false, limit: '256kb' }));
app.use(sanitizeInput);
app.use(morgan('dev'));

// Rutas principales nuevas
app.use('/auth', authRateLimit, authRoutes);
app.use('/operator', operatorRoutes);

// Rutas de módulos que ya tenías
app.use('/users', userRoutes);
app.use('/catalog/datasets', datasetRoutes);
app.use('/catalog/external', externalDatasetRoutes);
app.use('/contracts/negotiation-types', negotiationTypeRoutes);
app.use('/contracts/access-requests', accessRequestRoutes);
app.use('/contracts', contractRoutes);
app.use('/exchange', exchangeRoutes);
app.use('/audit', auditRoutes);
app.use('/catalog/upload', datasetUploadRoutes);
app.use('/self-description', selfDescriptionRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Data Space Backend OK' });
});

app.use('/support', supportRoutes);

// Middleware de errores (debe ir al final, después de las rutas)
app.use(errorHandler);

module.exports = app;
