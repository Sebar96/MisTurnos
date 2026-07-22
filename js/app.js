/*
 * ============================================================
 * APP.JS - LÓGICA PRINCIPAL DE MisTurnos
 * ============================================================
 * Este archivo es el "cerebro" de la aplicación. Se encarga de:
 * 1. Inicializar la app cuando carga la página
 * 2. Registrar el Service Worker (para PWA/offline)
 * 3. Navegar entre secciones (show/hide de páginas)
 * 4. Manejar el modo oscuro/claro
 * 5. Exportar e importar datos
 * 6. Enviar recordatorios por WhatsApp
 * 7. Utilidades generales (fechas, IDs, toasts, etc.)
 * ============================================================
 */

/*
 * Objeto principal App.
 * Usamos un solo objeto para organizar toda la lógica.
 * Cada función está agrupada por categoría.
 */
const App = {

    // ============================================================
    // INICIALIZACIÓN
    // ============================================================

    /**
     * init() - Se ejecuta cuando el DOM está listo.
     * Es el punto de entrada de toda la aplicación.
     */
    init() {
        console.log('[App] Inicializando MisTurnos...');

        // 1. Registrar el Service Worker para PWA
        this.registerServiceWorker();

        // 2. Cargar el tema (oscuro/claro) guardado
        this.loadTheme();

        // 3. Verificar si el usuario está logueado
        Auth.checkSession();

        // 4. Preparar fechas por defecto en los filtros de turnos
        this.setDefaultDates();

        // 5. Resetear el wizard de turnos al cerrar el modal
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

    /**
     * registerServiceWorker()
     * Le dice al navegador que registre nuestro sw.js.
     * Solo funciona si el sitio se sirve por HTTPS o localhost.
     */
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then((reg) => console.log('[App] Service Worker registrado:', reg.scope))
                .catch((err) => console.warn('[App] Error al registrar SW:', err));
        }
    },

    // ============================================================
    // NAVEGACIÓN
    // ============================================================

    /**
     * navigate(page)
     * Muestra una sección y oculta las demás.
     * También actualiza el navbar activo.
     *
     * @param {string} page - Nombre de la página (ej: 'dashboard', 'patients')
     */
    navigate(page) {
        // Ocultar todas las secciones
        document.querySelectorAll('.page-section').forEach((section) => {
            section.classList.add('d-none');
        });

        // Mostrar la sección solicitada
        const target = document.getElementById('page-' + page);
        if (target) {
            target.classList.remove('d-none');
        }

        // Actualizar el link activo en el navbar
        document.querySelectorAll('.nav-link[data-page]').forEach((link) => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });

        // Cargar los datos de la sección
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
        }

        // Cerrar el menú hamburguesa en móvil (si está abierto)
        const navCollapse = document.getElementById('navContent');
        const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
        if (bsCollapse) bsCollapse.hide();
    },

    /**
     * loadDashboard()
     * Carga los datos del panel principal: estadísticas y próximos turnos.
     */
    loadDashboard() {
        // Obtener el usuario actual logueado
        const user = Auth.getCurrentUser();
        if (!user) return;

        // Mostrar el nombre en el saludo
        document.getElementById('dashboardName').textContent = user.name.split(' ')[0];

        // Calcular estadísticas
        const patients = Patients.getAll();
        const appointments = Appointments.getAll();

        // Fecha de hoy y fin de semana
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(today);
        endOfWeek.setDate(endOfWeek.getDate() + 7);

        // Filtrar turnos de hoy
        const todayStr = this.formatDate(today);
        const todayAppts = appointments.filter((a) => a.date === todayStr && a.status !== 'cancelled');

        // Filtrar turnos de esta semana
        const weekAppts = appointments.filter((a) => {
            const d = new Date(a.date + 'T00:00:00');
            return d >= today && d < endOfWeek && a.status !== 'cancelled';
        });

        // Turnos pendientes (programados o confirmados en el futuro)
        const pendingAppts = appointments.filter((a) => {
            return (a.status === 'scheduled' || a.status === 'confirmed');
        });

        // Actualizar las tarjetas de estadísticas
        document.getElementById('statToday').textContent = todayAppts.length;
        document.getElementById('statWeek').textContent = weekAppts.length;
        document.getElementById('statPatients').textContent = patients.length;
        document.getElementById('statPending').textContent = pendingAppts.length;

        // Renderizar la lista de turnos de la semana en el dashboard
        const container = document.getElementById('dashboardAppointments');
        if (weekAppts.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-calendar-check fs-1 d-block mb-2"></i>
                    ¡No tenés turnos esta semana!
                </div>`;
        } else {
            // Ordenar por fecha y hora
            weekAppts.sort((a, b) => {
                const dateCompare = a.date.localeCompare(b.date);
                if (dateCompare !== 0) return dateCompare;
                return a.time.localeCompare(b.time);
            });
            container.innerHTML = weekAppts.map((appt) => {
                const patient = patients.find((p) => p.id === appt.patientId);
                const patientName = patient ? patient.name : 'Paciente eliminado';
                const isToday = appt.date === todayStr;
                const dayLabel = isToday ? 'Hoy' : this.formatDateShort(appt.date);
                return `
                    <div class="list-group-item appointment-item status-${appt.status}">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="badge ${isToday ? 'bg-primary' : 'bg-secondary'}">${dayLabel}</span>
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

    // ============================================================
    // MODO OSCURO / CLARO
    // ============================================================

    /**
     * toggleTheme()
     * Alterna entre modo oscuro y claro.
     * Guarda la preferencia en localStorage.
     */
    toggleTheme() {
        const html = document.documentElement;
        const current = html.getAttribute('data-bs-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';

        html.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('misturnos_theme', newTheme);

        // Actualizar el icono del botón
        this.updateThemeIcon(newTheme);
    },

    /**
     * loadTheme()
     * Carga el tema guardado al iniciar la app.
     * Si no hay preferencia, usa el del sistema operativo.
     */
    loadTheme() {
        const saved = localStorage.getItem('misturnos_theme');
        let theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

        document.documentElement.setAttribute('data-bs-theme', theme);
        this.updateThemeIcon(theme);
    },

    /**
     * updateThemeIcon(theme)
     * Cambia el icono del botón de tema según el tema actual.
     */
    updateThemeIcon(theme) {
        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
        }
    },

    // ============================================================
    // EXPORTAR / IMPORTAR DATOS
    // ============================================================

    /**
     * exportData()
     * Recopila TODOS los datos de la app (perfil, pacientes, turnos)
     * y los descarga como un archivo .json que el usuario puede guardar.
     */
    exportData() {
        // Recopilar todos los datos de localStorage
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            user: JSON.parse(localStorage.getItem('misturnos_user') || 'null'),
            profile: JSON.parse(localStorage.getItem('misturnos_profile') || 'null'),
            patients: JSON.parse(localStorage.getItem('misturnos_patients') || '[]'),
            appointments: JSON.parse(localStorage.getItem('misturnos_appointments') || '[]')
        };

        // Convertir a texto JSON
        const jsonStr = JSON.stringify(data, null, 2);

        // Crear un "blob" (objeto binario) con los datos
        const blob = new Blob([jsonStr], { type: 'application/json' });

        // Crear un link temporal y hacer click para descargar
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `misturnos_backup_${this.formatDate(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Datos exportados correctamente', 'success');
    },

    /**
     * importData(event)
     * Lee un archivo .json que el usuario selecciona y carga los datos.
     */
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Verificar que sea un archivo .json
        if (!file.name.endsWith('.json')) {
            this.showToast('El archivo debe ser un archivo .json', 'danger');
            return;
        }

        // Leer el archivo
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Verificar que tenga la estructura correcta
                if (!data.version || !data.patients || !data.appointments) {
                    throw new Error('Formato de archivo inválido');
                }

                // Pedir confirmación antes de sobreescribir
                if (!confirm(`Se importarán ${data.patients.length} pacientes y ${data.appointments.length} turnos.\n¿Estás seguro? Esto reemplazará tus datos actuales.`)) {
                    return;
                }

                // Guardar cada sección en localStorage
                if (data.user) localStorage.setItem('misturnos_user', JSON.stringify(data.user));
                if (data.profile) localStorage.setItem('misturnos_profile', JSON.stringify(data.profile));
                localStorage.setItem('misturnos_patients', JSON.stringify(data.patients));
                localStorage.setItem('misturnos_appointments', JSON.stringify(data.appointments));

                this.showToast('Datos importados correctamente. Recargando...', 'success');

                // Recargar después de 1.5 segundos
                setTimeout(() => location.reload(), 1500);

            } catch (err) {
                console.error('[App] Error al importar:', err);
                this.showToast('Error al leer el archivo. Verificá que sea un backup válido.', 'danger');
            }
        };
        reader.readAsText(file);

        // Limpiar el input para poder seleccionar el mismo archivo otra vez
        event.target.value = '';
    },

    // ============================================================
    // RECORDATORIOS POR WHATSAPP
    // ============================================================

    /**
     * sendReminders()
     * Envía recordatorios por WhatsApp a pacientes con turnos mañana.
     * Genera un link de WhatsApp para cada paciente.
     */
    sendReminders() {
        const user = Auth.getCurrentUser();
        if (!user) return;

        // Calcular la fecha de mañana
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = this.formatDate(tomorrow);

        // Buscar turnos de mañana que estén programados o confirmados
        const appointments = Appointments.getAll().filter((a) => {
            return a.date === tomorrowStr && (a.status === 'scheduled' || a.status === 'confirmed');
        });

        if (appointments.length === 0) {
            this.showToast('No hay turnos programados para mañana', 'info');
            return;
        }

        const patients = Patients.getAll();
        let sentCount = 0;

        appointments.forEach((appt) => {
            const patient = patients.find((p) => p.id === appt.patientId);
            if (!patient || !patient.phone) return;

            // Limpiar el teléfono: quitar espacios, guiones, paréntesis
            const phone = patient.phone.replace(/[\s\-\(\)\+]/g, '');

            // Crear el mensaje del recordatorio
            const message = encodeURIComponent(
                `Hola ${patient.name}, le recordamos que tiene un turno el día ${this.formatDateHuman(appt.date)} a las ${appt.time} con ${user.name}.\n\n` +
                `Si necesita reprogramar, por favor comuníquese con anticipación.\n\n` +
                `¡Lo esperamos!`
            );

            // Abrir WhatsApp Web con el mensaje
            window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
            sentCount++;
        });

        this.showToast(`Abriendo WhatsApp para ${sentCount} recordatorio(s)...`, 'success');
    },

    // ============================================================
    // UTILIDADES (Funciones helper)
    // ============================================================

    /**
     * generateId()
     * Genera un ID único usando timestamp + número aleatorio.
     * Lo usamos para identificar pacientes, turnos, etc.
     *
     * @returns {string} Un ID único como "a1b2c3d4e5f6"
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    /**
     * formatDate(date)
     * Convierte un objeto Date a string "YYYY-MM-DD".
     * Necesario porque los inputs de tipo date usan este formato.
     *
     * @param {Date} date - Objeto fecha
     * @returns {string} "YYYY-MM-DD"
     */
    formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    },

    /**
     * formatDateHuman(dateStr)
     * Convierte "YYYY-MM-DD" a formato legible: "22 de julio de 2026"
     *
     * @param {string} dateStr - Fecha en formato "YYYY-MM-DD"
     * @returns {string} Fecha legible en español
     */
    formatDateHuman(dateStr) {
        const months = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];
        const [y, m, d] = dateStr.split('-');
        return `${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y}`;
    },

    /**
     * formatDateShort(dateStr)
     * Formato corto: "22 jul" (para las tarjetas de turnos).
     */
    formatDateShort(dateStr) {
        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const [y, m, d] = dateStr.split('-');
        return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
    },

    /**
     * getDayOfWeek(dateStr)
     * Devuelve el día de la semana en español.
     */
    getDayOfWeek(dateStr) {
        const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const date = new Date(dateStr + 'T12:00:00');
        return days[date.getDay()];
    },

    /**
     * setDefaultDates()
     * Pone la fecha de hoy como valor por defecto en los filtros de turnos.
     */
    setDefaultDates() {
        const today = this.formatDate(new Date());
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const dateFrom = document.getElementById('apptDateFrom');
        const dateTo = document.getElementById('apptDateTo');
        if (dateFrom) dateFrom.value = today;
        if (dateTo) dateTo.value = this.formatDate(nextMonth);
    },

    /**
     * showToast(message, type)
     * Muestra una notificación toast en la esquina inferior derecha.
     *
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo: 'success', 'danger', 'warning', 'info'
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');

        // Icono según el tipo
        const icons = {
            success: 'bi-check-circle-fill',
            danger: 'bi-exclamation-circle-fill',
            warning: 'bi-exclamation-triangle-fill',
            info: 'bi-info-circle-fill'
        };

        // Crear el elemento toast
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

        // Inicializar y mostrar el toast con Bootstrap
        const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
        toast.show();

        // Eliminar el elemento del DOM después de que se oculte
        toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    },

    /**
     * openWhatsApp(phone, message)
     * Abre WhatsApp con un mensaje predefinido.
     */
    openWhatsApp(phone, message = '') {
        const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
        const encodedMsg = encodeURIComponent(message);
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank');
    }
};

// ============================================================
// EVENTO: Cuando el DOM está completamente cargado
// Ejecutamos App.init() para arrancar la aplicación.
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
