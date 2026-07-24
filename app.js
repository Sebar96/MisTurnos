/*
 * APP.JS - LÓGICA PRINCIPAL DE MisTurnos
 */

const App = {

    init() {
        console.log('[App] Inicializando MisTurnos...');
        this.registerServiceWorker();
        this.loadTheme();
        Auth.checkSession();
        this.setDefaultDates();

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

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then((reg) => console.log('[App] Service Worker registrado:', reg.scope))
                .catch((err) => console.warn('[App] Error al registrar SW:', err));
        }
    },

    navigate(page) {
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

        const navCollapse = document.getElementById('navContent');
        const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
        if (bsCollapse) bsCollapse.hide();
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
            return (a.status === 'scheduled' || a.status === 'confirmed');
        });

        document.getElementById('statToday').textContent = todayAppts.length;
        document.getElementById('statWeek').textContent = weekAppts.length;
        document.getElementById('statPatients').textContent = patients.length;
        document.getElementById('statPending').textContent = pendingAppts.length;

        const container = document.getElementById('dashboardAppointments');
        if (weekAppts.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-calendar-check fs-1 d-block mb-2"></i>
                    ¡No tenés turnos esta semana!
                </div>`;
        } else {
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
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
