// Estado de la aplicación
let isAuthenticated = false;

// Referencias a elementos del DOM
const loginSection = document.getElementById('loginSection');
const appSection = document.getElementById('appSection');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const paseForm = document.getElementById('paseForm');
const resetFormBtn = document.getElementById('resetForm');
const loadingState = document.getElementById('loadingState');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

// Credenciales simples (en producción esto debería ser más seguro)
const validCredentials = {
    username: 'admin',
    password: 'pases123'
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Configurar fecha actual
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = today;

    // Event listeners
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    paseForm.addEventListener('submit', handleSubmit);
    resetFormBtn.addEventListener('click', resetForm);

    // Verificar si ya está autenticado
    checkAuthStatus();
});

// Verificar estado de autenticación
function checkAuthStatus() {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
        showApp();
    } else {
        showLogin();
    }
}

// Manejar login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try{
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        console.log(response);

        if (!response.ok) {
            throw new Error('Credenciales inválidas');
        }
        
        const data = await response.json();
    }catch (error) {
        showError();
        
    }
    hideError();
    showApp();
}

// Manejar logout
function handleLogout() {
    localStorage.removeItem('authToken');
    isAuthenticated = false;
    resetForm();
    showLogin();
}

// Mostrar pantalla de login
function showLogin() {
    loginSection.classList.remove('hidden');
    appSection.classList.add('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    hideError();
}

// Mostrar aplicación principal
function showApp() {
    loginSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    isAuthenticated = true;
}

// Mostrar error de login
function showError() {
    loginError.classList.remove('hidden');
    setTimeout(() => {
        hideError();
    }, 5000);
}

// Ocultar error de login
function hideError() {
    loginError.classList.add('hidden');
}

// Manejar envío del formulario
async function handleSubmit(e) {
    e.preventDefault();
    
    if (!isAuthenticated) {
        alert('Debe estar autenticado para realizar esta acción');
        return;
    }

    // Mostrar estado de carga
    showLoading();
    hideMessages();

    // Recopilar datos del formulario
    const formData = {
        folio: document.getElementById('folio').value,
        fecha: document.getElementById('fecha').value,
        tipoUsuario: document.querySelector('input[name="tipoUsuario"]:checked').value,
        nombreTitular: document.getElementById('nombreTitular').value,
        relacionPaciente: document.querySelector('input[name="relacionPaciente"]:checked').value,
        nombrePaciente: document.getElementById('nombrePaciente').value
    };

    try {
        // Enviar datos al backend
        const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }

        // Obtener el blob del PDF
        const blob = await response.blob();
        
        // Crear URL para descarga
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `pase-medico-${formData.folio}-${formData.fecha}.pdf`;
        
        // Agregar al DOM y hacer click para descargar
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Mostrar éxito
        showSuccess();
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        showErrorMessage(error.message || 'Error al generar el PDF. Verifique la conexión con el servidor.');
    } finally {
        hideLoading();
    }
}

// Mostrar estado de carga
function showLoading() {
    paseForm.classList.add('hidden');
    loadingState.classList.remove('hidden');
}

// Ocultar estado de carga
function hideLoading() {
    loadingState.classList.add('hidden');
    paseForm.classList.remove('hidden');
}

// Mostrar mensaje de éxito
function showSuccess() {
    successMessage.classList.remove('hidden');
    setTimeout(() => {
        successMessage.classList.add('hidden');
    }, 5000);
}

// Mostrar mensaje de error
function showErrorMessage(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 8000);
}

// Ocultar mensajes
function hideMessages() {
    successMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');
}

// Resetear formulario
function resetForm() {
    paseForm.reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = today;
    hideMessages();
}

// Validación adicional en tiempo real
document.addEventListener('DOMContentLoaded', function() {
    // Validar folio (solo números y letras)
    document.getElementById('folio').addEventListener('input', function(e) {
        this.value = this.value.replace(/[^a-zA-Z0-9]/g, '');
    });

    // Capitalizar nombres
    document.getElementById('nombreTitular').addEventListener('input', function(e) {
        this.value = capitalizeWords(this.value);
    });

    document.getElementById('nombrePaciente').addEventListener('input', function(e) {
        this.value = capitalizeWords(this.value);
    });
});

// Función auxiliar para capitalizar palabras
function capitalizeWords(str) {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

// Manejo de errores de red
window.addEventListener('online', function() {
    console.log('Conexión restaurada');
});

window.addEventListener('offline', function() {
    showErrorMessage('Sin conexión a internet. Verifique su conectividad.');
});