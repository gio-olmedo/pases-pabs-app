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

        // filters & pagination
        filters: {
            fechaInicio: '',
            fechaFin: '',
            page: 1,
            size: 20,
            tipoPaciente: '',
            tipoPersona: '',
            tipoAtencion: '',
            status: ''
        },
        totalRecords: 0,
        totalPages: 0,

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
            // Build query string from filters
            const f = this.filters;
            try {
                const body = {
                    fechaInicio: f.fechaInicio,
                    fechaFin: f.fechaFin,
                    tipoPaciente: f.tipoPaciente,
                    tipoPersona: f.tipoPersona,
                    tipoAtencion: f.tipoAtencion,
                    status: f.status,
                    page: f.page || 1,
                    size: f.size || 20,
                    term : this.searchQuery && this.searchQuery.trim().length >= 1 ? this.searchQuery.trim() : undefined
                }

                const url = `/api/folios/filter`;
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
                    body: JSON.stringify(body)
                });

                if (!res.ok) throw new Error('Error al obtener folios');
                const data = await res.json();

                // Support either: [array] or { data: [], total, page, size }
                if (Array.isArray(data)) {
                    this.totalRecords = data.length;
                    this.totalPages = 1;
                    return data;
                } else if (data && Array.isArray(data.data)) {
                    this.totalRecords = data.total || data.count || data.data.length;
                    this.totalPages = Math.max(1, Math.ceil((data.total || data.count || data.data.length) / (data.size || this.filters.size || 20)));
                    // update page/size from server response if provided
                    this.filters.page = data.page || this.filters.page;
                    this.filters.size = data.size || this.filters.size;
                    return data.data;
                } else {
                    // unexpected shape
                    this.totalRecords = 0;
                    this.totalPages = 0;
                    return [];
                }
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
            const data = await this.getFolios();
            this.records = data || [];
        },

        async handleSearch() {
            console.log('Buscando folios para query:', this.searchQuery);
            const q = (this.searchQuery || '').trim();
            // reset to first page on new search
            this.filters.page = 1;
            // if empty, fetch normally
            if (q.length === 0) { await this.initFoliosTable(); return; }
            // keep previous behavior: require min length 4
            if (q.length < 4) return;
            const res = await this.searchFolios(q);
            this.records = res || [];
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

        // Filters & pagination handlers
        async applyFilters() {
            this.filters.page = 1;
            await this.initFoliosTable();
        },

        async clearFilters() {
            this.filters = {
                fechaInicio: '',
                fechaFin: '',
                page: 1,
                size: 20,
                tipoPaciente: '',
                tipoPersona: '',
                tipoAtencion: '',
                status: ''
            };
            this.searchQuery = '';
            await this.initFoliosTable();
        },

        async goToPage(page) {
            if (!page || page < 1) return;
            // clamp
            if (this.totalPages && page > this.totalPages) page = this.totalPages;
            this.filters.page = page;
            await this.initFoliosTable();
        },

        async changePageSize() {
            // when page size changes, go back to page 1
            this.filters.page = 1;
            await this.initFoliosTable();
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