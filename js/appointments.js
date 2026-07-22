/*
 * ============================================================
 * APPOINTMENTS.JS - GESTIÓN DE TURNOS
 * ============================================================
 * Maneja todo lo relacionado con los turnos:
 * - Crear nuevo turno (fecha, hora, paciente, motivo)
 * - Modificar turno existente
 * - Reprogramar turno (cambiar fecha/hora)
 * - Cancelar turno (con aviso previo de 30 minutos)
 * - Estados: programado, confirmado, realizado, cancelado
 * - Envío de recordatorios por WhatsApp
 *
 * Los datos se guardan en localStorage con la clave
 * 'misturnos_appointments' como un array de objetos.
 *
 * ESTRUCTURA DE UN TURNO:
 * {
 *   id: "abc123",
 *   patientId: "xyz789",     // ID del paciente
 *   date: "2026-07-22",      // Fecha en formato YYYY-MM-DD
 *   time: "14:30",           // Hora en formato HH:MM
 *   status: "scheduled",     // scheduled | confirmed | completed | cancelled
 *   reason: "Consulta general",
 *   notes: "Traer estudios previos",
 *   createdAt: "...",
 *   updatedAt: "..."
 * }
 * ============================================================
 */

const Appointments = {

    // ============================================================
    // OBTENER DATOS
    // ============================================================

    /**
     * getAll()
     * Devuelve TODOS los turnos del usuario actual.
     *
     * @returns {Array} Lista de turnos
     */
    getAll() {
        return JSON.parse(localStorage.getItem('misturnos_appointments') || '[]');
    },

    /**
     * getById(id)
     * Busca un turno por su ID.
     *
     * @param {string} id - ID del turno
     * @returns {object|null} Turno encontrado o null
     */
    getById(id) {
        return this.getAll().find((a) => a.id === id) || null;
    },

    /**
     * save(appointments)
     * Guarda la lista completa de turnos en localStorage.
     *
     * @param {Array} appointments - Array de turnos
     */
    save(appointments) {
        localStorage.setItem('misturnos_appointments', JSON.stringify(appointments));
    },

    // ============================================================
    // RENDERIZAR LISTA DE TURNOS
    // ============================================================

    /**
     * render()
     * Dibuja la lista de turnos en la página.
     * Se llama cada vez que se navega a la sección de turnos.
     */
    render() {
        let appointments = this.getAll();
        const container = document.getElementById('appointmentsList');
        const patients = Patients.getAll();

        // Aplicar filtros de la interfaz
        appointments = this.applyFilters(appointments);

        // Si no hay turnos, mostrar mensaje
        if (appointments.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="bi bi-calendar-x fs-1 d-block mb-2"></i>
                    <p class="mb-2">No hay turnos en este período</p>
                    <button class="btn btn-primary btn-sm" onclick="Appointments.showModal()">
                        <i class="bi bi-plus-circle me-1"></i>Crear primer turno
                    </button>
                </div>`;
            return;
        }

        // Ordenar: primero por fecha (más cercana primero), luego por hora
        appointments.sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.time.localeCompare(b.time);
        });

        // Renderizar cada turno
        container.innerHTML = appointments.map((appt) => {
            const patient = patients.find((p) => p.id === appt.patientId);
            const patientName = patient ? patient.name : 'Paciente eliminado';
            const patientPhone = patient ? patient.phone : '';

            // ¿Es turno futuro o pasado?
            const apptDate = new Date(appt.date + 'T' + appt.time);
            const isPast = apptDate < new Date();
            const isToday = appt.date === App.formatDate(new Date());

            // ¿Se puede cancelar? (solo si está programado/confirmado Y es futuro)
            const canCancel = (appt.status === 'scheduled' || appt.status === 'confirmed') && !isPast;

            return `
                <div class="list-group-item appointment-item status-${appt.status} ${isPast && appt.status !== 'cancelled' ? 'opacity-75' : ''}">
                    <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                        <!-- Información principal -->
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-center flex-wrap gap-2 mb-1">
                                <!-- Badge del día (si es hoy, resaltado) -->
                                <span class="badge ${isToday ? 'bg-primary' : 'bg-light text-dark'}">
                                    ${isToday ? 'HOY' : App.formatDateShort(appt.date)}
                                </span>
                                <!-- Hora -->
                                <span class="fw-bold fs-5">${appt.time}</span>
                                <!-- Día de la semana -->
                                <small class="text-muted">${App.getDayOfWeek(appt.date)}</small>
                            </div>

                            <!-- Nombre del paciente -->
                            <div class="mb-1">
                                <i class="bi bi-person me-1"></i>
                                <span class="fw-semibold">${patientName}</span>
                            </div>

                            <!-- Motivo si existe -->
                            ${appt.reason ? `<small class="text-muted"><i class="bi bi-chat-dots me-1"></i>${appt.reason}</small>` : ''}

                            <!-- Notas si existen -->
                            ${appt.notes ? `<small class="text-muted d-block"><i class="bi bi-sticky me-1"></i>${appt.notes}</small>` : ''}
                        </div>

                        <!-- Lado derecho: Estado + Botones -->
                        <div class="d-flex flex-column align-items-end gap-2">
                            <!-- Badge de estado -->
                            <span class="badge badge-status badge-${appt.status}">
                                ${this.getStatusLabel(appt.status)}
                            </span>

                            <!-- Botones de acción -->
                            <div class="d-flex gap-1 flex-wrap justify-content-end">
                                <!-- WhatsApp -->
                                ${patientPhone ? `
                                    <button class="btn-whatsapp" style="width:32px;height:32px;font-size:0.9rem"
                                            title="WhatsApp" onclick="App.openWhatsApp('${patientPhone}', 'Hola, le escribimos desde MisTurnos sobre su turno del ${App.formatDateHuman(appt.date)} a las ${appt.time}.')">
                                        <i class="bi bi-whatsapp"></i>
                                    </button>
                                ` : ''}

                                <!-- Confirmar (solo si está programado) -->
                                ${appt.status === 'scheduled' ? `
                                    <button class="btn btn-outline-success btn-sm" title="Confirmar"
                                            onclick="Appointments.changeStatus('${appt.id}', 'confirmed')">
                                        <i class="bi bi-check-lg"></i>
                                    </button>
                                ` : ''}

                                <!-- Marcar como realizado (solo si está confirmado) -->
                                ${appt.status === 'confirmed' ? `
                                    <button class="btn btn-outline-primary btn-sm" title="Marcar como realizado"
                                            onclick="Appointments.changeStatus('${appt.id}', 'completed')">
                                        <i class="bi bi-check-circle"></i>
                                    </button>
                                ` : ''}

                                <!-- Reprogramar -->
                                ${canCancel ? `
                                    <button class="btn btn-outline-warning btn-sm" title="Reprogramar"
                                            onclick="Appointments.showModal('${appt.id}', null, true)">
                                        <i class="bi bi-arrow-repeat"></i>
                                    </button>
                                ` : ''}

                                <!-- Editar -->
                                <button class="btn btn-outline-secondary btn-sm" title="Editar"
                                        onclick="Appointments.showModal('${appt.id}')">
                                    <i class="bi bi-pencil"></i>
                                </button>

                                <!-- Cancelar -->
                                ${canCancel ? `
                                    <button class="btn btn-outline-danger btn-sm" title="Cancelar"
                                            onclick="Appointments.cancel('${appt.id}')">
                                        <i class="bi bi-x-lg"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>`;
        }).join('');
    },

    // ============================================================
    // FILTROS
    // ============================================================

    /**
     * applyFilters(appointments)
     * Aplica los filtros de la interfaz sobre la lista de turnos.
     *
     * @param {Array} appointments - Lista original
     * @returns {Array} Lista filtrada
     */
    applyFilters(appointments) {
        const dateFrom = document.getElementById('apptDateFrom')?.value;
        const dateTo = document.getElementById('apptDateTo')?.value;
        const statusFilter = document.getElementById('apptStatusFilter')?.value;
        const patientSearch = document.getElementById('apptPatientSearch')?.value?.toLowerCase();

        let filtered = [...appointments];

        // Filtrar por fecha desde
        if (dateFrom) {
            filtered = filtered.filter((a) => a.date >= dateFrom);
        }

        // Filtrar por fecha hasta
        if (dateTo) {
            filtered = filtered.filter((a) => a.date <= dateTo);
        }

        // Filtrar por estado
        if (statusFilter && statusFilter !== 'all') {
            filtered = filtered.filter((a) => a.status === statusFilter);
        }

        // Filtrar por nombre de paciente
        if (patientSearch) {
            const patients = Patients.getAll();
            const matchingIds = patients
                .filter((p) => p.name.toLowerCase().includes(patientSearch))
                .map((p) => p.id);
            filtered = filtered.filter((a) => matchingIds.includes(a.patientId));
        }

        return filtered;
    },

    /**
     * filter()
     * Se ejecuta cuando cambia algún filtro. Solo re-renderiza la lista.
     */
    filter() {
        this.render();
    },

    // ============================================================
    // MODAL WIZARD PARA CREAR / EDITAR / REPROGRAMAR
    // ============================================================

    // Estado del wizard (se guarda entre pasos)
    _wizard: {
        step: 1,                    // Paso actual (1 = paciente, 2 = fecha/hora)
        selectedPatientId: null,    // ID del paciente seleccionado
        appointmentId: null,        // ID del turno (null si es nuevo)
        reschedule: false,          // ¿Es reprogramación?
        modal: null                 // Instancia del modal de Bootstrap
    },

    /**
     * showModal(appointmentId = null, preselectedPatientId = null, reschedule = false)
     * Abre el modal con flujo wizard:
     *
     *   CREACIÓN:  Paso 1 (elegir paciente) → Paso 2 (fecha/hora) → Guardar
     *   EDICIÓN:   Paso 2 directo (paciente ya conocido)
     *   REPROGRAMAR: Paso 2 directo (solo cambia fecha/hora)
     *
     * @param {string|null} appointmentId - ID del turno a editar
     * @param {string|null} preselectedPatientId - ID del paciente pre-seleccionado
     * @param {boolean} reschedule - Si es true, estamos reprogramando
     */
    showModal(appointmentId = null, preselectedPatientId = null, reschedule = false) {
        const isEditing = appointmentId !== null;
        const appointment = isEditing ? this.getById(appointmentId) : null;

        // Determinar en qué paso empezar
        let startStep;
        let selectedPatientId;

        if (isEditing || reschedule) {
            // Si estamos editando o reprogramando, el paciente ya está elegido
            // Ir directo al paso 2 (fecha/hora)
            startStep = 2;
            selectedPatientId = appointment ? appointment.patientId : preselectedPatientId;
        } else if (preselectedPatientId) {
            // Si nos viene un paciente pre-seleccionado (desde la tarjeta del paciente)
            startStep = 2;
            selectedPatientId = preselectedPatientId;
        } else {
            // Creación libre: empezar por el paso 1 (elegir paciente)
            startStep = 1;
            selectedPatientId = null;
        }

        // Guardar estado del wizard
        this._wizard = {
            step: startStep,
            selectedPatientId: selectedPatientId,
            appointmentId: appointmentId,
            reschedule: reschedule,
            modal: null
        };

        // Título del modal
        let title = 'Nuevo Turno';
        if (isEditing && reschedule) title = 'Reprogramar Turno';
        else if (isEditing) title = 'Editar Turno';
        document.getElementById('modalTitle').textContent = title;

        // Limpiar footer
        document.getElementById('modalFooter').innerHTML = '';

        // Renderizar el paso correspondiente
        if (startStep === 1) {
            this.renderPatientStep();
        } else {
            this.renderDateTimeStep();
        }

        // Abrir modal (guardamos la instancia para poder cerrarlo después)
        this._wizard.modal = new bootstrap.Modal(document.getElementById('appModal'));
        this._wizard.modal.show();
    },

    // ============================================================
    // PASO 1: SELECCIÓN DE PACIENTE
    // ============================================================

    /**
     * renderPatientStep()
     * Renderiza el primer paso del wizard: buscar y elegir un paciente
     * o crear uno nuevo rápido.
     */
    renderPatientStep() {
        const patients = Patients.getAll().filter((p) => p.status === 'active');
        const body = document.getElementById('modalBody');

        body.innerHTML = `
            <!-- Barra de búsqueda del paciente -->
            <div class="mb-3">
                <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                    <input type="text" class="form-control" id="wizardPatientSearch"
                           placeholder="Buscar paciente por nombre o teléfono..."
                           oninput="Appointments.filterPatientStep()" autofocus>
                </div>
            </div>

            <!-- Lista de pacientes -->
            <div id="wizardPatientList" style="max-height: 300px; overflow-y: auto;">
                ${this.renderPatientList(patients)}
            </div>

            <!-- Separador -->
            <hr class="my-3">

            <!-- Botón de creación rápida -->
            <div class="text-center">
                <p class="text-muted small mb-2">¿No encontrás al paciente?</p>
                <button class="btn btn-outline-success" onclick="Appointments.showQuickCreate()">
                    <i class="bi bi-person-plus me-2"></i>Crear paciente rápido
                </button>
            </div>

            <!-- Formulario de creación rápida (oculto por defecto) -->
            <div id="quickCreateForm" class="d-none mt-3">
                <div class="card border-success">
                    <div class="card-body">
                        <h6 class="card-title fw-bold text-success">
                            <i class="bi bi-lightning me-1"></i>Creación rápida
                        </h6>
                        <form onsubmit="Patients.quickCreate(event, (newId) => Appointments.onQuickPatientCreated(newId))">
                            <div class="row g-2">
                                <div class="col-md-6">
                                    <input type="text" class="form-control" id="qcName"
                                           placeholder="Nombre completo *" required>
                                </div>
                                <div class="col-md-6">
                                    <input type="tel" class="form-control" id="qcPhone"
                                           placeholder="Teléfono *" required>
                                </div>
                            </div>
                            <div class="d-flex gap-2 mt-3">
                                <button type="submit" class="btn btn-success btn-sm">
                                    <i class="bi bi-check-circle me-1"></i>Crear y seleccionar
                                </button>
                                <button type="button" class="btn btn-outline-secondary btn-sm"
                                        onclick="Appointments.hideQuickCreate()">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>`;

        // Footer vacío en el paso 1 (la selección es el click en un paciente)
        document.getElementById('modalFooter').innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>`;

        // Enfocar la búsqueda
        setTimeout(() => {
            const search = document.getElementById('wizardPatientSearch');
            if (search) search.focus();
        }, 300);
    },

    /**
     * renderPatientList(patients)
     * Genera el HTML de la lista de pacientes para el wizard.
     *
     * @param {Array} patients - Lista de pacientes a mostrar
     * @returns {string} HTML de la lista
     */
    renderPatientList(patients) {
        if (patients.length === 0) {
            return `
                <div class="text-center text-muted py-3">
                    <i class="bi bi-person-x d-block mb-1"></i>
                    No se encontraron pacientes
                </div>`;
        }

        return patients.map((p) => {
            const isSelected = this._wizard.selectedPatientId === p.id;
            const initials = p.name.split(' ').filter((w) => w.length > 2).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

            return `
                <div class="d-flex align-items-center p-2 rounded mb-1 wizard-patient-item
                            ${isSelected ? 'bg-primary bg-opacity-10' : ''}"
                     style="cursor: pointer; transition: background 0.2s;"
                     onmouseover="this.style.background='var(--primary-light)'"
                     onmouseout="this.style.background='${isSelected ? 'rgba(79,70,229,0.1)' : ''}'"
                     onclick="Appointments.selectPatient('${p.id}')">
                    <!-- Avatar -->
                    <div class="patient-avatar me-3" style="width:40px;height:40px;font-size:0.9rem;flex-shrink:0">
                        ${initials}
                    </div>
                    <!-- Datos -->
                    <div class="flex-grow-1 min-width-0">
                        <div class="fw-semibold text-truncate">${p.name}</div>
                        <small class="text-muted">
                            <i class="bi bi-telephone me-1"></i>${p.phone || 'Sin teléfono'}
                            ${p.insurance ? ` · <i class="bi bi-hospital me-1"></i>${p.insurance}` : ''}
                        </small>
                    </div>
                    <!-- Flecha -->
                    <i class="bi bi-chevron-right text-muted"></i>
                </div>`;
        }).join('');
    },

    /**
     * filterPatientStep()
     * Filtra la lista de pacientes en el wizard mientras el usuario escribe.
     */
    filterPatientStep() {
        const search = document.getElementById('wizardPatientSearch').value.toLowerCase();
        const patients = Patients.getAll().filter((p) => p.status === 'active');

        const filtered = search
            ? patients.filter((p) =>
                p.name.toLowerCase().includes(search) ||
                (p.phone && p.phone.includes(search))
            )
            : patients;

        document.getElementById('wizardPatientList').innerHTML = this.renderPatientList(filtered);
    },

    /**
     * selectPatient(patientId)
     * Se ejecuta cuando el usuario hace clic en un paciente de la lista.
     * Avanza al paso 2 (fecha/hora).
     *
     * @param {string} patientId - ID del paciente seleccionado
     */
    selectPatient(patientId) {
        this._wizard.selectedPatientId = patientId;

        const patient = Patients.getById(patientId);
        const name = patient ? patient.name : '';

        // Actualizar título del modal
        document.getElementById('modalTitle').textContent = `Turno para ${name}`;

        // Avanzar al paso 2
        this._wizard.step = 2;
        this.renderDateTimeStep();
    },

    /**
     * goBackToPatientStep()
     * Vuelve al paso 1 (selección de paciente) desde el paso 2.
     */
    goBackToPatientStep() {
        this._wizard.step = 1;
        document.getElementById('modalTitle').textContent = 'Nuevo Turno';
        this.renderPatientStep();
    },

    // ============================================================
    // CREACIÓN RÁPIDA DE PACIENTE (desde el wizard)
    // ============================================================

    /**
     * showQuickCreate()
     * Muestra el formulario de creación rápida de paciente.
     */
    showQuickCreate() {
        const form = document.getElementById('quickCreateForm');
        form.classList.remove('d-none');
        document.getElementById('qcName').focus();
    },

    /**
     * hideQuickCreate()
     * Oculta el formulario de creación rápida.
     */
    hideQuickCreate() {
        document.getElementById('quickCreateForm').classList.add('d-none');
        document.getElementById('qcName').value = '';
        document.getElementById('qcPhone').value = '';
    },

    /**
     * onQuickPatientCreated(newPatientId)
     * Callback que se ejecuta después de crear un paciente rápido.
     * Selecciona automáticamente al paciente y avanza al paso 2.
     *
     * @param {string} newPatientId - ID del paciente recién creado
     */
    onQuickPatientCreated(newPatientId) {
        this.selectPatient(newPatientId);
    },

    // ============================================================
    // PASO 2: FECHA, HORA Y DETALLES DEL TURNO
    // ============================================================

    /**
     * renderDateTimeStep()
     * Renderiza el segundo paso del wizard: fecha, hora, motivo, notas.
     * Muestra el paciente seleccionado como confirmación visual.
     */
    renderDateTimeStep() {
        const patient = Patients.getById(this._wizard.selectedPatientId);
        const isEditing = this._wizard.appointmentId !== null;
        const appointment = isEditing ? this.getById(this._wizard.appointmentId) : null;
        const reschedule = this._wizard.reschedule;

        // Valores por defecto
        const now = new Date();
        const defaultDate = appointment ? appointment.date : App.formatDate(now);
        const defaultTime = appointment ? appointment.time : String(now.getHours() + 1).padStart(2, '0') + ':00';

        const body = document.getElementById('modalBody');

        body.innerHTML = `
            <!-- Resumen del paciente seleccionado -->
            <div class="d-flex align-items-center p-3 mb-3 rounded bg-primary bg-opacity-10">
                <div class="patient-avatar me-3" style="width:44px;height:44px;font-size:0.95rem">
                    ${patient ? patient.name.split(' ').filter((w) => w.length > 2).map((w) => w[0]).slice(0, 2).join('').toUpperCase() : '??'}
                </div>
                <div class="flex-grow-1">
                    <div class="fw-bold">${patient ? patient.name : 'Paciente no encontrado'}</div>
                    <small class="text-muted">
                        <i class="bi bi-telephone me-1"></i>${patient ? (patient.phone || 'Sin teléfono') : ''}
                        ${patient && patient.insurance ? ` · ${patient.insurance}` : ''}
                    </small>
                </div>
                <!-- Botón para volver y cambiar paciente (solo en creación nueva) -->
                ${!isEditing && !reschedule ? `
                    <button class="btn btn-sm btn-outline-primary" onclick="Appointments.goBackToPatientStep()" title="Cambiar paciente">
                        <i class="bi bi-arrow-left me-1"></i>Cambiar
                    </button>
                ` : ''}
            </div>

            <!-- Formulario de fecha/hora/detalles -->
            <form id="appointmentForm" onsubmit="Appointments.saveFromForm(event, '${this._wizard.appointmentId || ''}', ${reschedule})">
                <div class="row g-3">
                    <!-- Fecha -->
                    <div class="col-md-6">
                        <label class="form-label fw-semibold">
                            <i class="bi bi-calendar3 me-1"></i>Fecha *
                        </label>
                        <input type="date" class="form-control form-control-lg" id="aDate" required value="${defaultDate}">
                    </div>

                    <!-- Hora -->
                    <div class="col-md-6">
                        <label class="form-label fw-semibold">
                            <i class="bi bi-clock me-1"></i>Hora *
                        </label>
                        <input type="time" class="form-control form-control-lg" id="aTime" required value="${defaultTime}">
                    </div>

                    <!-- Estado (solo al editar/reprogramar) -->
                    ${isEditing ? `
                        <div class="col-md-6">
                            <label class="form-label fw-semibold">Estado</label>
                            <select class="form-select" id="aStatus">
                                <option value="scheduled" ${appointment.status === 'scheduled' ? 'selected' : ''}>Programado</option>
                                <option value="confirmed" ${appointment.status === 'confirmed' ? 'selected' : ''}>Confirmado</option>
                                <option value="completed" ${appointment.status === 'completed' ? 'selected' : ''}>Realizado</option>
                                <option value="cancelled" ${appointment.status === 'cancelled' ? 'selected' : ''}>Cancelado</option>
                            </select>
                        </div>
                    ` : ''}

                    <!-- Motivo -->
                    <div class="col-md-6">
                        <label class="form-label fw-semibold">Motivo</label>
                        <input type="text" class="form-control" id="aReason"
                               value="${appointment ? (appointment.reason || '') : ''}"
                               placeholder="Consulta general, control, etc.">
                    </div>

                    <!-- Notas -->
                    <div class="col-12">
                        <label class="form-label fw-semibold">Notas internas</label>
                        <textarea class="form-control" id="aNotes" rows="2"
                                  placeholder="Notas privadas sobre el turno...">${appointment ? (appointment.notes || '') : ''}</textarea>
                    </div>
                </div>
            </form>`;

        // Footer con botones
        document.getElementById('modalFooter').innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-primary btn-lg" form="appointmentForm">
                <i class="bi bi-check-circle me-2"></i>${isEditing ? 'Guardar Cambios' : 'Crear Turno'}
            </button>`;
    },

    // ============================================================
    // GUARDAR TURNO
    // ============================================================

    /**
     * saveFromForm(event, appointmentId, reschedule)
     * Toma los datos del formulario y crea/actualiza un turno.
     *
     * @param {Event} event
     * @param {string} appointmentId - ID del turno (vacío si es nuevo)
     * @param {boolean} reschedule - Si es reprogramación
     */
    saveFromForm(event, appointmentId, reschedule) {
        event.preventDefault();

        // reschedule viene como string "true"/"false" desde el HTML
        reschedule = (reschedule === 'true' || reschedule === true);

        const data = {
            patientId: this._wizard.selectedPatientId,
            date: document.getElementById('aDate').value,
            time: document.getElementById('aTime').value,
            reason: document.getElementById('aReason').value.trim(),
            notes: document.getElementById('aNotes').value.trim()
        };

        // Estado: al editar tiene su propio select, al crear siempre es "scheduled"
        const statusSelect = document.getElementById('aStatus');
        data.status = statusSelect ? statusSelect.value : 'scheduled';

        // Validaciones
        if (!data.patientId || !data.date || !data.time) {
            App.showToast('Completá paciente, fecha y hora', 'warning');
            return;
        }

        // Verificar que no haya otro turno en la misma fecha y hora
        const appointments = this.getAll();
        const conflict = appointments.find((a) =>
            a.date === data.date &&
            a.time === data.time &&
            a.status !== 'cancelled' &&
            a.id !== appointmentId
        );

        if (conflict) {
            const patient = Patients.getById(conflict.patientId);
            App.showToast(
                `Ya hay un turno a las ${data.time} el ${App.formatDateHuman(data.date)}${patient ? ' con ' + patient.name : ''}`,
                'warning'
            );
            return;
        }

        if (appointmentId) {
            // ---- MODO EDICIÓN ----
            const index = appointments.findIndex((a) => a.id === appointmentId);
            if (index !== -1) {
                appointments[index] = {
                    ...appointments[index],
                    ...data,
                    updatedAt: new Date().toISOString()
                };
                App.showToast(reschedule ? 'Turno reprogramado' : 'Turno actualizado', 'success');
            }
        } else {
            // ---- MODO CREACIÓN ----
            appointments.push({
                id: App.generateId(),
                ...data,
                createdAt: new Date().toISOString()
            });
            App.showToast('Turno creado correctamente', 'success');
        }

        // Guardar
        this.save(appointments);

        // Cerrar modal
        bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();

        // Actualizar vista
        this.render();
    },

    // ============================================================
    // CAMBIAR ESTADO DEL TURNO
    // ============================================================

    /**
     * changeStatus(appointmentId, newStatus)
     * Cambia el estado de un turno directamente (sin modal).
     *
     * @param {string} appointmentId - ID del turno
     * @param {string} newStatus - Nuevo estado
     */
    changeStatus(appointmentId, newStatus) {
        const appointments = this.getAll();
        const appointment = appointments.find((a) => a.id === appointmentId);

        if (!appointment) return;

        appointment.status = newStatus;
        appointment.updatedAt = new Date().toISOString();

        this.save(appointments);

        const labels = {
            confirmed: 'confirmado',
            completed: 'realizado',
            cancelled: 'cancelado',
            scheduled: 'programado'
        };

        App.showToast(`Turno marcado como ${labels[newStatus] || newStatus}`, 'success');
        this.render();
    },

    // ============================================================
    // CANCELAR TURNO (con verificación de 30 minutos)
    // ============================================================

    /**
     * cancel(appointmentId)
     * Cancela un turno. Si el turno es en menos de 30 minutos,
     * pide confirmación extra al usuario.
     *
     * @param {string} appointmentId - ID del turno
     */
    cancel(appointmentId) {
        const appointment = this.getById(appointmentId);
        if (!appointment) return;

        // Calcular cuánto falta para el turno
        const apptDateTime = new Date(appointment.date + 'T' + appointment.time);
        const now = new Date();
        const diffMinutes = (apptDateTime - now) / (1000 * 60);

        // Si faltan menos de 30 minutos, advertir
        if (diffMinutes < 30 && diffMinutes > 0) {
            const confirmed = confirm(
                `⚠️ ¡Atención!\n\n` +
                `Este turno es en ${Math.round(diffMinutes)} minutos.\n` +
                `Si lo cancelás ahora, el paciente podría no recibir el aviso a tiempo.\n\n` +
                `¿Estás seguro de que querés cancelarlo?`
            );
            if (!confirmed) return;
        }

        // Confirmar la cancelación
        if (!confirm('¿Confirmás la cancelación de este turno?')) return;

        // Obtener datos del paciente para el mensaje
        const patient = Patients.getById(appointment.patientId);

        // Cambiar estado
        this.changeStatus(appointmentId, 'cancelled');

        // Si tiene teléfono, ofrecer enviar aviso por WhatsApp
        if (patient && patient.phone) {
            const sendWhatsApp = confirm(
                `¿Querés enviar un aviso de cancelación por WhatsApp a ${patient.name}?`
            );
            if (sendWhatsApp) {
                App.openWhatsApp(
                    patient.phone,
                    `Hola ${patient.name}, le informamos que su turno del ${App.formatDateHuman(appointment.date)} a las ${appointment.time} ha sido cancelado. Si desea reprogramar, por favor comuníquese con nosotros. Disculpe las molestias.`
                );
            }
        }
    },

    // ============================================================
    // UTILIDADES
    // ============================================================

    /**
     * getStatusLabel(status)
     * Devuelve la etiqueta legible de cada estado.
     *
     * @param {string} status - Código del estado
     * @returns {string} Nombre legible del estado
     */
    getStatusLabel(status) {
        const labels = {
            scheduled: 'Programado',
            confirmed: 'Confirmado',
            completed: 'Realizado',
            cancelled: 'Cancelado'
        };
        return labels[status] || status;
    }
};
