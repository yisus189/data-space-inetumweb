const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Carpeta base donde se guardarán los ficheros del data space
const UPLOAD_BASE_DIR = path.join(__dirname, '../../storage/uploads');

// Asegurarnos de que la carpeta existe
if (!fs.existsSync(UPLOAD_BASE_DIR)) {
  fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
}

// Configuración de almacenamiento de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_BASE_DIR);
  },
  filename: function (req, file, cb) {
    // Nombre único: timestamp + nombre original "sanitizado"
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueName = `${Date.now()}_${safeOriginalName}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB (ajusta según necesidad)
  }
});

module.exports = {
  upload,
  UPLOAD_BASE_DIR
};