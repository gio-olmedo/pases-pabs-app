// Estado de la aplicación
let isAuthenticated = false;

/* Referencias a elementos del DOMc */
//Seccciones
const loginSection = document.getElementById('loginSection');
const listUsersSection = document.getElementById('listUsersSection');
const appSection = document.getElementById('appSection');
const formSection = document.getElementById('formSection');

// Formulario de login
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

// Botones de navegación
const logoutBtn = document.getElementById('logoutBtn');
const viewRecordsBtn = document.getElementById('viewRecordsBtn');

// Formulario de pase
const paseForm = document.getElementById('paseForm');
const submitBtn = document.getElementById('submitBtn');
const resetFormBtn = document.getElementById('resetForm');

const loadingState = document.getElementById('loadingState');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

const menuText = document.getElementById('menuText');

// Tabla de Registros
const recordsTableBody = document.getElementById('recordsTableBody');
const searchInput = document.getElementById('searchInput');
// const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');


// Inicialización
document.addEventListener('DOMContentLoaded', function () {
    // Configurar fecha actual
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = today;

    // Event listeners
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    paseForm.addEventListener('submit', handleSubmit);
    resetFormBtn.addEventListener('click', resetForm);
    viewRecordsBtn.addEventListener('click', handleViewRecords);
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace') {
            handleSearch();
        }
    });
    clearSearchBtn.addEventListener('click', handleClearSearch);
    // searchBtn.addEventListener('click', handleSearch);

    // Event listeners para validación del formulario
    setupFormValidation();

    // Verificar si ya está autenticado
    checkAuthStatus();
});

// Verificar estado de autenticación
function checkAuthStatus() {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
        // Verificar si el token es válido
        fetch('/api/auth/protected', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
            .then(response => {
                if (response.ok) {
                    showApp();
                } else {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('username');
                    showLogin();
                }
            })
            .catch(() => {
                localStorage.removeItem('authToken');
                localStorage.removeItem('username');
                showLogin();
            });
    } else {
        showLogin();
    }
}

// Manejar login
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error('Credenciales inválidas');
        }

        const data = await response.json();

        // Guardar token
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('username', data.username);

        hideError();
        showApp();

    } catch (error) {
        console.error('Error en login:', error);
        showError();
    }
}
async function searchFolios(query) {
    try {
        const response = await fetch(`/api/folios/search/${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al buscar folios');
        }

        const data = await response.json();
        return data; // 👈 ahora sí devuelve el array de folios
    } catch (error) {
        console.error('Error al buscar folios:', error);
        return [];
    }
}

async function getFolios() {
    try {
        const response = await fetch('/api/folios', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener folios');
        }

        const data = await response.json();
        return data; // 👈 ahora sí devuelve el array de folios
    } catch (error) {
        console.error('Error al obtener folios:', error);
        showErrorMessage('Error al obtener folios. Verifique la conexión con el servidor.');
        return []; // 👈 así evitas que sea undefined
    }
}

function initDeactivateButtons() {
    const deactivateButtons = document.querySelectorAll('[id^="deactivateBtn-"]');
    console.log('Botones de desactivar encontrados:', deactivateButtons.length);
    deactivateButtons.forEach(button => {
        button.addEventListener('click', handleDeactivateFolio);
    });
}

async function initFoliosTable() {
    const folios = await getFolios();
    fillData(folios);
}

function fillData(folios) {
    recordsTableBody.innerHTML = ''; // Limpiar tabla
    folios.forEach((folio, i) => {
        const row = document.createElement('tr');
        row.classList.add('bg-white', 'border-b', 'hover:bg-gray-50');

        const isActive = !folio.fechaDesactivacion;
        const statusBadge = isActive
            ? '<span class="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">Activo</span>'
            : '<span class="inline-block px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">Desactivado</span>';

        row.innerHTML = `
            <td class="px-6 py-4">${folio.folio}</td>
            <td class="px-6 py-4">${folio.tipoPaciente}</td>
            <td class="px-6 py-4">${folio.nombrePaciente}</td>
            <td class="px-6 py-4">${folio.nombreTitular}</td>
            <td class="px-6 py-4">${statusBadge}</td>
            <td class="px-6 py-4">${folio.fecha}</td>
            <td class="px-6 py-4">
                ${isActive ? `<button id="deactivateBtn-${folio.id}" class="deactivateBtn bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded" data-id="${folio.id}"><i class="fa-solid fa-trash"></i></button>` : ''}
            </td>
        `;
        recordsTableBody.appendChild(row);
    });
    initDeactivateButtons();
}

async function deactivateFolio(folioId) {
    try {
        const response = await fetch(`/api/folios/deactivate/${folioId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al desactivar folio');
        }

        // Refrescar tabla
        handleSearch(); // Si hay búsqueda activa, refresca con el término actual
        showSuccess();

    } catch (error) {
        console.error('Error al desactivar folio:', error);
        showErrorMessage('Error al desactivar folio. Verifique la conexión con el servidor.');
    }
}

async function handleDeactivateFolio(e) {
    const button = e.currentTarget;
    const folioId = button.getAttribute('data-id');
    console.log('ID del folio a desactivar:', folioId);
    if (confirm('¿Está seguro de que desea desactivar este folio? Esta acción no se puede deshacer.')) {
        await deactivateFolio(folioId);
    }
}

// Manejar logout
function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    isAuthenticated = false;
    resetForm();
    showLogin();
}

function handleViewRecords() {
    if (menuText.textContent === 'Ver Registros') {
        menuText.textContent = 'Volver al Formulario';
        formSection.classList.add('hidden');
        listUsersSection.classList.remove('hidden');
    } else {
        menuText.textContent = 'Ver Registros';
        formSection.classList.remove('hidden');
        listUsersSection.classList.add('hidden');
    }
}

// Mostrar pantalla de login
function showLogin() {
    loginSection.classList.remove('hidden');
    appSection.classList.add('hidden');
    listUsersSection.classList.add('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    hideError();
}

// Mostrar aplicación principal
function showApp() {
    initFoliosTable()
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
        // folio: document.getElementById('folio').value,
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
            body: JSON.stringify({
                // folio: formData.folio,
                fecha: formData.fecha,
                tipoPersona: formData.tipoUsuario,
                nombreTitular: formData.nombreTitular,
                tipoPaciente: formData.relacionPaciente,
                nombrePaciente: formData.nombrePaciente
            })
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
        a.download = `pase-medico-${formData.fecha}.pdf`;

        // Agregar al DOM y hacer click para descargar
        document.body.appendChild(a);
        a.click();

        // Limpiar
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Mostrar éxito
        showSuccess();
        initFoliosTable();
        toggleSubmitButton(false);
        // resetForm();
    } catch (error) {
        console.error('Error al generar PDF:', error);
        showErrorMessage(error.message || 'Error al generar el PDF. Verifique la conexión con el servidor.');
    } finally {
        hideLoading();
    }
}

async function handleSearch() {
    const query = searchInput.value.trim();
    switch (query.length) {
        case 0:
            return initFoliosTable();
        case 1:
        case 2:
        case 3:
            return; // No hacer nada para menos de 4 caracteres
    }
    const folios = await searchFolios(query);
    fillData(folios);
}

async function handleClearSearch() {
    searchInput.value = '';
    initFoliosTable();
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
    validateForm(); // Revalidar después de resetear
}

// Configurar validación del formulario
function setupFormValidation() {
    const formElements = [
        document.getElementById('fecha'),
        document.getElementById('nombreTitular'),
        document.getElementById('nombrePaciente')
    ];

    const radioGroups = [
        document.getElementsByName('tipoUsuario'),
        document.getElementsByName('relacionPaciente')
    ];

    // Event listeners para campos de texto
    formElements.forEach(element => {
        if (element) {
            element.addEventListener('input', validateForm);
            element.addEventListener('blur', validateForm);
        }
    });

    // Event listeners para radio buttons
    radioGroups.forEach(group => {
        Array.from(group).forEach(radio => {
            radio.addEventListener('change', validateForm);
        });
    });

    // Validación inicial
    validateForm();
}
function toggleSubmitButton(enabled) {
    if (submitBtn) {
        submitBtn.disabled = !enabled;

        if (enabled) {
            submitBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
            submitBtn.classList.add('bg-blue-500', 'hover:bg-blue-600', 'cursor-pointer');
        } else {
            submitBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600', 'cursor-pointer');
            submitBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
        }
    }
}

// Validar formulario completo
function validateForm() {
    const fecha = document.getElementById('fecha').value.trim();
    const nombreTitular = document.getElementById('nombreTitular').value.trim();
    const nombrePaciente = document.getElementById('nombrePaciente').value.trim();
    const tipoUsuario = document.querySelector('input[name="tipoUsuario"]:checked');
    const relacionPaciente = document.querySelector('input[name="relacionPaciente"]:checked');

    const isValid = fecha && nombreTitular && nombrePaciente && tipoUsuario && relacionPaciente;

    toggleSubmitButton(isValid);

    return isValid;
}

// Validación adicional en tiempo real
document.addEventListener('DOMContentLoaded', function () {
    //  Validar folio (solo números y letras)
    // document.getElementById('folio').addEventListener('input', function(e) {
    //     this.value = this.value.replace(/[^a-zA-Z0-9]/g, '');
    // });

    // Capitalizar nombres
    document.getElementById('nombreTitular').addEventListener('input', function (e) {
        this.value = capitalizeWords(this.value);
        validateForm(); // Revalidar después de capitalizar
    });

    document.getElementById('nombrePaciente').addEventListener('input', function (e) {
        this.value = capitalizeWords(this.value);
        validateForm(); // Revalidar después de capitalizar
    });
});

// Función auxiliar para capitalizar palabras
function capitalizeWords(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

// Manejo de errores de red
window.addEventListener('online', function () {
    console.log('Conexión restaurada');
});

window.addEventListener('offline', function () {
    showErrorMessage('Sin conexión a internet. Verifique su conectividad.');
});