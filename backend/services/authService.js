const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppDataSource } = require('../config/database');
const { User } = require('../entities/User');
const { JWT_SECRET, BCRYPT_ROUNDS, TOKEN_EXPIRATION } = require('../config/constants');

class AuthService {
    static async registerUser(username, password) {
        if (!username || !password) {
            throw new Error('Username y password son requeridos');
        }

        const userRepository = AppDataSource.getRepository(User);
        
        // Verificar si el usuario ya existe
        const existingUser = await userRepository.findOne({ where: { username } });
        if (existingUser) {
            throw new Error('El usuario ya existe');
        }

        // Encriptar password
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        // Crear nuevo usuario
        const newUser = userRepository.create({
            username,
            password: hashedPassword
        });

        await userRepository.save(newUser);
        return { message: 'Usuario creado exitosamente' };
    }

    static async loginUser(username, password) {
        if (!username || !password) {
            throw new Error('Username y password son requeridos');
        }

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { username } });

        if (!user) {
            throw new Error('Credenciales inválidas');
        }

        // Verificar password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            throw new Error('Credenciales inválidas');
        }

        // Generar JWT
        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRATION }
        );

        return { token, username: user.username };
    }
}

module.exports = { AuthService };