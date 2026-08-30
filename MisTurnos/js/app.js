// @ts-nocheck
/*
 * MisTurnos - © 2026 Sebastián Russo
 * Todos los derechos reservados.
 *
 * APP.JS - LÓGICA PRINCIPAL DE MisTurnos
 */

const Cache = {
    _store: {},
    _timestamps: {},
    _ttl: 5 * 60 * 1000,

    get(key) {
        if (!this._store[key]) return null;
        const age = Date.now() - (this._timestamps[key] || 0);
        if (age > this._ttl) {
            delete this._store[key];
            delete this._timestamps[key];
            return null;
        }
        return this._store[key];
    },

    set(key, data) {
        this._store[key] = data;
        this._timestamps[key] = Date.now();
    },

    invalidate(key) {
        delete this._store[key];
        delete this._timestamps[key];
    },

    invalidateAll() {
        this._store = {};
        this._timestamps = {};
    }
};

const App = {

    _lastActivity: Date.now(),
    _sessionTimeout: 30 * 60 * 1000, // 30 minutos

    init() {
        console.log('[App] Inicializando MisTurnos...');
        const versionEl = document.getElementById('appVersion');
        if (versionEl) versionEl.textContent = 'v' + this.APP_VERSION;
        this.registerServiceWorker();
        this.loadTheme();
        Auth.checkSession();
        this.setDefaultDates();
        this.startSessionMonitor();
        this.handlePaymentCallback();

        window.addEventListener('hashchange', () => this.handleHashChange());

        const modalEl = document.getElementById('appModal');
        if (modalEl) {
            modalEl.addEventListener('hidden.bs.modal', () => {
                if (typeof Appointments !== 'undefined' && Appointments._wizard) {
                    Appointments._wizard.step = 1;
                    Appointments._wizard.selectedPatientId = null;
                    Appointments._wizard.appointmentId = null;
                    Appointments._wizard.reschedule = false;
                }
            });
        }

        console.log('[App] MisTurnos listo.');
    },

    APP_VERSION: '2.1.1',

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').then((reg) => {
                console.log('[App] Service Worker registrado:', reg.scope);

                // Detectar actualizaciones
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    console.log('[App] Nueva versión encontrada...');

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateBanner();
                        }
                    });
                });

                // Check periódico cada 5 minutos
                setInterval(() => { reg.update(); }, 5 * 60 * 1000);
            }).catch((err) => console.warn('[App] Error al registrar SW:', err));
        }
    },

    showUpdateBanner() {
        if (document.getElementById('updateBanner')) return;

        const banner = document.createElement('div');
        banner.id = 'updateBanner';
        banner.style.cssText = 'position:fixed;bottom:20px;left:20px;right:20px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:16px 20px;z-index:9999;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:space-between;animation:slideUp 0.3s ease;';
        banner.innerHTML = `
            <span><i class="bi bi-arrow-up-circle-fill me-2"></i><strong>¡Nueva versión disponible!</strong></span>
            <button onclick="App.applyUpdate()" style="background:white;color:#4f46e5;border:none;padding:8px 20px;border-radius:8px;font-weight:700;cursor:pointer;white-space:nowrap;">
                Actualizar
            </button>`;
        document.body.appendChild(banner);
    },

    applyUpdate() {
        window.location.reload();
    },

    // ===================== SEGURIDAD =====================

    startSessionMonitor() {
        ['click', 'keydown', 'scroll', 'mousemove'].forEach((evt) => {
            document.addEventListener(evt, () => { App._lastActivity = Date.now(); }, { passive: true });
        });

        setInterval(() => {
            if (Auth.getUid() && (Date.now() - App._lastActivity > App._sessionTimeout)) {
                Auth.logout(true);
            }
        }, 60000);
    },

    sanitize(str) {
        if (typeof str !== 'string') return str;
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    escapeHtml(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    escapeAttr(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    async logActivity(action, details = '') {
        if (!Auth.getUid()) return;
        const { addDoc, collection } = window.firebaseExports;
        const db = window.firebaseDB;
        try {
            await addDoc(collection(db, 'activityLog'), {
                userId: Auth.getUid(),
                userEmail: Auth.getCurrentUser()?.email || '',
                action: action,
                details: details,
                timestamp: new Date().toISOString(),
                ip: 'client'
            });
        } catch (e) { /* silent */ }
    },

    _navHistory: [],

    navigate(page, options = {}) {
        const currentPage = this.getCurrentPage();
        if (currentPage && !options.isBack) {
            this._navHistory.push(currentPage);
        }

        document.querySelectorAll('.page-section').forEach((section) => {
            section.classList.add('d-none');
        });

        const target = document.getElementById('page-' + page);
        if (target) {
            target.classList.remove('d-none');
        }

        document.querySelectorAll('.nav-link[data-page]').forEach((link) => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });

        if (window.location.hash !== '#' + page) {
            history.pushState({ page: page }, '', '#' + page);
        }

        switch (page) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'patients':
                Patients.render();
                break;
            case 'appointments':
                Appointments.render();
                break;
            case 'profile':
                Profile.load();
                break;
            case 'admin':
                Admin.loadDashboard();
                break;
            case 'patient-detail':
                break;
        }

        const navCollapse = document.getElementById('navContent');
        const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
        if (bsCollapse) bsCollapse.hide();
    },

    getCurrentPage() {
        const hash = window.location.hash.replace('#', '');
        if (hash && document.getElementById('page-' + hash)) return hash;
        for (const section of document.querySelectorAll('.page-section')) {
            if (!section.classList.contains('d-none') && section.id !== 'page-login') {
                return section.id.replace('page-', '');
            }
        }
        return null;
    },

    goBack() {
        const prev = this._navHistory.pop();
        if (prev) {
            this.navigate(prev, { isBack: true });
        } else {
            this.navigate('dashboard');
        }
    },

    handleHashChange() {
        const hash = window.location.hash.replace('#', '');
        if (hash && document.getElementById('page-' + hash)) {
            this.navigate(hash, { isBack: true });
        }
    },

    async loadDashboard() {
        const user = Auth.getCurrentUser();
        if (!user) return;

        document.getElementById('dashboardName').textContent = (user.name || 'Profesional').split(' ')[0];

        const patients = await Patients.getAll();
        const appointments = await Appointments.getAll();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(today);
        endOfWeek.setDate(endOfWeek.getDate() + 7);

        const todayStr = this.formatDate(today);
        const todayAppts = appointments.filter((a) => a.date === todayStr && a.status !== 'cancelled');

        const weekAppts = appointments.filter((a) => {
            const d = new Date(a.date + 'T00:00:00');
            return d >= today && d < endOfWeek && a.status !== 'cancelled';
        });

        const pendingAppts = appointments.filter((a) => {
            const apptDate = new Date(a.date + 'T' + a.time);
            return (a.status === 'scheduled' || a.status === 'confirmed') && apptDate >= new Date();
        });

        document.getElementById('statToday').textContent = todayAppts.length;
        document.getElementById('statWeek').textContent = weekAppts.length;
        document.getElementById('statPending').textContent = pendingAppts.length;

        const container = document.getElementById('dashboardAppointments');
        if (todayAppts.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-calendar-check fs-1 d-block mb-2"></i>
                    ¡No tenés turnos hoy!
                </div>`;
        } else {
            todayAppts.sort((a, b) => a.time.localeCompare(b.time));
            container.innerHTML = todayAppts.map((appt) => {
                const patient = patients.find((p) => p.id === appt.patientId);
                const patientName = patient ? patient.name : 'Paciente eliminado';
                return `
                    <div class="list-group-item appointment-item status-${appt.status}">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="badge bg-primary">Hoy</span>
                                <span class="fw-bold ms-1">${appt.time}</span>
                                <span class="ms-2">${patientName}</span>
                            </div>
                            <span class="badge badge-status badge-${appt.status}">
                                ${Appointments.getStatusLabel(appt.status)}
                            </span>
                        </div>
                    </div>`;
            }).join('');
        }
    },

    toggleTheme() {
        const html = document.documentElement;
        const current = html.getAttribute('data-bs-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';

        html.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('misturnos_theme', newTheme);

        this.updateThemeIcon(newTheme);
    },

    loadTheme() {
        const saved = localStorage.getItem('misturnos_theme');
        let theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

        document.documentElement.setAttribute('data-bs-theme', theme);
        this.updateThemeIcon(theme);
    },

    updateThemeIcon(theme) {
        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
        }
    },

    async exportData() {
        try {
            const profile = {};
            const uid = Auth.getUid();
            if (uid) {
                const { doc, getDoc } = window.firebaseExports;
                const db = window.firebaseDB;
                const docSnap = await getDoc(doc(db, 'users', uid));
                if (docSnap.exists()) {
                    Object.assign(profile, docSnap.data());
                }
            }

            const patients = await Patients.getAll();
            const appointments = await Appointments.getAll();

            const data = {
                version: '2.0',
                exportDate: new Date().toISOString(),
                profile: profile,
                patients: patients,
                appointments: appointments
            };

            const jsonStr = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `misturnos_backup_${this.formatDate(new Date())}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showToast('Datos exportados correctamente', 'success');
        } catch (err) {
            console.error('[App] Export error:', err);
            this.showToast('Error al exportar datos', 'danger');
        }
    },

    async importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            this.showToast('El archivo debe ser un archivo .json', 'danger');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);

                if (!data.version || !data.patients || !data.appointments) {
                    throw new Error('Formato de archivo inválido');
                }

                if (!confirm(`Se importarán ${data.patients.length} pacientes y ${data.appointments.length} turnos.\n¿Estás seguro? Esto reemplazará tus datos actuales.`)) {
                    return;
                }

                const uid = Auth.getUid();
                if (!uid) {
                    this.showToast('No hay sesión activa', 'danger');
                    return;
                }

                const { doc, setDoc, addDoc, collection } = window.firebaseExports;
                const db = window.firebaseDB;

                if (data.profile) {
                    await setDoc(doc(db, 'users', uid), data.profile, { merge: true });
                }

                for (const patient of data.patients) {
                    const { id, ...patientData } = patient;
                    await addDoc(collection(db, 'users', uid, 'patients'), patientData);
                }

                for (const appointment of data.appointments) {
                    const { id, ...appointmentData } = appointment;
                    await addDoc(collection(db, 'users', uid, 'appointments'), appointmentData);
                }

                this.showToast('Datos importados correctamente. Recargando...', 'success');
                setTimeout(() => location.reload(), 1500);

            } catch (err) {
                console.error('[App] Error al importar:', err);
                this.showToast('Error al leer el archivo. Verificá que sea un backup válido.', 'danger');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    },

    async sendReminders() {
        const user = Auth.getCurrentUser();
        if (!user) return;

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = this.formatDate(tomorrow);

        const appointments = (await Appointments.getAll()).filter((a) => {
            return a.date === tomorrowStr && (a.status === 'scheduled' || a.status === 'confirmed');
        });

        if (appointments.length === 0) {
            this.showToast('No hay turnos programados para mañana', 'info');
            return;
        }

        const patients = await Patients.getAll();
        let sentCount = 0;

        appointments.forEach((appt) => {
            const patient = patients.find((p) => p.id === appt.patientId);
            if (!patient || !patient.phone) return;

            const phone = patient.phone.replace(/[\s\-\(\)\+]/g, '');

            const message = encodeURIComponent(
                `Hola ${patient.name}, le recordamos que tiene un turno el día ${this.formatDateHuman(appt.date)} a las ${appt.time} con ${user.name}.\n\n` +
                `Si necesita reprogramar, por favor comuníquese con anticipación.\n\n` +
                `¡Lo esperamos!`
            );

            window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
            sentCount++;
        });

        this.showToast(`Abriendo WhatsApp para ${sentCount} recordatorio(s)...`, 'success');
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    },

    formatDateHuman(dateStr) {
        const months = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];
        const [y, m, d] = dateStr.split('-');
        return `${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y}`;
    },

    formatDateShort(dateStr) {
        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const [y, m, d] = dateStr.split('-');
        return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
    },

    getDayOfWeek(dateStr) {
        const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const date = new Date(dateStr + 'T12:00:00');
        return days[date.getDay()];
    },

    setDefaultDates() {
        const today = this.formatDate(new Date());
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const dateFrom = document.getElementById('apptDateFrom');
        const dateTo = document.getElementById('apptDateTo');
        if (dateFrom) dateFrom.value = today;
        if (dateTo) dateTo.value = this.formatDate(nextMonth);
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');

        const icons = {
            success: 'bi-check-circle-fill',
            danger: 'bi-exclamation-circle-fill',
            warning: 'bi-exclamation-triangle-fill',
            info: 'bi-info-circle-fill'
        };

        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center text-bg-${type} border-0`;
        toastEl.setAttribute('role', 'alert');
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi ${icons[type] || icons.info} me-2"></i>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>`;

        container.appendChild(toastEl);

        const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
        toast.show();

        toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    },

    openWhatsApp(phone, message = '') {
        const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
        const encodedMsg = encodeURIComponent(message);
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank');
    },

    showSkeleton(container, type = 'cards') {
        if (!container) return;
        let html = '';

        if (type === 'cards') {
            for (let i = 0; i < 6; i++) {
                html += `
                    <div class="col-sm-6 col-lg-4 col-xl-3">
                        <div class="skeleton skeleton-card"></div>
                    </div>`;
            }
        } else if (type === 'list') {
            for (let i = 0; i < 5; i++) {
                html += `
                    <div class="skeleton-list-item">
                        <div class="skeleton skeleton-avatar"></div>
                        <div class="flex-grow-1">
                            <div class="skeleton skeleton-line skeleton-line-medium"></div>
                            <div class="skeleton skeleton-line skeleton-line-short"></div>
                        </div>
                        <div class="skeleton skeleton-badge"></div>
                    </div>`;
            }
        } else if (type === 'stats') {
            html = '<div class="row g-3">';
            for (let i = 0; i < 3; i++) {
                html += `
                    <div class="col-6 col-lg-4">
                        <div class="skeleton skeleton-card"></div>
                    </div>`;
            }
            html += '</div>';
        }

        container.innerHTML = html;
    },

    hideSkeleton() {
        return;
    },

    confirmAction(message, options = {}) {
        const confirmText = options.confirmText || 'Confirmar';
        const confirmColor = options.confirmColor || 'danger';
        const iconClass = options.iconClass || 'bi-exclamation-triangle';
        const iconBg = options.iconBg || 'bg-danger bg-opacity-10 text-danger';
        const title = options.title || '¿Estás seguro?';

        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'confirm-modal-overlay';
            overlay.innerHTML = `
                <div class="confirm-modal-card">
                    <div class="confirm-modal-icon ${iconBg}">
                        <i class="bi ${iconClass}"></i>
                    </div>
                    <div class="confirm-modal-title">${title}</div>
                    <div class="confirm-modal-message">${message}</div>
                    <div class="confirm-modal-actions">
                        <button class="btn btn-secondary" data-confirm="false">Cancelar</button>
                        <button class="btn btn-${confirmColor}" data-confirm="true">${confirmText}</button>
                    </div>
                </div>`;

            document.body.appendChild(overlay);

            overlay.querySelectorAll('[data-confirm]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    overlay.remove();
                    resolve(btn.getAttribute('data-confirm') === 'true');
                });
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                    resolve(false);
                }
            });
        });
    },

    checkOnboarding() {
        const user = Auth.getCurrentUser();
        if (!user) return;

        const uid = Auth.getUid();
        if (!uid) return;

        if (localStorage.getItem('misturnos_onboarded_' + uid)) return;

        const { doc, getDoc } = window.firebaseExports;
        const db = window.firebaseDB;

        getDoc(doc(db, 'users', uid)).then((docSnap) => {
            if (docSnap.exists() && docSnap.data().onboardingDone) {
                localStorage.setItem('misturnos_onboarded_' + uid, '1');
                return;
            }
            this.showOnboarding();
        });
    },

    _onboardingStep: 0,

    showOnboarding() {
        this._onboardingStep = 0;
        this.renderOnboardingStep();
    },

    renderOnboardingStep() {
        const steps = [
            {
                icon: 'bi-calendar-check',
                title: 'Bienvenido a MisTurnos',
                text: 'Tu app para gestionar turnos de forma simple y rápida. Te vamos a mostrar cómo funciona.'
            },
            {
                icon: 'bi-people',
                title: 'Gestioná tus Pacientes',
                text: 'Creá fichas con datos de contacto e información del paciente. Todo centralizado.'
            },
            {
                icon: 'bi-calendar-event',
                title: 'Organizá tu Agenda',
                text: 'Creá turnos, confirmalos, reprogramalos. Recibí notificaciones y enviá recordatorios por WhatsApp.'
            },
            {
                icon: 'bi-rocket-takeoff',
                title: '¡Listo para empezar!',
                text: 'Ya podés comenzar a usar MisTurnos. Creá tu primer paciente o turno desde el panel principal.'
            }
        ];

        const step = steps[this._onboardingStep];
        const isLast = this._onboardingStep === steps.length - 1;

        let overlay = document.getElementById('onboardingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'onboardingOverlay';
            overlay.className = 'onboarding-overlay';
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div class="onboarding-card">
                <div class="onboarding-step-icon">
                    <i class="bi ${step.icon}"></i>
                </div>
                <div class="onboarding-title">${step.title}</div>
                <div class="onboarding-text">${step.text}</div>
                <div class="onboarding-dots">
                    ${steps.map((_, i) => `<div class="onboarding-dot ${i === this._onboardingStep ? 'active' : ''}"></div>`).join('')}
                </div>
                <div class="onboarding-actions">
                    <button class="btn btn-outline-secondary" onclick="App.skipOnboarding()">Saltar</button>
                    <button class="btn btn-primary" onclick="App.nextOnboardingStep()">
                        ${isLast ? '¡Empezar!' : 'Siguiente'}
                    </button>
                </div>
            </div>`;
    },

    nextOnboardingStep() {
        this._onboardingStep++;
        if (this._onboardingStep >= 4) {
            this.completeOnboarding();
        } else {
            this.renderOnboardingStep();
        }
    },

    skipOnboarding() {
        this.completeOnboarding();
    },

    completeOnboarding() {
        const overlay = document.getElementById('onboardingOverlay');
        if (overlay) overlay.remove();

        const uid = Auth.getUid();
        if (uid) {
            localStorage.setItem('misturnos_onboarded_' + uid, '1');

            const { doc, setDoc } = window.firebaseExports;
            const db = window.firebaseDB;
            setDoc(doc(db, 'users', uid), { onboardingDone: true }, { merge: true });
        }
    },

    showReportErrorModal() {
        document.getElementById('modalTitle').textContent = 'Reportar Error';

        document.getElementById('modalBody').innerHTML = `
            <div class="mb-3">
                <label class="form-label fw-semibold">¿Qué salió mal?</label>
                <textarea class="form-control" id="reportErrorDesc" rows="4" placeholder="Describí el error que encontraste..."></textarea>
            </div>
            <div class="mb-3">
                <label class="form-label fw-semibold">¿Qué esperabas que pasara?</label>
                <input type="text" class="form-control" id="reportErrorExpected" placeholder="Opcional">
            </div>
            <div class="form-check mb-3">
                <input class="form-check-input" type="checkbox" id="reportErrorIncludeUrl" checked>
                <label class="form-check-label" for="reportErrorIncludeUrl">
                    Incluir URL de la página
                </label>
            </div>`;

        document.getElementById('modalFooter').innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-danger" onclick="App.submitErrorReport()">
                <i class="bi bi-send me-1"></i>Enviar Reporte
            </button>`;

        const modal = new bootstrap.Modal(document.getElementById('appModal'));
        modal.show();
    },

    _lastErrorReport: 0,

    handlePaymentCallback() {
        const params = new URLSearchParams(window.location.search);
        const status = params.get('status');
        const collectionStatus = params.get('collection_status');
        const planId = params.get('plan_id');
        const userId = params.get('user_id');

        if (status === 'approved' || collectionStatus === 'approved') {
            if (planId && userId) {
                Billing.handlePaymentSuccess(planId, userId).then(() => {
                    this.showToast('¡Pago aprobado! Tu plan ha sido activado.', 'success');
                    window.history.replaceState({}, '', window.location.pathname);
                    setTimeout(() => this.navigate('dashboard'), 1500);
                });
            } else {
                this.showToast('¡Pago aprobado! Recargá la página para ver los cambios.', 'success');
                window.history.replaceState({}, '', window.location.pathname);
            }
        } else if (status === 'failure' || collectionStatus === 'failure') {
            this.showToast('El pago no pudo procesarse. Intentá de nuevo.', 'warning');
            window.history.replaceState({}, '', window.location.pathname);
        } else if (status === 'pending' || collectionStatus === 'pending') {
            this.showToast('Tu pago está siendo procesado. Te notificaremos cuando se acredite.', 'info');
            window.history.replaceState({}, '', window.location.pathname);
        }
    },

    async submitErrorReport() {
        const desc = document.getElementById('reportErrorDesc').value.trim();
        const expected = document.getElementById('reportErrorExpected').value.trim();
        const includeUrl = document.getElementById('reportErrorIncludeUrl').checked;

        if (!desc) {
            this.showToast('Describí el error', 'warning');
            return;
        }

        if (Date.now() - this._lastErrorReport < 60000) {
            this.showToast('Esperá un minuto antes de enviar otro reporte', 'warning');
            return;
        }

        const user = Auth.getCurrentUser();
        const { addDoc, collection } = window.firebaseExports;
        const db = window.firebaseDB;

        try {
            await addDoc(collection(db, 'errors'), {
                type: 'user_report',
                message: this.sanitize(desc),
                expected: this.sanitize(expected || ''),
                url: includeUrl ? window.location.href : '',
                userEmail: user ? user.email : '',
                userId: Auth.getUid() || '',
                userAgent: navigator.userAgent,
                createdAt: new Date().toISOString()
            });

            this._lastErrorReport = Date.now();
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            this.showToast('Reporte enviado. ¡Gracias!', 'success');
        } catch (err) {
            console.error('[App] Error submitting report:', err);
            this.showToast('Error al enviar el reporte', 'danger');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (typeof I18n !== 'undefined') I18n.init();
    App.init();
});
