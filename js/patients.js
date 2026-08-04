/*
 * MisTurnos - © 2026 Sebastián Russo
 * Todos los derechos reservados.
 *
 * PATIENTS.JS - Firestore
 */

const Patients = {

    _currentPage: 1,
    _perPage: 20,

    async getAll() {
        const uid = Auth.getUid();
        if (!uid) return [];

        const cached = Cache.get(`patients_${uid}`);
        if (cached) return cached;

        const { collection, getDocs } = window.firebaseExports;
        const db = window.firebaseDB;

        try {
            const snapshot = await getDocs(collection(db, 'users', uid, 'patients'));
            const patients = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            Cache.set(`patients_${uid}`, patients);
            return patients;
        } catch (err) {
            console.error('[Patients] Error getting patients:', err);
            return [];
        }
    },

    async getById(id) {
        const patients = await this.getAll();
        return patients.find((p) => p.id === id) || null;
    },

    async render() {
        const container = document.getElementById('patientsList');
        App.showSkeleton(container, 'cards');

        const patients = await this.getAll();

        if (patients.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center text-muted py-5">
                    <i class="bi bi-person-plus fs-1 d-block mb-2"></i>
                    <p class="mb-2">No hay pacientes registrados</p>
                    <button class="btn btn-primary btn-sm" onclick="Patients.showModal()">
                        <i class="bi bi-plus-circle me-1"></i>Agregar primer paciente
                    </button>
                </div>`;
            return;
        }

        this.populateInsuranceFilter(patients);
        this._allPatients = patients;
        this._currentPage = 1;
        this.renderPage();
    },

    renderPage() {
        const patients = this._allPatients || [];
        const container = document.getElementById('patientsList');
        const totalPages = Math.ceil(patients.length / this._perPage);
        const start = (this._currentPage - 1) * this._perPage;
        const pagePatients = patients.slice(start, start + this._perPage);

        let html = pagePatients.map((patient) => this.renderCard(patient)).join('');

        if (totalPages > 1) {
            html += `
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mt-3 py-2">
                        <small class="text-muted">Mostrando ${start + 1}-${Math.min(start + this._perPage, patients.length)} de ${patients.length} pacientes</small>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-secondary" ${this._currentPage === 1 ? 'disabled' : ''} onclick="Patients.goToPage(${this._currentPage - 1})">
                                <i class="bi bi-chevron-left"></i>
                            </button>
                            <button class="btn btn-outline-secondary" disabled>Página ${this._currentPage} de ${totalPages}</button>
                            <button class="btn btn-outline-secondary" ${this._currentPage === totalPages ? 'disabled' : ''} onclick="Patients.goToPage(${this._currentPage + 1})">
                                <i class="bi bi-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>`;
        }

        container.innerHTML = html;
    },

    goToPage(page) {
        this._currentPage = page;
        this.renderPage();
        document.getElementById('patientsList').scrollIntoView({ behavior: 'smooth' });
    },

    renderCard(patient) {
        const initials = patient.name
            .split(' ')
            .filter((w) => w.length > 2)
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

        const statusClass = patient.status === 'active' ? 'bg-success' : 'bg-secondary';
        const statusText = patient.status === 'active' ? 'Activo' : 'Inactivo';

        return `
            <div class="col-sm-6 col-lg-4 col-xl-3">
                <div class="card patient-card border-0 shadow-sm h-100" onclick="Patients.showDetail('${patient.id}')">
                    <div class="card-body">
                        <div class="d-flex align-items-start mb-3">
                            <div class="patient-avatar me-3">${initials}</div>
                            <div class="flex-grow-1 min-width-0">
                                <h6 class="card-title fw-bold mb-0 text-truncate" title="${patient.name}">
                                    ${patient.name}
                                </h6>
                                <small class="text-muted">${patient.email || 'Sin email'}</small>
                                <div class="mt-1">
                                    <span class="badge ${statusClass}">${statusText}</span>
                                    ${patient.insurance ? `<span class="badge bg-light text-dark">${patient.insurance}</span>` : ''}
                                </div>
                            </div>
                        </div>
                        ${patient.reason ? `<p class="small text-muted mb-3 text-truncate"><i class="bi bi-chat-dots me-1"></i>${patient.reason}</p>` : ''}
                        ${patient.phone ? `<p class="small mb-3"><i class="bi bi-telephone me-1 text-primary"></i>${patient.phone}</p>` : ''}
                        <div class="d-flex gap-2 flex-wrap" onclick="event.stopPropagation()">
                            ${patient.phone ? `
                                <button class="btn-whatsapp" title="Enviar WhatsApp" onclick="event.stopPropagation(); App.openWhatsApp('${patient.phone}', 'Hola ${patient.name}, le escribimos desde MisTurnos.')">
                                    <i class="bi bi-whatsapp"></i>
                                </button>
                            ` : ''}
                            <button class="btn btn-outline-primary btn-sm" title="Crear turno" onclick="event.stopPropagation(); Appointments.showModal(null, '${patient.id}')">
                                <i class="bi bi-calendar-plus"></i>
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" title="Editar" onclick="event.stopPropagation(); Patients.showModal('${patient.id}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" title="Eliminar" onclick="event.stopPropagation(); Patients.delete('${patient.id}', '${patient.name.replace(/'/g, "\\'")}')">
                                <i class="bi bi-trash"></i>
                            </button>
                            <button class="btn btn-outline-${patient.status === 'active' ? 'warning' : 'success'} btn-sm"
                                    title="${patient.status === 'active' ? 'Desactivar' : 'Activar'}"
                                    onclick="event.stopPropagation(); Patients.toggleStatus('${patient.id}')">
                                <i class="bi bi-${patient.status === 'active' ? 'pause-circle' : 'play-circle'}"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    async filter() {
        const searchTerm = document.getElementById('patientSearch').value.toLowerCase();
        const statusFilter = document.getElementById('patientStatusFilter').value;
        const insuranceFilter = document.getElementById('patientInsuranceFilter').value;

        let patients = await this.getAll();

        if (searchTerm) {
            patients = patients.filter((p) =>
                p.name.toLowerCase().includes(searchTerm) ||
                (p.phone && p.phone.includes(searchTerm)) ||
                (p.email && p.email.toLowerCase().includes(searchTerm))
            );
        }

        if (statusFilter !== 'all') {
            patients = patients.filter((p) => p.status === statusFilter);
        }

        if (insuranceFilter !== 'all') {
            patients = patients.filter((p) => p.insurance === insuranceFilter);
        }

        this._allPatients = patients;
        this._currentPage = 1;

        const container = document.getElementById('patientsList');
        if (patients.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center text-muted py-5">
                    <i class="bi bi-search fs-1 d-block mb-2"></i>
                    No se encontraron pacientes con esos filtros
                </div>`;
        } else {
            this.renderPage();
        }
    },

    populateInsuranceFilter(patients) {
        const select = document.getElementById('patientInsuranceFilter');
        const insurances = [...new Set(patients.map((p) => p.insurance).filter(Boolean))].sort();
        select.innerHTML = '<option value="all">Todas las obras sociales</option>' +
            insurances.map((i) => `<option value="${i}">${i}</option>`).join('');
    },

    showModal(patientId = null) {
        const isEditing = patientId !== null;

        document.getElementById('modalTitle').textContent = isEditing ? 'Editar Paciente' : 'Nuevo Paciente';

        let patient = null;
        if (isEditing) {
            this.getById(patientId).then((p) => {
                patient = p;
            });
        }

        document.getElementById('modalBody').innerHTML = `
            <form id="patientForm" onsubmit="Patients.saveFromForm(event, '${patientId || ''}')">
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Nombre completo *</label>
                        <input type="text" class="form-control" id="pName" required placeholder="Juan Pérez">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Teléfono *</label>
                        <input type="tel" class="form-control" id="pPhone" required placeholder="+54 9 11 1234-5678">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-control" id="pEmail" placeholder="paciente@email.com">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Obra social / Prepaga</label>
                        <input type="text" class="form-control" id="pInsurance" placeholder="OSDE, Swiss Medical, etc.">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Estado</label>
                        <select class="form-select" id="pStatus">
                            <option value="active">Activo</option>
                            <option value="inactive">Inactivo</option>
                        </select>
                    </div>
                    <div class="col-12">
                        <label class="form-label">Motivo de consulta / Descripción</label>
                        <textarea class="form-control" id="pReason" rows="3" placeholder="Breve descripción del motivo de consulta..."></textarea>
                    </div>

                    <!-- Datos médicos -->
                    <div class="col-12">
                        <h6 class="fw-bold text-muted mt-3"><i class="bi bi-heart-pulse me-2"></i>Datos Médicos</h6>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Cardiopatía</label>
                        <select class="form-select" id="pCardiac">
                            <option value="no">No</option>
                            <option value="si">Sí</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Detalle cardiopatía</label>
                        <input type="text" class="form-control" id="pCardiacDetail" placeholder="Ej: Arritmia, insuficiencia...">
                    </div>
                    <div class="col-12">
                        <label class="form-label">Enfermedades</label>
                        <textarea class="form-control" id="pDiseases" rows="2" placeholder="Ej: Diabetes tipo 2, hipertensión..."></textarea>
                    </div>
                    <div class="col-12">
                        <label class="form-label">Alergias</label>
                        <textarea class="form-control" id="pAllergies" rows="2" placeholder="Ej: Penicilina, látex..."></textarea>
                    </div>
                    <div class="col-12">
                        <label class="form-label">Medicación actual</label>
                        <textarea class="form-control" id="pMedication" rows="2" placeholder="Ej: Losartán 50mg, Aspirina..."></textarea>
                    </div>
                    <div class="col-12">
                        <label class="form-label">Observaciones</label>
                        <textarea class="form-control" id="pObservations" rows="2" placeholder="Otras observaciones relevantes..."></textarea>
                    </div>
                </div>
            </form>`;

        document.getElementById('modalFooter').innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-primary" form="patientForm">
                <i class="bi bi-check-circle me-2"></i>${isEditing ? 'Guardar Cambios' : 'Crear Paciente'}
            </button>`;

        const modal = new bootstrap.Modal(document.getElementById('appModal'));
        modal.show();

        if (isEditing && patientId) {
            this.getById(patientId).then((p) => {
                if (p) {
                    document.getElementById('pName').value = p.name || '';
                    document.getElementById('pPhone').value = p.phone || '';
                    document.getElementById('pEmail').value = p.email || '';
                    document.getElementById('pInsurance').value = p.insurance || '';
                    document.getElementById('pStatus').value = p.status || 'active';
                    document.getElementById('pReason').value = p.reason || '';
                    document.getElementById('pCardiac').value = p.cardiac || 'no';
                    document.getElementById('pCardiacDetail').value = p.cardiacDetail || '';
                    document.getElementById('pDiseases').value = p.diseases || '';
                    document.getElementById('pAllergies').value = p.allergies || '';
                    document.getElementById('pMedication').value = p.medication || '';
                    document.getElementById('pObservations').value = p.observations || '';
                }
            });
        }
    },

    async saveFromForm(event, patientId) {
        event.preventDefault();

        const { doc, setDoc, addDoc, collection } = window.firebaseExports;
        const db = window.firebaseDB;
        const uid = Auth.getUid();

        const data = {
            name: App.sanitize(document.getElementById('pName').value.trim()),
            phone: App.sanitize(document.getElementById('pPhone').value.trim()),
            email: App.sanitize(document.getElementById('pEmail').value.trim()),
            insurance: App.sanitize(document.getElementById('pInsurance').value.trim()),
            status: document.getElementById('pStatus').value,
            reason: App.sanitize(document.getElementById('pReason').value.trim()),
            cardiac: document.getElementById('pCardiac').value,
            cardiacDetail: App.sanitize(document.getElementById('pCardiacDetail').value.trim()),
            diseases: App.sanitize(document.getElementById('pDiseases').value.trim()),
            allergies: App.sanitize(document.getElementById('pAllergies').value.trim()),
            medication: App.sanitize(document.getElementById('pMedication').value.trim()),
            observations: App.sanitize(document.getElementById('pObservations').value.trim())
        };

        if (!data.name || !data.phone) {
            App.showToast('Nombre y teléfono son obligatorios', 'warning');
            return;
        }

        if (!patientId) {
            const canAdd = await Billing.canAddPatient(uid);
            if (!canAdd) {
                Billing.showUpgradeModal('limit_reached');
                return;
            }
        }

        try {
            if (patientId) {
                await setDoc(doc(db, 'users', uid, 'patients', patientId), {
                    ...data,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
                Cache.invalidate(`patients_${uid}`);
                App.showToast('Paciente actualizado correctamente', 'success');
            } else {
                await addDoc(collection(db, 'users', uid, 'patients'), {
                    ...data,
                    createdAt: new Date().toISOString()
                });
                Cache.invalidate(`patients_${uid}`);
                App.showToast('Paciente creado correctamente', 'success');
            }

            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            this.render();
        } catch (err) {
            console.error('[Patients] Error saving:', err);
            App.showToast('Error al guardar el paciente', 'danger');
        }
    },

    async quickCreate(event, callback) {
        event.preventDefault();

        const { addDoc, collection } = window.firebaseExports;
        const db = window.firebaseDB;
        const uid = Auth.getUid();

        const name = document.getElementById('qcName').value.trim();
        const phone = document.getElementById('qcPhone').value.trim();

        if (!name || !phone) {
            App.showToast('Nombre y teléfono son obligatorios', 'warning');
            return;
        }

        const canAdd = await Billing.canAddPatient(uid);
        if (!canAdd) {
            Billing.showUpgradeModal('limit_reached');
            return;
        }

        try {
            const docRef = await addDoc(collection(db, 'users', uid, 'patients'), {
                name: name,
                phone: phone,
                email: '',
                insurance: '',
                status: 'active',
                reason: '',
                createdAt: new Date().toISOString()
            });

            Cache.invalidate(`patients_${uid}`);
            App.showToast(`${name} creado correctamente`, 'success');

            if (typeof callback === 'function') {
                callback(docRef.id);
            }
        } catch (err) {
            console.error('[Patients] Quick create error:', err);
            App.showToast('Error al crear el paciente', 'danger');
        }
    },

    async toggleStatus(patientId) {
        const { doc, setDoc } = window.firebaseExports;
        const db = window.firebaseDB;
        const uid = Auth.getUid();

        const patients = await this.getAll();
        const patient = patients.find((p) => p.id === patientId);

        if (!patient) return;

        const newStatus = patient.status === 'active' ? 'inactive' : 'active';

        try {
            await setDoc(doc(db, 'users', uid, 'patients', patientId), {
                status: newStatus,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            Cache.invalidate(`patients_${uid}`);
            App.showToast(`${patient.name} ahora está ${newStatus === 'active' ? 'activo' : 'inactivo'}`, 'info');
            this.render();
        } catch (err) {
            console.error('[Patients] Toggle status error:', err);
            App.showToast('Error al cambiar estado', 'danger');
        }
    },

    async delete(patientId, patientName) {
        const confirmed = await App.confirmAction(
            `¿Eliminar a ${patientName}? Esta acción no se puede deshacer.`,
            { confirmText: 'Eliminar', confirmColor: 'danger' }
        );
        if (!confirmed) return;

        const { doc, deleteDoc } = window.firebaseExports;
        const db = window.firebaseDB;
        const uid = Auth.getUid();

        try {
            await deleteDoc(doc(db, 'users', uid, 'patients', patientId));
            Cache.invalidate(`patients_${uid}`);
            App.showToast(`${patientName} eliminado`, 'success');
            this.render();
        } catch (err) {
            console.error('[Patients] Delete error:', err);
            App.showToast('Error al eliminar paciente', 'danger');
        }
    },

    async showDetail(patientId) {
        App.navigate('patient-detail', { isSubPage: true });

        const container = document.getElementById('page-patient-detail');
        const content = container.querySelector('.detail-content');
        App.showSkeleton(content, 'stats');

        const patient = await this.getById(patientId);
        if (!patient) {
            container.querySelector('.detail-content').innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="bi bi-person-x fs-1 d-block mb-2"></i>
                    Paciente no encontrado
                </div>`;
            return;
        }

        const appointments = (await Appointments.getAll())
            .filter(a => a.patientId === patientId)
            .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

        const initials = patient.name
            .split(' ')
            .filter((w) => w.length > 2)
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

        const statusClass = patient.status === 'active' ? 'bg-success' : 'bg-secondary';
        const statusText = patient.status === 'active' ? 'Activo' : 'Inactivo';

        const renderInfoRow = (label, value, icon) => {
            if (!value) return '';
            return `
                <div class="detail-info-row">
                    <span class="detail-info-label"><i class="bi ${icon} me-1"></i>${label}</span>
                    <span class="detail-info-value">${value}</span>
                </div>`;
        };

        let appointmentsHtml = '';
        if (appointments.length === 0) {
            appointmentsHtml = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-calendar-x d-block mb-2 fs-4"></i>
                    No hay turnos registrados
                </div>`;
        } else {
            appointmentsHtml = appointments.slice(0, 10).map(a => {
                const statusBadge = `<span class="badge badge-status badge-${a.status}">${Appointments.getStatusLabel(a.status)}</span>`;
                return `
                    <div class="d-flex justify-content-between align-items-center py-2 border-bottom" style="border-color: var(--border-color) !important;">
                        <div>
                            <span class="fw-semibold">${App.formatDateShort(a.date)}</span>
                            <span class="ms-2 text-muted">${a.time}</span>
                            ${a.reason ? `<span class="ms-2 small text-muted">${a.reason}</span>` : ''}
                        </div>
                        ${statusBadge}
                    </div>`;
            }).join('');
            if (appointments.length > 10) {
                appointmentsHtml += `
                    <div class="text-center py-2">
                        <small class="text-muted">Mostrando 10 de ${appointments.length} turnos</small>
                    </div>`;
            }
        }

        container.querySelector('.detail-content').innerHTML = `
            <div class="detail-header">
                <div class="detail-avatar">${initials}</div>
                <div class="flex-grow-1">
                    <h3 class="fw-bold mb-1">${patient.name}</h3>
                    <span class="badge ${statusClass}">${statusText}</span>
                    ${patient.insurance ? `<span class="badge bg-light text-dark ms-1">${patient.insurance}</span>` : ''}
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary btn-sm" onclick="Appointments.showModal(null, '${patient.id}')">
                        <i class="bi bi-calendar-plus me-1"></i>Nuevo Turno
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="Patients.showModal('${patient.id}')">
                        <i class="bi bi-pencil me-1"></i>Editar
                    </button>
                </div>
            </div>

            <div class="row g-4">
                <div class="col-lg-6">
                    <div class="card border-0 shadow-sm mb-4">
                        <div class="card-body">
                            <h6 class="detail-section-title">Información de Contacto</h6>
                            ${renderInfoRow('Teléfono', patient.phone, 'bi-telephone')}
                            ${renderInfoRow('Email', patient.email, 'bi-envelope')}
                            ${renderInfoRow('Motivo', patient.reason, 'bi-chat-dots')}
                        </div>
                    </div>

                    <div class="card border-0 shadow-sm">
                        <div class="card-body">
                            <h6 class="detail-section-title">Información Médica</h6>
                            ${patient.cardiac === 'si' ? renderInfoRow('Cardiopatía', patient.cardiacDetail || 'Sí', 'bi-heart-pulse') : ''}
                            ${renderInfoRow('Enfermedades', patient.diseases, 'bi-activity')}
                            ${renderInfoRow('Alergias', patient.allergies, 'bi-exclamation-triangle')}
                            ${renderInfoRow('Medicación', patient.medication, 'bi-capsule')}
                            ${renderInfoRow('Observaciones', patient.observations, 'bi-sticky')}
                            ${!patient.cardiac && !patient.diseases && !patient.allergies && !patient.medication && !patient.observations ?
                                '<div class="text-muted small">Sin información médica cargada</div>' : ''}
                        </div>
                    </div>
                </div>

                <div class="col-lg-6">
                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-transparent">
                            <h6 class="fw-bold mb-0"><i class="bi bi-calendar3 me-2"></i>Turnos Recientes</h6>
                        </div>
                        <div class="card-body">
                            ${appointmentsHtml}
                        </div>
                    </div>
                </div>
            </div>`;
    }
};
