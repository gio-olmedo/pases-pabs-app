#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAuthentication() {
    console.log('🧪 Iniciando pruebas del sistema de autenticación...\n');

    try {
        // Test 1: Health check
        console.log('1. Probando health check...');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health check OK:', healthResponse.data.message);

        // Test 2: Registro de usuario
        console.log('\n2. Probando registro de usuario...');
        const userData = {
            username: 'testuser',
            email: 'test@email.com',
            password: 'password123',
            confirmPassword: 'password123'
        };

        try {
            const registerResponse = await axios.post(`${BASE_URL}/auth/register`, userData);
            console.log('✅ Usuario registrado:', registerResponse.data.user.username);
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.message?.includes('ya existe')) {
                console.log('⚠️ Usuario ya existe, continuando...');
            } else {
                throw error;
            }
        }

        // Test 3: Login
        console.log('\n3. Probando login...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'testuser',
            password: 'password123'
        });
        console.log('✅ Login exitoso para:', loginResponse.data.user.username);
        const token = loginResponse.data.token;

        // Test 4: Obtener perfil
        console.log('\n4. Probando obtener perfil...');
        const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Perfil obtenido:', profileResponse.data.user.username);

        // Test 5: Probar PDF protegido
        console.log('\n5. Probando generación de PDF con autenticación...');
        const pdfData = {
            folio: '12345',
            fecha: '2024-01-01',
            tipoUsuario: 'empleado',
            nombreTitular: 'Juan Pérez',
            relacionPaciente: 'hijo',
            nombrePaciente: 'Pedro Pérez'
        };

        const pdfResponse = await axios.post(`${BASE_URL}/generate-pdf`, pdfData, {
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer'
        });
        console.log('✅ PDF generado exitosamente, tamaño:', pdfResponse.data.length, 'bytes');

        // Test 6: Login con admin
        console.log('\n6. Probando login de administrador...');
        const adminLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });
        console.log('✅ Login admin exitoso:', adminLoginResponse.data.user.username);
        const adminToken = adminLoginResponse.data.token;

        // Test 7: Listar usuarios (admin)
        console.log('\n7. Probando listar usuarios (admin)...');
        const usersResponse = await axios.get(`${BASE_URL}/auth/users`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Usuarios obtenidos:', usersResponse.data.users.length, 'usuarios');

        console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
        console.log('\n--- Resumen ---');
        console.log('✅ Health check');
        console.log('✅ Registro de usuario');
        console.log('✅ Login de usuario');
        console.log('✅ Obtener perfil');
        console.log('✅ Generación de PDF protegida');
        console.log('✅ Login de administrador');
        console.log('✅ Listar usuarios (admin)');

    } catch (error) {
        console.error('❌ Error en las pruebas:', error.response?.data || error.message);
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.log('🔐 Error de autenticación/autorización');
        }
        process.exit(1);
    }
}

// Test sin autenticación (debería fallar)
async function testWithoutAuth() {
    console.log('\n🔒 Probando acceso sin autenticación (debería fallar)...');
    
    try {
        const pdfData = {
            folio: '12345',
            fecha: '2024-01-01',
            tipoUsuario: 'empleado',
            nombreTitular: 'Juan Pérez',
            relacionPaciente: 'hijo',
            nombrePaciente: 'Pedro Pérez'
        };

        await axios.post(`${BASE_URL}/generate-pdf`, pdfData);
        console.log('❌ ERROR: Se pudo acceder sin autenticación');
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Correctamente bloqueado sin autenticación');
        } else {
            console.log('❌ Error inesperado:', error.response?.status, error.response?.data);
        }
    }
}

// Ejecutar pruebas
if (require.main === module) {
    (async () => {
        await testAuthentication();
        await testWithoutAuth();
    })();
}

module.exports = { testAuthentication, testWithoutAuth };