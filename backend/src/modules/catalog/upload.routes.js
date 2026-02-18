const express = require('express');
const { upload } = require('../../config/upload');
const { requireAuth, requireRole } = require('../../middleware/auth');

const router = express.Router();

// Solo Provider puede subir ficheros para sus datasets
router.post(
  '/dataset-file',
  requireAuth,
  requireRole(['PROVIDER']),
  upload.single('file'),
  (req, res, next) => {
    try {
      if (!req.file) {
        const err = new Error('No se recibió ningún archivo');
        err.status = 400;
        throw err;
      }

      // ruta relativa dentro de storage/uploads
      const relativePath = `uploads/${req.file.filename}`;

      res.status(201).json({
        message: 'Archivo subido correctamente',
        storageUri: relativePath,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;