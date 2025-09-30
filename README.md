# API de Generación de Pases Médicos

## Descripción
API sencilla para generar PDFs de pases médicos con autenticación JWT y base de datos SQLite.

## Instalación y Configuración

### 1. Instalar dependencias
Las dependencias ya están configuradas en el `package.json`.

### 2. Crear usuario administrador inicial
```bash
npm run create-admin
```
Esto creará un usuario con:
- **Username**: admin
- **Password**: admin123

### 3. Iniciar el servidor
```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

El servidor se ejecutará en `http://localhost:3000`

## Endpoints de la API

### Autenticación

#### POST `/api/auth/register`
Registra un nuevo usuario.

**Body:**
```json
{
    "username": "nuevo_usuario",
    "password": "contraseña"
}
```

**Respuesta exitosa (201):**
```json
{
    "message": "Usuario creado exitosamente"
}
```

#### POST `/api/auth/login`
Inicia sesión y obtiene un token JWT.

**Body:**
```json
{
    "username": "admin",
    "password": "admin123"
}
```

**Respuesta exitosa (200):**
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "username": "admin"
}
```

### Generación de PDF

#### POST `/api/generate-pdf`
Genera un PDF con los datos del pase médico. **Requiere autenticación JWT**.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
    "folio": "001",
    "fecha": "2024-01-15",
    "tipoPersona": "empleado",
    "nombreTitular": "Juan Pérez García",
    "tipoPaciente": "hijo",
    "nombrePaciente": "María Pérez López"
}
```

**Campos requeridos:**
- `folio`: Número de folio del pase
- `fecha`: Fecha en formato YYYY-MM-DD
- `tipoPersona`: "empleado" o "cliente"
- `nombreTitular`: Nombre completo del titular del servicio
- `tipoPaciente`: "hijo", "esposo" o "beneficiario"
- `nombrePaciente`: Nombre completo del paciente

**Respuesta:** PDF file download

### Rutas auxiliares

#### GET `/api/protected`
Ruta de prueba para verificar autenticación.

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
    "message": "Acceso autorizado",
    "user": {
        "id": 1,
        "username": "admin"
    }
}
```

#### GET `/`
Sirve la interfaz web del frontend.

## Uso de la Interfaz Web

1. Navega a `http://localhost:3000`
2. Inicia sesión con las credenciales:
   - Username: `admin`
   - Password: `admin123`
3. Completa el formulario de pase médico
4. Haz clic en "Generar PDF" para descargar el archivo

## Estructura del Proyecto

```
backend/
├── server.js              # Servidor principal Express
├── config/
│   └── database.js        # Configuración de TypeORM
└── entities/
    └── User.js            # Entidad User para TypeORM

frontend/
├── index.html             # Interfaz web
├── app.js                # Lógica del frontend
└── styles.css            # Estilos (si existen)

create-admin.js            # Script para crear usuario admin
package.json              # Dependencias y scripts
database.sqlite           # Base de datos SQLite (se crea automáticamente)
```

## Tecnologías Utilizadas

- **Backend:**
  - Express.js
  - TypeORM
  - SQLite
  - JWT (jsonwebtoken)
  - bcryptjs
  - PDFKit

- **Frontend:**
  - HTML5
  - JavaScript vanilla
  - TailwindCSS
  - Font Awesome

## Notas de Seguridad

- En producción, cambia el `JWT_SECRET` por una clave más segura
- Considera implementar validaciones adicionales
- El usuario inicial debe cambiarse en producción
- Agrega límites de rate limiting para las APIs

## Extensiones Futuras

La API está diseñada para ser fácilmente extensible:

- Agregar más campos al formulario de pase
- Implementar roles de usuario
- Agregar historial de pases generados
- Implementar templates de PDF personalizables
- Agregar validaciones más robustas
- Implementar logs de auditoría