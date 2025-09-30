# Sistema de Autenticación - Pases App

Este documento describe el sistema de autenticación implementado en la aplicación de generación de PDFs.

## Tecnologías Utilizadas

- **TypeORM**: ORM para manejo de base de datos
- **SQLite**: Base de datos ligera para desarrollo
- **JWT (JSON Web Tokens)**: Para autenticación stateless
- **bcryptjs**: Para hash de contraseñas

## Estructura de la Base de Datos

### Tabla Users
- `id`: Identificador único (autoincremental)
- `username`: Nombre de usuario único
- `email`: Email único
- `password`: Contraseña hasheada
- `role`: Rol del usuario ('user', 'admin')
- `isActive`: Estado activo del usuario
- `createdAt`: Fecha de creación
- `updatedAt`: Fecha de última actualización

## Endpoints de Autenticación

### Registro de Usuario
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "usuario1",
  "email": "usuario@email.com",
  "password": "password123",
  "confirmPassword": "password123",
  "role": "user" // Opcional, default: "user"
}
```

### Inicio de Sesión
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "usuario1", // o email
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "message": "Login exitoso",
  "user": {
    "id": 1,
    "username": "usuario1",
    "email": "usuario@email.com",
    "role": "user",
    "isActive": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Obtener Perfil
```
GET /api/auth/profile
Authorization: Bearer <token>
```

### Actualizar Perfil
```
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "nuevo_username",
  "email": "nuevo@email.com",
  "currentPassword": "password123", // Requerido si se cambia contraseña
  "newPassword": "nueva_password"
}
```

## Endpoints Administrativos

### Listar Usuarios (Solo Admin)
```
GET /api/auth/users
Authorization: Bearer <admin_token>
```

### Obtener Usuario por ID
```
GET /api/auth/users/:id
Authorization: Bearer <token>
```
*Nota: Los usuarios pueden ver su propio perfil, los admin pueden ver cualquier perfil*

### Actualizar Usuario (Solo Admin)
```
PUT /api/auth/users/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "username": "nuevo_username",
  "email": "nuevo@email.com",
  "role": "admin",
  "isActive": false
}
```

### Eliminar Usuario (Solo Admin)
```
DELETE /api/auth/users/:id
Authorization: Bearer <admin_token>
```

## Protección de Rutas PDF

Las rutas existentes de PDF ahora requieren autenticación:

```
POST /api/generate-pdf
Authorization: Bearer <token>
Content-Type: application/json
```

## Middleware de Autenticación

### `authenticateToken`
Verifica que el token JWT sea válido y extrae la información del usuario.

### `requireActiveUser`
Verifica que el usuario esté activo en el sistema.

### `authorizeRoles(...roles)`
Verifica que el usuario tenga uno de los roles especificados.

### `requireOwnershipOrAdmin`
Permite acceso si el usuario es propietario del recurso o es administrador.

## Usuario Administrador Por Defecto

Al iniciar el servidor por primera vez, se crea un usuario administrador:

- **Username**: admin
- **Email**: admin@pases.com
- **Password**: admin123
- **Role**: admin

**⚠️ IMPORTANTE: Cambia estas credenciales en producción**

## Variables de Entorno

Crear un archivo `.env` con las siguientes variables:

```env
JWT_SECRET=tu-secreto-super-seguro-cambialo-en-produccion
JWT_EXPIRE=24h
NODE_ENV=development
PORT=3000
```

## Ejemplo de Uso con curl

### 1. Registrar usuario
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@email.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### 2. Hacer login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### 3. Generar PDF (usando token)
```bash
curl -X POST http://localhost:3000/api/generate-pdf \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "folio": "12345",
    "fecha": "2024-01-01",
    "tipoUsuario": "empleado",
    "nombreTitular": "Juan Pérez",
    "relacionPaciente": "hijo",
    "nombrePaciente": "Pedro Pérez"
  }' \
  --output pase.pdf
```

## Seguridad

- Las contraseñas se hashean con bcrypt (salt rounds: 10)
- Los tokens JWT expiran en 24 horas por defecto
- Se valida que los usuarios estén activos antes de cada operación
- Control de acceso basado en roles
- Validación de entrada en todos los endpoints

## Archivos Creados

- `backend/config/database.js` - Configuración de TypeORM
- `backend/entities/User.js` - Entidad de usuario
- `backend/services/auth.service.js` - Lógica de negocio de autenticación
- `backend/controllers/auth-controller.js` - Controladores de autenticación
- `backend/middleware/auth.middleware.js` - Middleware de autenticación y autorización
- `backend/routes/auth.routes.js` - Rutas de autenticación