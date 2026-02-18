// backend/src/server.js
const dotenv = require('dotenv');
const app = require('./app');
const { seedInitialUsers } = require('./modules/auth/auth.service');

dotenv.config();

// FORZAMOS el puerto a 4001 (sin process.env)
const PORT = 4001;

async function start() {
  await seedInitialUsers();

  app.listen(PORT, () => {
    console.log(`Backend escuchando en http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});