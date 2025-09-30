const express = require('express');
const { PDFController } = require('../controllers/pdfController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Ruta para generar PDF (requiere autenticación)
router.post('/generate-pdf', authenticateToken, PDFController.generatePDF);

module.exports = router;