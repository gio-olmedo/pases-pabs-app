require("reflect-metadata");

const express = require('express');
const path = require('path');
const { AppDataSource } = require('./config/database');
const { PORT } = require('./config/constants');

// Importar rutas
const authRoutes = require('./routes/auth');
const pdfRoutes = require('./routes/pdf');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Configurar rutas
app.use('/api/auth', authRoutes);
app.use('/api', pdfRoutes);

// Ruta para servir el frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Inicializar base de datos y servidor
AppDataSource.initialize()
    .then(() => {
        console.log('Base de datos conectada exitosamente');
        
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en puerto ${PORT}`);
            console.log(`Frontend disponible en: http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error al conectar a la base de datos:', error);
    });

module.exports = app;
