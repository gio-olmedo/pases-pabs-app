const { AuthService } = require('../services/authService');

class AuthController {
    static async register(req, res) {
        try {
            const { username, password } = req.body;
            const result = await AuthService.registerUser(username, password);
            res.status(201).json(result);
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            
            if (error.message === 'Username y password son requeridos' || 
                error.message === 'El usuario ya existe') {
                return res.status(400).json({ error: error.message });
            }
            
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    static async login(req, res) {
        try {
            const { username, password } = req.body;
            const result = await AuthService.loginUser(username, password);
            res.json(result);
        } catch (error) {
            console.error('Error al hacer login:', error);
            
            if (error.message === 'Username y password son requeridos' || 
                error.message === 'Credenciales inválidas') {
                return res.status(401).json({ error: error.message });
            }
            
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    static async getProtected(req, res) {
        res.json({ message: 'Acceso autorizado', user: req.user });
    }
}

module.exports = { AuthController };