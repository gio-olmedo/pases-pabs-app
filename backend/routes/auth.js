const express = require('express');
const { AuthController } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Registrar usuario
router.post('/register', AuthController.register);

// Login
router.post('/login', AuthController.login);

// Ruta de prueba para verificar autenticación
router.get('/protected', authenticateToken, AuthController.getProtected);

module.exports = router;