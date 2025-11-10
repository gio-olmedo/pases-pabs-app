const express = require('express');
const { FolioController } = require('../controllers/folioController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Ruta para generar PDF (requiere autenticación)
router.get('/', authenticateToken, FolioController.index);
router.get('/search/:folio', authenticateToken, FolioController.search);
router.post('/deactivate/:id', authenticateToken, FolioController.deactivateFolio);
router.put('/:id', authenticateToken, FolioController.updateFolio);
router.post('/filter', authenticateToken, FolioController.filterFolios);

//Rutas públicas
router.get('/by-hash/:hash', FolioController.byHash);

module.exports = router;