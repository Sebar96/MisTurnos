/*
 * MisTurnos - © 2026 Sebastián Russo
 * Todos los derechos reservados.
 *
 * I18N.JS - Sistema de internacionalización (ES/EN)
 */

const I18n = {

    currentLang: 'es',

    translations: {
        es: {
            // Navbar
            'nav.home': 'Inicio',
            'nav.patients': 'Pacientes',
            'nav.appointments': 'Turnos',
            'nav.profile': 'Perfil',
            'nav.admin': 'Admin',
            'nav.myProfile': 'Mi Perfil',
            'nav.myPlan': 'Mi Plan',
            'nav.export': 'Exportar Datos',
            'nav.import': 'Importar Datos',
            'nav.reportErrors': 'Reportar Errores',
            'nav.logout': 'Cerrar Sesión',

            // Login
            'login.subtitle': 'Gestión de turnos para profesionales',
            'login.login': 'Iniciar Sesión',
            'login.register': 'Registrarse',
            'login.email': 'Email',
            'login.password': 'Contraseña',
            'login.loginBtn': 'Ingresar',
            'login.google': 'Continuar con Google',
            'login.fullName': 'Nombre completo',
            'login.specialty': 'Especialidad',
            'login.confirmPassword': 'Confirmar contraseña',
            'login.createAccount': 'Crear Cuenta',
            'login.termsNote': 'Al registrarte aceptás nuestros <a href="terms.html" class="text-decoration-none">Términos y Condiciones</a> y <a href="privacy.html" class="text-decoration-none">Política de Privacidad</a>.',

            // Dashboard
            'dash.greeting': 'Hola,',
            'dash.professional': 'Profesional',
            'dash.summary': 'Resumen de tu agenda para hoy',
            'dash.today': 'Turnos Hoy',
            'dash.week': 'Esta Semana',
            'dash.pending': 'Pendientes',
            'dash.upcoming': 'Próximos Turnos',
            'dash.viewAll': 'Ver todos',
            'dash.noAppointments': 'No hay turnos programados',
            'dash.quickActions': 'Acciones Rápidas',
            'dash.newAppointment': 'Nuevo Turno',
            'dash.newPatient': 'Nuevo Paciente',
            'dash.sendReminders': 'Enviar Recordatorios',

            // Patients
            'patients.title': 'Pacientes',
            'patients.subtitle': 'Gestioná tu cartera de pacientes',
            'patients.search': 'Buscar por nombre, teléfono, email...',
            'patients.allStatuses': 'Todos los estados',
            'patients.active': 'Activos',
            'patients.inactive': 'Inactivos',
            'patients.allInsurance': 'Todas las obras sociales',
            'patients.empty': 'No hay pacientes registrados',

            // Patient Detail
            'patientDetail.back': 'Volver a Pacientes',
            'patientDetail.loading': 'Cargando...',

            // Appointments
            'appointments.title': 'Turnos',
            'appointments.subtitle': 'Administrá tu agenda',
            'appointments.dateFrom': 'Fecha desde',
            'appointments.dateTo': 'Fecha hasta',
            'appointments.status': 'Estado',
            'appointments.all': 'Todos',
            'appointments.scheduled': 'Programado',
            'appointments.confirmed': 'Confirmado',
            'appointments.completed': 'Realizado',
            'appointments.cancelled': 'Cancelado',
            'appointments.patient': 'Paciente',
            'appointments.searchPatient': 'Buscar paciente...',
            'appointments.empty': 'No hay turnos en este período',

            // Profile
            'profile.title': 'Mi Perfil',
            'profile.changePlan': 'Cambiar plan',
            'profile.personalData': 'Datos Personales',
            'profile.fullName': 'Nombre completo',
            'profile.specialty': 'Especialidad',
            'profile.email': 'Email',
            'profile.phone': 'Teléfono',
            'profile.office': 'Consultorio',
            'profile.address': 'Dirección del consultorio',
            'profile.mapUrl': 'Ubicación en mapa (link de Google Maps)',
            'profile.socialMedia': 'Redes Sociales',
            'profile.save': 'Guardar Perfil',

            // Admin
            'admin.title': 'Panel de Administración',
            'admin.professionals': 'Profesionales',
            'admin.todayAppts': 'Turnos Hoy (todos)',
            'admin.totalPatients': 'Pacientes Totales',
            'admin.errors24h': 'Errores (24h)',
            'admin.recent': 'Reciente',
            'admin.users': 'Usuarios',
            'admin.errors': 'Errores',
            'admin.controls': 'Controles',
            'admin.latestUsers': 'Últimos Profesionales Registrados',
            'admin.recentErrors': 'Errores Recientes',
            'admin.systemStatus': 'Estado del Sistema',
            'admin.lastCheck': 'Última verificación',
            'admin.runChecks': 'Ejecutar controles',
            'admin.systemHealth': 'Salud del Sistema',
            'admin.planDistribution': 'Distribución de Planes',
            'admin.checkHistory': 'Historial de Controles',

            // Footer
            'footer.terms': 'Términos',
            'footer.privacy': 'Privacidad',

            // Common
            'common.loading': 'Cargando...',
            'common.cancel': 'Cancelar',
            'common.save': 'Guardar',
            'common.delete': 'Eliminar',
            'common.edit': 'Editar',
            'common.close': 'Cerrar'
        },

        en: {
            // Navbar
            'nav.home': 'Home',
            'nav.patients': 'Patients',
            'nav.appointments': 'Appointments',
            'nav.profile': 'Profile',
            'nav.admin': 'Admin',
            'nav.myProfile': 'My Profile',
            'nav.myPlan': 'My Plan',
            'nav.export': 'Export Data',
            'nav.import': 'Import Data',
            'nav.reportErrors': 'Report Errors',
            'nav.logout': 'Log Out',

            // Login
            'login.subtitle': 'Appointment management for professionals',
            'login.login': 'Log In',
            'login.register': 'Sign Up',
            'login.email': 'Email',
            'login.password': 'Password',
            'login.loginBtn': 'Log In',
            'login.google': 'Continue with Google',
            'login.fullName': 'Full name',
            'login.specialty': 'Specialty',
            'login.confirmPassword': 'Confirm password',
            'login.createAccount': 'Create Account',
            'login.termsNote': 'By registering you accept our <a href="terms.html" class="text-decoration-none">Terms and Conditions</a> and <a href="privacy.html" class="text-decoration-none">Privacy Policy</a>.',

            // Dashboard
            'dash.greeting': 'Hello,',
            'dash.professional': 'Professional',
            'dash.summary': "Today's schedule summary",
            'dash.today': "Today's Appointments",
            'dash.week': 'This Week',
            'dash.pending': 'Pending',
            'dash.upcoming': 'Upcoming Appointments',
            'dash.viewAll': 'View all',
            'dash.noAppointments': 'No appointments scheduled',
            'dash.quickActions': 'Quick Actions',
            'dash.newAppointment': 'New Appointment',
            'dash.newPatient': 'New Patient',
            'dash.sendReminders': 'Send Reminders',

            // Patients
            'patients.title': 'Patients',
            'patients.subtitle': 'Manage your patient roster',
            'patients.search': 'Search by name, phone, email...',
            'patients.allStatuses': 'All statuses',
            'patients.active': 'Active',
            'patients.inactive': 'Inactive',
            'patients.allInsurance': 'All insurance providers',
            'patients.empty': 'No patients registered',

            // Patient Detail
            'patientDetail.back': 'Back to Patients',
            'patientDetail.loading': 'Loading...',

            // Appointments
            'appointments.title': 'Appointments',
            'appointments.subtitle': 'Manage your schedule',
            'appointments.dateFrom': 'Date from',
            'appointments.dateTo': 'Date to',
            'appointments.status': 'Status',
            'appointments.all': 'All',
            'appointments.scheduled': 'Scheduled',
            'appointments.confirmed': 'Confirmed',
            'appointments.completed': 'Completed',
            'appointments.cancelled': 'Cancelled',
            'appointments.patient': 'Patient',
            'appointments.searchPatient': 'Search patient...',
            'appointments.empty': 'No appointments in this period',

            // Profile
            'profile.title': 'My Profile',
            'profile.changePlan': 'Change plan',
            'profile.personalData': 'Personal Data',
            'profile.fullName': 'Full name',
            'profile.specialty': 'Specialty',
            'profile.email': 'Email',
            'profile.phone': 'Phone',
            'profile.office': 'Office',
            'profile.address': 'Office address',
            'profile.mapUrl': 'Map location (Google Maps link)',
            'profile.socialMedia': 'Social Media',
            'profile.save': 'Save Profile',

            // Admin
            'admin.title': 'Admin Panel',
            'admin.professionals': 'Professionals',
            'admin.todayAppts': "Today's Appointments (all)",
            'admin.totalPatients': 'Total Patients',
            'admin.errors24h': 'Errors (24h)',
            'admin.recent': 'Recent',
            'admin.users': 'Users',
            'admin.errors': 'Errors',
            'admin.controls': 'Controls',
            'admin.latestUsers': 'Latest Registered Professionals',
            'admin.recentErrors': 'Recent Errors',
            'admin.systemStatus': 'System Status',
            'admin.lastCheck': 'Last check',
            'admin.runChecks': 'Run checks',
            'admin.systemHealth': 'System Health',
            'admin.planDistribution': 'Plan Distribution',
            'admin.checkHistory': 'Check History',

            // Footer
            'footer.terms': 'Terms',
            'footer.privacy': 'Privacy',

            // Common
            'common.loading': 'Loading...',
            'common.cancel': 'Cancel',
            'common.save': 'Save',
            'common.delete': 'Delete',
            'common.edit': 'Edit',
            'common.close': 'Close'
        }
    },

    t(key) {
        return this.translations[this.currentLang][key] || this.translations['es'][key] || key;
    },

    init() {
        const saved = localStorage.getItem('lang');
        if (saved && this.translations[saved]) {
            this.currentLang = saved;
        }
        this.apply();
    },

    setLang(lang) {
        if (!this.translations[lang]) return;
        this.currentLang = lang;
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;
        this.apply();
    },

    toggle() {
        this.setLang(this.currentLang === 'es' ? 'en' : 'es');
    },

    apply() {
        document.querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.getAttribute('data-i18n');
            const text = this.t(key);
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if (el.hasAttribute('placeholder')) {
                    el.setAttribute('placeholder', text);
                }
            } else {
                el.innerHTML = text;
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.setAttribute('placeholder', this.t(key));
        });

        this.updateSelector();
    },

    updateSelector() {
        const btn = document.getElementById('langToggle');
        if (btn) {
            btn.innerHTML = this.currentLang === 'es' ? 'EN' : 'ES';
            btn.title = this.currentLang === 'es' ? 'Switch to English' : 'Cambiar a Español';
        }
    }
};
