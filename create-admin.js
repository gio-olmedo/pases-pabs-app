const bcrypt = require('bcryptjs');
const { AppDataSource } = require('./backend/config/database');
const { User } = require('./backend/entities/User');

// Script para crear usuario inicial
async function createInitialUser() {
    try {
        await AppDataSource.initialize();
        console.log('Base de datos conectada');

        const userRepository = AppDataSource.getRepository(User);
        
        // Verificar si ya existe el usuario admin
        const existingUser = await userRepository.findOne({ where: { username: 'admin' } });
        
        if (existingUser) {
            console.log('El usuario admin ya existe');
            return;
        }

        // Crear usuario admin
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const adminUser = userRepository.create({
            username: 'admin',
            password: hashedPassword
        });

        await userRepository.save(adminUser);
        console.log('Usuario admin creado exitosamente');
        console.log('Username: admin');
        console.log('Password: admin123');
        
    } catch (error) {
        console.error('Error al crear usuario inicial:', error);
    } finally {
        process.exit();
    }
}

createInitialUser();