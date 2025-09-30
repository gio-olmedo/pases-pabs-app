# Estructura del Backend Reestructurado

## 📁 Organización de Carpetas

```
backend/
├── config/
│   ├── constants.js     # Constantes de configuración
│   └── database.js      # Configuración de base de datos
├── controllers/
│   ├── index.js         # Exportaciones centralizadas
│   ├── authController.js    # Controlador de autenticación
│   └── pdfController.js     # Controlador de generación PDF
├── entities/
│   └── User.js          # Entidad de usuario
├── middleware/
│   └── auth.js          # Middleware de autenticación JWT
├── routes/
│   ├── auth.js          # Rutas de autenticación
│   └── pdf.js           # Rutas de PDF
├── services/
│   ├── index.js         # Exportaciones centralizadas
│   ├── authService.js   # Lógica de negocio de autenticación
│   └── pdfService.js    # Lógica de negocio de PDF
└── server.js            # Servidor principal (simplificado)
```

## 🔧 Componentes

### Services (Servicios)
Contienen la lógica de negocio:
- **AuthService**: Registro, login, validaciones de usuarios
- **PDFService**: Generación y validación de PDFs

### Controllers (Controladores)
Manejan las peticiones HTTP y respuestas:
- **AuthController**: Endpoints de autenticación
- **PDFController**: Endpoints de generación de PDF

### Routes (Rutas)
Definen los endpoints y asocian middleware:
- **auth.js**: `/api/auth/register`, `/api/auth/login`, `/api/auth/protected`
- **pdf.js**: `/api/generate-pdf`

### Middleware
- **auth.js**: Middleware de autenticación JWT

### Config
- **constants.js**: Variables de configuración centralizadas

## 🚀 Beneficios de esta Estructura

1. **Separación de Responsabilidades**: Cada archivo tiene una función específica
2. **Mantenibilidad**: Fácil de encontrar y modificar código
3. **Escalabilidad**: Fácil agregar nuevos servicios y controladores
4. **Testabilidad**: Servicios y controladores pueden probarse independientemente
5. **Reutilización**: Los servicios pueden usarse desde múltiples controladores

## 📝 Endpoints Disponibles

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/protected` - Endpoint protegido (requiere token)

### PDF
- `POST /api/generate-pdf` - Generar pase médico (requiere autenticación)

## ⚙️ Configuración

Las constantes se manejan centralizadamente en `config/constants.js`:
- JWT_SECRET
- PORT
- BCRYPT_ROUNDS
- TOKEN_EXPIRATION

## 🔒 Autenticación

El sistema usa JWT (JSON Web Tokens) con las siguientes características:
- Tokens válidos por 24 horas
- Middleware de autenticación reutilizable
- Encriptación de contraseñas con bcrypt (10 rounds)