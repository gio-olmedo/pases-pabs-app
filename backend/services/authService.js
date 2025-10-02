const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppDataSource } = require('../config/database');
const { User } = require('../entities/User');
const { JWT_SECRET, BCRYPT_ROUNDS, TOKEN_EXPIRATION } = require('../config/constants');

class AuthService {
    constructor(userRepository = null) {
        this.userRepository = userRepository || AppDataSource.getRepository(User);
    }

    async registerUser(username, password) {
        if (!username || !password) {
            throw new Error('Username y password son requeridos');
        }
        
        // Verificar si el usuario ya existe
        const existingUser = await this.userRepository.findOne({ where: { username } });
        if (existingUser) {
            throw new Error('El usuario ya existe');
        }

        // Encriptar password
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        // Crear nuevo usuario
        const newUser = this.userRepository.create({
            username,
            password: hashedPassword
        });

        await this.userRepository.save(newUser);
        return { message: 'Usuario creado exitosamente' };
    }

    async loginUser(username, password) {
        if (!username || !password) {
            throw new Error('Username y password son requeridos');
        }

        const user = await this.userRepository.findOne({ where: { username } });

        if (!user) {
            throw new Error('Credenciales inválidas');
        }

        // Verificar password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            throw new Error('Credenciales inválidas');
        }

        // console.log(JWT_SECRET);
        // Generar JWT
        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRATION }
        );

        return { token, username: user.username };
    }
}

// Factory function para crear una instancia con dependencias inyectadas
const createAuthService = (userRepository = null) => {
    return new AuthService(userRepository);
};

// Exportar tanto la clase como una instancia por defecto para compatibilidad
const authServiceInstance = new AuthService();

module.exports = { 
    AuthService, 
    createAuthService,
    authService: authServiceInstance 
};