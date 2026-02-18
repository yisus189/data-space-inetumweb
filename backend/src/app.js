// backend/src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

const authRoutes = require('./routes/auth');
const operatorRoutes = require('./routes/operator');

const errorHandler = require('./middleware/errorHandler');

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
dotenv.config();

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rutas principales nuevas
app.use('/auth', authRoutes);
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

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Data Space Backend OK' });
});

// Middleware de errores (debe ir al final, después de las rutas)
app.use(errorHandler);
app.use('/support', supportRoutes);

module.exports = app;