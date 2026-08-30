// @ts-nocheck
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
            'profile.medicalConfig': 'Configuración Médica',
            'profile.needsMedical': 'Mi actividad requiere datos médicos de pacientes (alergias, medicación, cardiopatía, etc.)',
            'profile.needsMedicalHint': 'Si activás esta opción, al crear pacientes se mostrarán campos para información médica.',

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
            'admin.activity': 'Actividad',
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
            'footer.contact': 'Contacto',

            // Landing
            'nav.login': 'Iniciar sesión',
            'hero.badge': 'Para profesionales que dan turnos',
            'hero.title1': 'Tu agenda,',
            'hero.title2': 'sin complicaciones.',
            'hero.subtitle': 'Organizá pacientes, turnos y recordatorios en un solo lugar. Dejá de perder tiempo con libretas y planes de Google.',
            'hero.cta': 'Empezá gratis',
            'hero.how': '¿Cómo funciona?',
            'hero.trial': 'Prueba gratuita de 30 días. Sin tarjeta de crédito.',
            'steps.title': 'En 3 pasos',
            'steps.subtitle': 'No necesitás ser experto en tecnología.',
            'steps.s1.title': 'Cargá tus pacientes',
            'steps.s1.desc': 'Nombre, teléfono, email, datos de contacto — todo en un lugar solo.',
            'steps.s2.title': 'Agendá turnos',
            'steps.s2.desc': 'Elegí fecha, hora y motivo. Listo. El turno queda registrado.',
            'steps.s3.title': 'Mandá WhatsApp',
            'steps.s3.desc': 'Confirmación, recordatorio o reprogramación — con un toque.',
            'features.title': 'Todo lo que necesitás.',
            'features.subtitle': 'Nada que no necesitás.',
            'features.f1.title': 'Pacientes',
            'features.f1.desc': 'Ficha completa: datos de contacto, motivo de consulta, observaciones.',
            'features.f2.title': 'Turnos',
            'features.f2.desc': 'Cargá, modifiqué o cancelá turnos en segundos.',
            'features.f3.desc': 'Mensajes prearmados para confirmar, recordar o reprogramar.',
            'features.f5.title': 'Celular y PC',
            'features.f5.desc': 'Funciona en cualquier dispositivo. No necesitás instalar nada.',
            'features.f6.title': 'Seguro',
            'features.f6.desc': 'Tus datos se guardan en la nube. Nadie más los ve.',
            'pricing.title': 'Planes simples.',
            'pricing.subtitle': 'Sin sorpresas. Sin permanencia.',
            'pricing.popular': 'Más elegido',
            'pricing.cta': 'Empezar',
            'pricing.b1': '1 usuario',
            'pricing.b2': 'Hasta 25 pacientes',
            'pricing.b3': 'Turnos ilimitados',
            'pricing.b4': 'WhatsApp manual',
            'pricing.p1': 'Hasta 2 usuarios',
            'pricing.p2': 'Hasta 50 pacientes',
            'pricing.p4': 'Recordatorios automáticos',
            'pricing.p5': 'Estadísticas básicas',
            'pricing.c1': 'Hasta 3 usuarios',
            'pricing.c2': 'Pacientes ilimitados',
            'pricing.c4': 'Agenda compartida',
            'pricing.c5': 'Soporte prioritario',
            'cta.title': '¿Listo para organizarte?',
            'cta.subtitle': 'Creá tu cuenta en 2 minutos. Sin tarjeta, sin compromiso.',

            // Common
            'common.loading': 'Cargando...',
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
            'profile.medicalConfig': 'Medical Settings',
            'profile.needsMedical': 'My practice requires patient medical data (allergies, medication, heart conditions, etc.)',
            'profile.needsMedicalHint': 'If enabled, medical information fields will appear when creating patients.',

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
            'footer.contact': 'Contact',

            // Landing
            'nav.login': 'Log in',
            'hero.badge': 'For professionals who schedule appointments',
            'hero.title1': 'Your schedule,',
            'hero.title2': 'without complications.',
            'hero.subtitle': 'Organize patients, appointments and reminders in one place. Stop wasting time with notebooks and Google Calendar.',
            'hero.cta': 'Start for free',
            'hero.how': 'How does it work?',
            'hero.trial': '30-day free trial. No credit card required.',
            'steps.title': 'In 3 steps',
            'steps.subtitle': "You don't need to be a tech expert.",
            'steps.s1.title': 'Add your patients',
            'steps.s1.desc': 'Name, phone, email, contact info — all in one place.',
            'steps.s2.title': 'Schedule appointments',
            'steps.s2.desc': 'Choose date, time and reason. Done. The appointment is recorded.',
            'steps.s3.title': 'Send WhatsApp',
            'steps.s3.desc': 'Confirmation, reminder or reschedule — with one tap.',
            'features.title': 'Everything you need.',
            'features.subtitle': 'Nothing you don\'t.',
            'features.f1.title': 'Patients',
            'features.f1.desc': 'Complete profile: contact info, appointment reason, notes.',
            'features.f2.title': 'Appointments',
            'features.f2.desc': 'Create, edit or cancel appointments in seconds.',
            'features.f3.desc': 'Pre-built messages to confirm, remind or reschedule.',
            'features.f5.title': 'Mobile & Desktop',
            'features.f5.desc': 'Works on any device. No installation needed.',
            'features.f6.title': 'Secure',
            'features.f6.desc': 'Your data is stored in the cloud. No one else sees it.',
            'pricing.title': 'Simple plans.',
            'pricing.subtitle': 'No surprises. No lock-in.',
            'pricing.popular': 'Most popular',
            'pricing.cta': 'Get started',
            'pricing.b1': '1 user',
            'pricing.b2': 'Up to 25 patients',
            'pricing.b3': 'Unlimited appointments',
            'pricing.b4': 'Manual WhatsApp',
            'pricing.p1': 'Up to 2 users',
            'pricing.p2': 'Up to 50 patients',
            'pricing.p4': 'Automatic reminders',
            'pricing.p5': 'Basic statistics',
            'pricing.c1': 'Up to 3 users',
            'pricing.c2': 'Unlimited patients',
            'pricing.c4': 'Shared schedule',
            'pricing.c5': 'Priority support',
            'cta.title': 'Ready to get organized?',
            'cta.subtitle': 'Create your account in 2 minutes. No card, no commitment.',

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
