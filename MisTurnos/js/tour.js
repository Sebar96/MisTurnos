/*
 * TOUR GUIADO CON SPOTLIGHT - MisTurnos
 * Reemplaza el onboarding de slides. 12 pasos: resalta el elemento real
 * con un recorte iluminado + tarjeta explicativa.
 * Se lanza: automáticamente al registrarse (App.checkOnboarding) o desde
 * el menú de usuario > "Ver Tutorial" (Tour.start()).
 */

const Tour = {

    _index: 0,
    _active: false,
    _gen: 0,
    _timer: null,
    _target: null,
    _navExpanded: false,
    _dropdown: null,
    _keyFn: null,
    _scrollFn: null,

    _steps: [
        {
            page: 'dashboard',
            target: '#navContent ul.navbar-nav.me-auto',
            expandNav: true,
            icon: 'bi-compass',
            title: 'Tu barra de navegación',
            text: 'Acá te movés por la app: <strong>Inicio</strong> (resumen del día), <strong>Pacientes</strong> (tu cartera), <strong>Turnos</strong> (agenda completa) y <strong>Perfil</strong> (tus datos). En el celular, abrila con el botón ☰.'
        },
        {
            target: '#langToggle',
            expandNav: true,
            icon: 'bi-moon-stars',
            title: 'Tema e idioma',
            text: 'El ícono 🌙 cambia entre modo <strong>oscuro y claro</strong>. El botón <strong>EN/ES</strong> cambia el idioma de la interfaz.'
        },
        {
            page: 'dashboard',
            target: '#page-dashboard .stat-card',
            icon: 'bi-graph-up',
            title: 'Tu Dashboard',
            text: 'Las 3 tarjetas muestran los turnos de <strong>HOY</strong>, de la <strong>SEMANA</strong> y los <strong>PENDIENTES</strong>. La lista "Próximos Turnos" solo muestra los de hoy: para ver otra fecha usá la pestaña <strong>Turnos</strong>.'
        },
        {
            page: 'dashboard',
            target: '#page-dashboard button[onclick*="Patients.showModal"]',
            icon: 'bi-person-plus',
            title: 'Creá tu primer paciente',
            text: 'Solo <strong>Nombre</strong> y <strong>Teléfono</strong> son obligatorios; el resto es opcional. Si activás "datos médicos" en tu Perfil, se suman campos de alergias, medicación y cardiopatía.'
        },
        {
            page: 'patients',
            target: '#page-patients .card.border-0.shadow-sm',
            icon: 'bi-search',
            title: 'Buscá y filtrá',
            text: 'Buscá por nombre, teléfono o email al vuelo y filtrá por estado u obra social.<br><br>Consejo: los pacientes <strong>Inactivos</strong> no aparecen al agendar turnos (se reactivan con ⏸ de su tarjeta). La lista pagina de a 20.'
        },
        {
            target: null,
            icon: 'bi-person-vcard',
            title: 'Tu tarjeta de paciente',
            text: 'Cuando tengas pacientes, cada tarjeta tiene:<br>• <strong>➕</strong> crear un turno para esa persona<br>• <strong>💬</strong> WhatsApp directo<br>• <strong>✎</strong> editar la ficha<br>• <strong>⏸/▶</strong> pausar o reactivar<br>• Tocá la ficha para ver el detalle con sus últimos 10 turnos.'
        },
        {
            page: 'appointments',
            target: '#page-appointments button[onclick*="Appointments.showModal"]',
            icon: 'bi-calendar-plus',
            title: 'Agendá un turno en 2 pasos',
            text: '<strong>Paso 1:</strong> elegí el paciente (o crealo rápido desde ahí).<br><strong>Paso 2:</strong> fecha, hora, motivo y notas.<br><br>Ojo: <strong>no se pueden agendar dos turnos en la misma fecha y hora</strong>, ni siquiera con pacientes distintos.'
        },
        {
            target: null,
            icon: 'bi-list-check',
            title: 'Gestioná tus turnos',
            text: 'Los filtros <strong>"Fecha desde / hasta"</strong> muestran por defecto de hoy a +1 mes (no hay calendario mensual: cambiá "hasta" para ver otro mes).<br><br>En cada turno: <strong>✓</strong> confirmar · <strong>✓</strong> realizado · <strong>↻</strong> reprogramar · <strong>✎</strong> editar · <strong>✕</strong> cancelar. Al cancelar te avisa si faltan menos de 30 min y te ofrece mandar WhatsApp.'
        },
        {
            page: 'dashboard',
            target: '#page-dashboard button[onclick*="sendReminders"]',
            icon: 'bi-whatsapp',
            title: 'Recordatorios por WhatsApp',
            text: 'Este botón abre WhatsApp con un mensaje <strong>por cada turno de MAÑANA</strong> (programado o confirmado). Desde el 💬 de cada turno hay 5 plantillas listas: confirmar, reprogramar, cancelar y recordar.'
        },
        {
            page: 'profile',
            target: '#page-profile .card.border-0.shadow-sm',
            icon: 'bi-heart-pulse',
            title: 'Tu Perfil y tu Plan',
            text: 'Cargá tu foto, los datos del consultorio y la ubicación del mapa. El switch <strong>"datos médicos"</strong> habilita los campos médicos al crear pacientes.<br><br>Con <strong>"Cambiar plan"</strong> ves tu prueba de 30 días y tu uso de pacientes (Básico 25 · Profesional 50 · Consultorio ilimitado).'
        },
        {
            target: '#navbar .dropdown-menu',
            expandNav: true,
            openDropdown: true,
            icon: 'bi-person-circle',
            title: 'Menú de usuario',
            text: 'Acá está <strong>Mi Plan</strong>, <strong>Exportar/Importar</strong> respaldos en JSON y <strong>Reportar Errores</strong>.<br><br>Por seguridad, la sesión se cierra sola a los <strong>30 minutos</strong> de inactividad: volvé a entrar con tu email y contraseña.'
        },
        {
            page: 'dashboard',
            target: null,
            icon: 'bi-rocket-takeoff',
            title: '¡Listo para empezar!',
            text: 'Creá tu primer paciente y agendá un turno.<br><br>Si querés ver esta guía de nuevo: menú de usuario → <strong>Ver Tutorial</strong>. Y si algo no se actualiza: <strong>Ctrl+Shift+R</strong> (o borrá el historial de Safari en iPhone).'
        }
    ],

    start() {
        if (this._active) return;
        if (typeof Auth !== 'undefined' && !Auth.getUid()) return;

        this._active = true;
        this._index = 0;
        this._navExpanded = false;
        this._dropdown = null;
        this._closeOpenDropdowns();
        this._buildRoot();

        this._keyFn = (e) => {
            if (e.key === 'Escape') this.finish();
            else if (e.key === 'ArrowRight') this.next();
            else if (e.key === 'ArrowLeft') this.prev();
        };
        this._scrollFn = () => this._position();
        document.addEventListener('keydown', this._keyFn);
        window.addEventListener('scroll', this._scrollFn, { passive: true });
        window.addEventListener('resize', this._scrollFn);

        this._show();
    },

    _buildRoot() {
        const old = document.getElementById('tourRoot');
        if (old) old.remove();

        const root = document.createElement('div');
        root.id = 'tourRoot';
        root.className = 'tour-root';
        root.innerHTML = `
            <div class="tour-backdrop"></div>
            <div class="tour-spotlight"></div>
            <div class="tour-card"></div>`;
        // Que los clicks dentro del tour no lleguen al document
        // (evita que Bootstrap cierre el dropdown del paso 11)
        root.addEventListener('click', (e) => e.stopPropagation());
        document.body.appendChild(root);
    },

    _show() {
        const step = this._steps[this._index];
        const gen = ++this._gen;
        clearTimeout(this._timer);

        this._renderCard(step);

        let delay = 0;
        if (step.page && App.getCurrentPage() !== step.page) {
            App.navigate(step.page);
            delay = 450;
        }

        if (step.expandNav) {
            this._showNav();
            delay = Math.max(delay, 350);
        } else if (this._navExpanded && window.innerWidth < 992) {
            // En móvil, cerrar el menú una vez pasados los pasos de navbar
            this._hideNav();
        }

        if (step.openDropdown) {
            this._openDropdown();
            delay = Math.max(delay, 400);
        } else if (this._dropdown) {
            this._closeDropdown();
        }

        this._timer = setTimeout(() => {
            if (gen !== this._gen) return;

            this._resolveTarget(step);
            if (this._target) {
                try { this._target.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { /* noop */ }
            }
            this._position();

            // Reposicionar tras el smooth-scroll y al cargar imgs/layout
            this._timer = setTimeout(() => {
                if (gen === this._gen) this._position();
            }, 400);
        }, delay);
    },

    _resolveTarget(step) {
        this._target = null;
        if (!step.target) return;
        try {
            this._target = document.querySelector(step.target);
        } catch (e) {
            this._target = null;
        }
    },

    _renderCard(step) {
        const root = document.getElementById('tourRoot');
        if (!root) return;
        const card = root.querySelector('.tour-card');
        const total = this._steps.length;
        const isLast = this._index === total - 1;

        card.innerHTML = `
            <div class="tour-card-top">
                <span class="tour-badge">${this._index + 1} / ${total}</span>
                <span class="tour-title"><i class="bi ${step.icon} me-2"></i>${step.title}</span>
            </div>
            <div class="tour-text">${step.text}</div>
            <div class="tour-dots">
                ${this._steps.map((_, i) => `<div class="tour-dot ${i === this._index ? 'active' : ''}"></div>`).join('')}
            </div>
            <div class="tour-actions">
                <button class="btn btn-outline-secondary btn-sm" onclick="Tour.finish()">Saltar</button>
                ${this._index > 0 ? '<button class="btn btn-outline-primary btn-sm" onclick="Tour.prev()">Atrás</button>' : ''}
                <button class="btn btn-primary btn-sm" onclick="Tour.next()">${isLast ? '¡Empezar!' : 'Siguiente'}</button>
            </div>`;
    },

    _position() {
        const root = document.getElementById('tourRoot');
        if (!root) return;
        const card = root.querySelector('.tour-card');
        const spot = root.querySelector('.tour-spotlight');
        if (!card || !spot) return;

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Sin elemento: tarjeta centrada (como el onboarding clásico)
        if (!this._target) {
            root.classList.add('tour-root-centered');
            spot.style.display = 'none';
            card.classList.add('tour-card-centered');
            card.style.top = card.style.left = card.style.right = card.style.bottom = '';
            return;
        }

        root.classList.remove('tour-root-centered');
        card.classList.remove('tour-card-centered');
        spot.style.display = '';

        const r = this._target.getBoundingClientRect();
        const pad = 6;

        // Recorte iluminado sobre el elemento (box-shadow oscurece el resto)
        spot.style.left = Math.max(0, r.left - pad) + 'px';
        spot.style.top = Math.max(0, r.top - pad) + 'px';
        spot.style.width = (r.width + pad * 2) + 'px';
        spot.style.height = (r.height + pad * 2) + 'px';

        card.style.top = card.style.left = card.style.right = card.style.bottom = '';
        card.style.maxWidth = Math.min(370, vw - 24) + 'px';

        if (vw < 768) {
            // Móvil: tarjeta abajo tipo bottom-sheet
            card.style.left = '12px';
            card.style.right = '12px';
            card.style.bottom = '12px';
            const ch = card.offsetHeight;
            if (r.bottom + 24 > vh - ch && r.top > ch + 24) {
                card.style.bottom = '';
                card.style.top = '12px';
            }
            return;
        }

        // Desktop: tarjeta junto al elemento resaltado
        const cw = card.offsetWidth;
        const ch = card.offsetHeight;
        let top = r.bottom + 14;
        if (top + ch > vh - 12) top = Math.max(12, r.top - 14 - ch);
        let left = r.left + r.width / 2 - cw / 2;
        left = Math.max(12, Math.min(left, vw - cw - 12));
        card.style.top = top + 'px';
        card.style.left = left + 'px';
    },

    next() {
        if (this._index >= this._steps.length - 1) {
            this.finish();
            return;
        }
        this._index++;
        this._show();
    },

    prev() {
        if (this._index <= 0) return;
        this._index--;
        this._show();
    },

    finish() {
        if (!this._active) return;
        this._active = false;
        this._gen++;
        clearTimeout(this._timer);

        this._closeDropdown();
        if (this._navExpanded && typeof bootstrap !== 'undefined') {
            const nc = document.getElementById('navContent');
            if (nc) {
                try { bootstrap.Collapse.getOrCreateInstance(nc, { toggle: false }).hide(); } catch (e) { /* noop */ }
            }
            this._navExpanded = false;
        }

        document.removeEventListener('keydown', this._keyFn);
        window.removeEventListener('scroll', this._scrollFn);
        window.removeEventListener('resize', this._scrollFn);
        this._keyFn = null;
        this._scrollFn = null;
        this._target = null;

        const root = document.getElementById('tourRoot');
        if (root) root.remove();

        this._markDone();
    },

    _closeOpenDropdowns() {
        // Si se abre desde el menú de usuario, el dropdown queda abierto
        if (typeof bootstrap === 'undefined') return;
        document.querySelectorAll('#navbar .dropdown-toggle').forEach((toggle) => {
            const inst = bootstrap.Dropdown.getInstance(toggle);
            if (inst) { try { inst.hide(); } catch (e) { /* noop */ } }
        });
        document.querySelectorAll('#navbar .dropdown-menu.show').forEach((m) => m.classList.remove('show'));
    },

    _showNav() {
        if (typeof bootstrap === 'undefined') return;
        const nc = document.getElementById('navContent');
        if (!nc) return;
        try {
            bootstrap.Collapse.getOrCreateInstance(nc, { toggle: false }).show();
            this._navExpanded = true;
        } catch (e) { /* noop */ }
    },

    _hideNav() {
        if (typeof bootstrap === 'undefined') return;
        const nc = document.getElementById('navContent');
        if (!nc) return;
        try {
            bootstrap.Collapse.getOrCreateInstance(nc, { toggle: false }).hide();
            this._navExpanded = false;
        } catch (e) { /* noop */ }
    },

    _openDropdown() {
        if (typeof bootstrap === 'undefined') return;
        const toggle = document.querySelector('#navbar .dropdown-toggle');
        if (!toggle) return;
        try {
            this._dropdown = bootstrap.Dropdown.getOrCreateInstance(toggle);
            this._dropdown.show();
        } catch (e) {
            this._dropdown = null;
        }
    },

    _closeDropdown() {
        if (!this._dropdown) return;
        try { this._dropdown.hide(); } catch (e) { /* noop */ }
        this._dropdown = null;
    },

    _markDone() {
        const uid = (typeof Auth !== 'undefined') ? Auth.getUid() : null;
        if (!uid) return;

        localStorage.setItem('misturnos_onboarded_' + uid, '1');

        try {
            const { doc, setDoc } = window.firebaseExports;
            const db = window.firebaseDB;
            setDoc(doc(db, 'users', uid), { onboardingDone: true }, { merge: true })
                .catch(() => { /* noop */ });
        } catch (e) { /* noop */ }
    }
};
