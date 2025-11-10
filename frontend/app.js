// AlpineJS component factory
window.pasesApp = function () {
    return {
        // Auth & UI state
        isAuthenticated: false,
        loginError: false,
        loading: false,
        successMessage: false,
        errorMessage: false,
        errorText: '',
        showList: false,

        // Data
        records: [],
        searchQuery: '',

        // form
        form: {
            fecha: new Date().toISOString().split('T')[0],
            tipoUsuario: null,
            nombreTitular: '',
            relacionPaciente: null,
            nombrePaciente: ''
        },

        // login
        login: {
            username: '',
            password: ''
        },

        init() {
            // Called on x-init
            const storedToken = localStorage.getItem('authToken');
            if (storedToken) {
                this.checkAuthStatus();
            }

            // Listen for connectivity
            window.addEventListener('online', () => console.log('Conexión restaurada'));
            window.addEventListener('offline', () => this.showErrorMessage('Sin conexión a internet. Verifique su conectividad.'));
        },

        async checkAuthStatus() {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) return this.showLogin();

            try {
                const res = await fetch('/api/auth/protected', {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if (res.ok) {
                    this.showApp();
                } else {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('username');
                    this.showLogin();
                }
            } catch (err) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('username');
                this.showLogin();
            }
        },

        async handleLogin() {
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: this.login.username, password: this.login.password })
                });

                if (!response.ok) throw new Error('Credenciales inválidas');

                const data = await response.json();
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('username', data.username);
                this.loginError = false;
                this.showApp();
            } catch (error) {
                console.error('Error en login:', error);
                this.loginError = true;
                setTimeout(() => { this.loginError = false; }, 5000);
            }
        },

        showLogin() {
            this.isAuthenticated = false;
            this.showList = false;
            this.login.username = '';
            this.login.password = '';
        },

        async showApp() {
            this.isAuthenticated = true;
            await this.initFoliosTable();
        },

        async getFolios() {
            try {
                const res = await fetch('/api/folios', {
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                });
                if (!res.ok) throw new Error('Error al obtener folios');
                const data = await res.json();
                return data;
            } catch (err) {
                console.error('Error al obtener folios:', err);
                this.showErrorMessage('Error al obtener folios. Verifique la conexión con el servidor.');
                return [];
            }
        },

        async searchFolios(query) {
            try {
                const res = await fetch(`/api/folios/search/${encodeURIComponent(query)}`, {
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                });
                if (!res.ok) throw new Error('Error al buscar folios');
                return await res.json();
            } catch (err) {
                console.error('Error al buscar folios:', err);
                return [];
            }
        },

        async initFoliosTable() {
            this.records = await this.getFolios();
        },

        async handleSearch() {
            const q = (this.searchQuery || '').trim();
            if (q.length === 0) return this.initFoliosTable();
            if (q.length < 4) return; // mantener la misma lógica: no buscar para menos de 4
            this.records = await this.searchFolios(q);
        },

        async confirmDeactivate(id) {
            if (!confirm('¿Está seguro de que desea desactivar este folio? Esta acción no se puede deshacer.')) return;
            await this.deactivateFolio(id);
        },

        async deactivateFolio(folioId) {
            try {
                const res = await fetch(`/api/folios/deactivate/${folioId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                });
                if (!res.ok) throw new Error('Error al desactivar folio');
                await this.handleSearch();
                this.showSuccess();
            } catch (err) {
                console.error('Error al desactivar folio:', err);
                this.showErrorMessage('Error al desactivar folio. Verifique la conexión con el servidor.');
            }
        },

        handleViewRecords() {
            this.showList = !this.showList;
        },

        async handleClearSearch() {
            this.searchQuery = '';
            await this.initFoliosTable();
        },

        handleLogout() {
            localStorage.removeItem('authToken');
            localStorage.removeItem('username');
            this.isAuthenticated = false;
            this.resetForm();
            this.showLogin();
        },

        async handleSubmit() {
            if (!this.isAuthenticated) { alert('Debe estar autenticado para realizar esta acción'); return; }
            this.loading = true;
            this.hideMessages();

            try {
                const payload = {
                    fecha: this.form.fecha,
                    tipoPersona: this.form.tipoUsuario,
                    nombreTitular: this.form.nombreTitular,
                    tipoPaciente: this.form.relacionPaciente,
                    nombrePaciente: this.form.nombrePaciente
                };

                const res = await fetch('/api/generate-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);

                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `pase-medico-${this.form.fecha}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                this.showSuccess();
                await this.initFoliosTable();
            } catch (err) {
                console.error('Error al generar PDF:', err);
                this.showErrorMessage(err.message || 'Error al generar el PDF. Verifique la conexión con el servidor.');
            } finally {
                this.loading = false;
            }
        },

        showLoading() { this.loading = true; },
        hideLoading() { this.loading = false; },

        showSuccess() {
            this.successMessage = true;
            setTimeout(() => { this.successMessage = false; }, 5000);
        },

        showErrorMessage(message) {
            this.errorText = message;
            this.errorMessage = true;
            setTimeout(() => { this.errorMessage = false; }, 8000);
        },

        hideMessages() {
            this.successMessage = false;
            this.errorMessage = false;
        },

        resetForm() {
            this.form = {
                fecha: new Date().toISOString().split('T')[0],
                tipoUsuario: null,
                nombreTitular: '',
                relacionPaciente: null,
                nombrePaciente: ''
            };
            this.hideMessages();
        },

        isFormValid() {
            return this.form.fecha && this.form.nombreTitular.trim() && this.form.nombrePaciente.trim() && this.form.tipoUsuario && this.form.relacionPaciente;
        },

        // small helper used when typing names from within Alpine (optional, preserves capitalization behavior)
        capitalizeWords(str) {
            return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
        }
    };
};