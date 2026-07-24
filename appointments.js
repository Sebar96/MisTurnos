/*
 * APPOINTMENTS.JS - Firestore
 */

const Appointments = {

    _cache: [],

    async getAll() {
        const uid = Auth.getUid();
        if (!uid) return [];

        const { collection, getDocs } = window.firebaseExports;
        const db = window.firebaseDB;

        try {
            const snapshot = await getDocs(collection(db, 'users', uid, 'appointments'));
            this._cache = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            return this._cache;
        } catch (err) {
            console.error('[Appointments] Error getting appointments:', err);
            return this._cache;
        }
    },

    async getById(id) {
        const appointments = await this.getAll();
        return appointments.find((a) => a.id === id) || null;
    },

    async render() {
        let appointments = await this.getAll();
        const container = document.getElementById('appointmentsList');
        const patients = await Patients.getAll();

        appointments = this.applyFilters(appointments);

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

        appointments.sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.time.localeCompare(b.time);
        });

        container.innerHTML = appointments.map((appt) => {
            const patient = patients.find((p) => p.id === appt.patientId);
            const patientName = patient ? patient.name : 'Paciente eliminado';
            const patientPhone = patient ? patient.phone : '';

            const apptDate = new Date(appt.date + 'T' + appt.time);
            const isPast = apptDate < new Date();
            const isToday = appt.date === App.formatDate(new Date());

            const canCancel = (appt.status === 'scheduled' || appt.status === 'confirmed') && !isPast;

            return `
                <div class="list-group-item appointment-item status-${appt.status} ${isPast && appt.status !== 'cancelled' ? 'opacity-75' : ''}">
                    <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-center flex-wrap gap-2 mb-1">
                                <span class="badge ${isToday ? 'bg-primary' : 'bg-light text-dark'}">
                                    ${isToday ? 'HOY' : App.formatDateShort(appt.date)}
                                </span>
                                <span class="fw-bold fs-5">${appt.time}</span>
                                <small class="text-muted">${App.getDayOfWeek(appt.date)}</small>
                            </div>
                            <div class="mb-1">
                                <i class="bi bi-person me-1"></i>
                                <span class="fw-semibold">${patientName}</span>
                            </div>
                            ${appt.reason ? `<small class="text-muted"><i class="bi bi-chat-dots me-1"></i>${appt.reason}</small>` : ''}
                            ${appt.notes ? `<small class="text-muted d-block"><i class="bi bi-sticky me-1"></i>${appt.notes}</small>` : ''}
                        </div>
                        <div class="d-flex flex-column align-items-end gap-2">
                            <span class="badge badge-status badge-${appt.status}">
                                ${this.getStatusLabel(appt.status)}
                            </span>
                            <div class="d-flex gap-1 flex-wrap justify-content-end">
                                ${patientPhone ? `
                                    <button class="btn-whatsapp" style="width:32px;height:32px;font-size:0.9rem"
                                            title="WhatsApp" onclick="App.openWhatsApp('${patientPhone}', 'Hola, le escribimos desde MisTurnos sobre su turno del ${App.formatDateHuman(appt.date)} a las ${appt.time}.')">
                                        <i class="bi bi-whatsapp"></i>
                                    </button>
                                ` : ''}
                                ${appt.status === 'scheduled' ? `
                                    <button class="btn btn-outline-success btn-sm" title="Confirmar"
                                            onclick="Appointments.changeStatus('${appt.id}', 'confirmed')">
                                        <i class="bi bi-check-lg"></i>
                                    </button>
                                ` : ''}
                                ${appt.status === 'confirmed' ? `
                                    <button class="btn btn-outline-primary btn-sm" title="Marcar como realizado"
                                            onclick="Appointments.changeStatus('${appt.id}', 'completed')">
                                        <i class="bi bi-check-circle"></i>
                                    </button>
                                ` : ''}
                                ${canCancel ? `
                                    <button class="btn btn-outline-warning btn-sm" title="Reprogramar"
                                            onclick="Appointments.showModal('${appt.id}', null, true)">
                                        <i class="bi bi-arrow-repeat"></i>
                                    </button>
                                ` : ''}
                                <button class="btn btn-outline-secondary btn-sm" title="Editar"
                                        onclick="Appointments.showModal('${appt.id}')">
                                    <i class="bi bi-pencil"></i>
                                </button>
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

    applyFilters(appointments) {
        const dateFrom = document.getElementById('apptDateFrom')?.value;
        const dateTo = document.getElementById('apptDateTo')?.value;
        const statusFilter = document.getElementById('apptStatusFilter')?.value;
        const patientSearch = document.getElementById('apptPatientSearch')?.value?.toLowerCase();

        let filtered = [...appointments];

        if (dateFrom) {
            filtered = filtered.filter((a) => a.date >= dateFrom);
        }

        if (dateTo) {
            filtered = filtered.filter((a) => a.date <= dateTo);
        }

        if (statusFilter && statusFilter !== 'all') {
            filtered = filtered.filter((a) => a.status === statusFilter);
        }

        if (patientSearch) {
            const patients = this._patientsCache || [];
            const matchingIds = patients
                .filter((p) => p.name.toLowerCase().includes(patientSearch))
                .map((p) => p.id);
            filtered = filtered.filter((a) => matchingIds.includes(a.patientId));
        }

        return filtered;
    },

    filter() {
        this.render();
    },

    _wizard: {
        step: 1,
        selectedPatientId: null,
        appointmentId: null,
        reschedule: false,
        modal: null
    },

    async showModal(appointmentId = null, preselectedPatientId = null, reschedule = false) {
        const isEditing = appointmentId !== null;
        const appointment = isEditing ? await this.getById(appointmentId) : null;

        let startStep;
        let selectedPatientId;

        if (isEditing || reschedule) {
            startStep = 2;
            selectedPatientId = appointment ? appointment.patientId : preselectedPatientId;
        } else if (preselectedPatientId) {
            startStep = 2;
            selectedPatientId = preselectedPatientId;
        } else {
            startStep = 1;
            selectedPatientId = null;
        }

        this._wizard = {
            step: startStep,
            selectedPatientId: selectedPatientId,
            appointmentId: appointmentId,
            reschedule: reschedule,
            modal: null
        };

        let title = 'Nuevo Turno';
        if (isEditing && reschedule) title = 'Reprogramar Turno';
        else if (isEditing) title = 'Editar Turno';
        document.getElementById('modalTitle').textContent = title;

        document.getElementById('modalFooter').innerHTML = '';

        if (startStep === 1) {
            this.renderPatientStep();
        } else {
            this.renderDateTimeStep();
        }

        this._wizard.modal = new bootstrap.Modal(document.getElementById('appModal'));
        this._wizard.modal.show();
    },

    async renderPatientStep() {
        const allPatients = await Patients.getAll();
        const patients = allPatients.filter((p) => p.status === 'active');
        const body = document.getElementById('modalBody');

        body.innerHTML = `
            <div class="mb-3">
                <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                    <input type="text" class="form-control" id="wizardPatientSearch"
                           placeholder="Buscar paciente por nombre o teléfono..."
                           oninput="Appointments.filterPatientStep()" autofocus>
                </div>
            </div>
            <div id="wizardPatientList" style="max-height: 300px; overflow-y: auto;">
                ${this.renderPatientList(patients)}
            </div>
            <hr class="my-3">
            <div class="text-center">
                <p class="text-muted small mb-2">¿No encontrás al paciente?</p>
                <button class="btn btn-outline-success" onclick="Appointments.showQuickCreate()">
                    <i class="bi bi-person-plus me-2"></i>Crear paciente rápido
                </button>
            </div>
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

        document.getElementById('modalFooter').innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>`;

        setTimeout(() => {
            const search = document.getElementById('wizardPatientSearch');
            if (search) search.focus();
        }, 300);
    },

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
                    <div class="patient-avatar me-3" style="width:40px;height:40px;font-size:0.9rem;flex-shrink:0">
                        ${initials}
                    </div>
                    <div class="flex-grow-1 min-width-0">
                        <div class="fw-semibold text-truncate">${p.name}</div>
                        <small class="text-muted">
                            <i class="bi bi-telephone me-1"></i>${p.phone || 'Sin teléfono'}
                            ${p.insurance ? ` · <i class="bi bi-hospital me-1"></i>${p.insurance}` : ''}
                        </small>
                    </div>
                    <i class="bi bi-chevron-right text-muted"></i>
                </div>`;
        }).join('');
    },

    async filterPatientStep() {
        const search = document.getElementById('wizardPatientSearch').value.toLowerCase();
        const allPatients = await Patients.getAll();
        const patients = allPatients.filter((p) => p.status === 'active');

        const filtered = search
            ? patients.filter((p) =>
                p.name.toLowerCase().includes(search) ||
                (p.phone && p.phone.includes(search))
            )
            : patients;

        document.getElementById('wizardPatientList').innerHTML = this.renderPatientList(filtered);
    },

    async selectPatient(patientId) {
        this._wizard.selectedPatientId = patientId;

        const patient = await Patients.getById(patientId);
        const name = patient ? patient.name : '';

        document.getElementById('modalTitle').textContent = `Turno para ${name}`;

        this._wizard.step = 2;
        this.renderDateTimeStep();
    },

    goBackToPatientStep() {
        this._wizard.step = 1;
        document.getElementById('modalTitle').textContent = 'Nuevo Turno';
        this.renderPatientStep();
    },

    showQuickCreate() {
        const form = document.getElementById('quickCreateForm');
        form.classList.remove('d-none');
        document.getElementById('qcName').focus();
    },

    hideQuickCreate() {
        document.getElementById('quickCreateForm').classList.add('d-none');
        document.getElementById('qcName').value = '';
        document.getElementById('qcPhone').value = '';
    },

    onQuickPatientCreated(newPatientId) {
        this.selectPatient(newPatientId);
    },

    async renderDateTimeStep() {
        const patient = await Patients.getById(this._wizard.selectedPatientId);
        const isEditing = this._wizard.appointmentId !== null;
        const appointment = isEditing ? await this.getById(this._wizard.appointmentId) : null;
        const reschedule = this._wizard.reschedule;

        const now = new Date();
        const defaultDate = appointment ? appointment.date : App.formatDate(now);
        const defaultTime = appointment ? appointment.time : String(now.getHours() + 1).padStart(2, '0') + ':00';

        const body = document.getElementById('modalBody');

        body.innerHTML = `
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
                ${!isEditing && !reschedule ? `
                    <button class="btn btn-sm btn-outline-primary" onclick="Appointments.goBackToPatientStep()" title="Cambiar paciente">
                        <i class="bi bi-arrow-left me-1"></i>Cambiar
                    </button>
                ` : ''}
            </div>

            <form id="appointmentForm" onsubmit="Appointments.saveFromForm(event, '${this._wizard.appointmentId || ''}', ${reschedule})">
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label fw-semibold">
                            <i class="bi bi-calendar3 me-1"></i>Fecha *
                        </label>
                        <input type="date" class="form-control form-control-lg" id="aDate" required value="${defaultDate}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-semibold">
                            <i class="bi bi-clock me-1"></i>Hora *
                        </label>
                        <input type="time" class="form-control form-control-lg" id="aTime" required value="${defaultTime}">
                    </div>
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
                    <div class="col-md-6">
                        <label class="form-label fw-semibold">Motivo</label>
                        <input type="text" class="form-control" id="aReason"
                               value="${appointment ? (appointment.reason || '') : ''}"
                               placeholder="Consulta general, control, etc.">
                    </div>
                    <div class="col-12">
                        <label class="form-label fw-semibold">Notas internas</label>
                        <textarea class="form-control" id="aNotes" rows="2"
                                  placeholder="Notas privadas sobre el turno...">${appointment ? (appointment.notes || '') : ''}</textarea>
                    </div>
                </div>
            </form>`;

        document.getElementById('modalFooter').innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-primary btn-lg" form="appointmentForm">
                <i class="bi bi-check-circle me-2"></i>${isEditing ? 'Guardar Cambios' : 'Crear Turno'}
            </button>`;
    },

    async saveFromForm(event, appointmentId, reschedule) {
        event.preventDefault();

        reschedule = (reschedule === 'true' || reschedule === true);

        const { doc, setDoc, addDoc, collection } = window.firebaseExports;
        const db = window.firebaseDB;
        const uid = Auth.getUid();

        const data = {
            patientId: this._wizard.selectedPatientId,
            date: document.getElementById('aDate').value,
            time: document.getElementById('aTime').value,
            reason: document.getElementById('aReason').value.trim(),
            notes: document.getElementById('aNotes').value.trim()
        };

        const statusSelect = document.getElementById('aStatus');
        data.status = statusSelect ? statusSelect.value : 'scheduled';

        if (!data.patientId || !data.date || !data.time) {
            App.showToast('Completá paciente, fecha y hora', 'warning');
            return;
        }

        const appointments = await this.getAll();
        const conflict = appointments.find((a) =>
            a.date === data.date &&
            a.time === data.time &&
            a.status !== 'cancelled' &&
            a.id !== appointmentId
        );

        if (conflict) {
            const patient = await Patients.getById(conflict.patientId);
            App.showToast(
                `Ya hay un turno a las ${data.time} el ${App.formatDateHuman(data.date)}${patient ? ' con ' + patient.name : ''}`,
                'warning'
            );
            return;
        }

        try {
            if (appointmentId) {
                await setDoc(doc(db, 'users', uid, 'appointments', appointmentId), {
                    ...data,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
                App.showToast(reschedule ? 'Turno reprogramado' : 'Turno actualizado', 'success');
            } else {
                await addDoc(collection(db, 'users', uid, 'appointments'), {
                    ...data,
                    createdAt: new Date().toISOString()
                });
                App.showToast('Turno creado correctamente', 'success');
            }

            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            this.render();
        } catch (err) {
            console.error('[Appointments] Error saving:', err);
            App.showToast('Error al guardar el turno', 'danger');
        }
    },

    async changeStatus(appointmentId, newStatus) {
        const { doc, setDoc } = window.firebaseExports;
        const db = window.firebaseDB;
        const uid = Auth.getUid();

        try {
            await setDoc(doc(db, 'users', uid, 'appointments', appointmentId), {
                status: newStatus,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            const labels = {
                confirmed: 'confirmado',
                completed: 'realizado',
                cancelled: 'cancelado',
                scheduled: 'programado'
            };

            App.showToast(`Turno marcado como ${labels[newStatus] || newStatus}`, 'success');
            this.render();
        } catch (err) {
            console.error('[Appointments] Change status error:', err);
            App.showToast('Error al cambiar estado', 'danger');
        }
    },

    async cancel(appointmentId) {
        const appointment = await this.getById(appointmentId);
        if (!appointment) return;

        const apptDateTime = new Date(appointment.date + 'T' + appointment.time);
        const now = new Date();
        const diffMinutes = (apptDateTime - now) / (1000 * 60);

        if (diffMinutes < 30 && diffMinutes > 0) {
            const confirmed = confirm(
                `⚠️ ¡Atención!\n\n` +
                `Este turno es en ${Math.round(diffMinutes)} minutos.\n` +
                `Si lo cancelás ahora, el paciente podría no recibir el aviso a tiempo.\n\n` +
                `¿Estás seguro de que querés cancelarlo?`
            );
            if (!confirmed) return;
        }

        if (!confirm('¿Confirmás la cancelación de este turno?')) return;

        const patient = await Patients.getById(appointment.patientId);

        await this.changeStatus(appointmentId, 'cancelled');

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
