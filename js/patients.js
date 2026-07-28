/*
 * PATIENTS.JS - Firestore
 */

const Patients = {

    _cache: [],

    async getAll() {
        const uid = Auth.getUid();
        if (!uid) return [];

        const { collection, getDocs } = window.firebaseExports;
        const db = window.firebaseDB;

        try {
            const snapshot = await getDocs(collection(db, 'users', uid, 'patients'));
            this._cache = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            return this._cache;
        } catch (err) {
            console.error('[Patients] Error getting patients:', err);
            return this._cache;
        }
    },

    async getById(id) {
        const patients = await this.getAll();
        return patients.find((p) => p.id === id) || null;
    },

    async render() {
        const patients = await this.getAll();
        const container = document.getElementById('patientsList');

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
        container.innerHTML = patients.map((patient) => this.renderCard(patient)).join('');
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
                <div class="card patient-card border-0 shadow-sm h-100">
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
                        <div class="d-flex gap-2 flex-wrap">
                            ${patient.phone ? `
                                <button class="btn-whatsapp" title="Enviar WhatsApp" onclick="App.openWhatsApp('${patient.phone}', 'Hola ${patient.name}, le escribimos desde MisTurnos.')">
                                    <i class="bi bi-whatsapp"></i>
                                </button>
                            ` : ''}
                            <button class="btn btn-outline-primary btn-sm" title="Crear turno" onclick="Appointments.showModal(null, '${patient.id}')">
                                <i class="bi bi-calendar-plus"></i>
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" title="Editar" onclick="Patients.showModal('${patient.id}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" title="Eliminar" onclick="Patients.delete('${patient.id}', '${patient.name.replace(/'/g, "\\'")}')">
                                <i class="bi bi-trash"></i>
                            </button>
                            <button class="btn btn-outline-${patient.status === 'active' ? 'warning' : 'success'} btn-sm"
                                    title="${patient.status === 'active' ? 'Desactivar' : 'Activar'}"
                                    onclick="Patients.toggleStatus('${patient.id}')">
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

        const container = document.getElementById('patientsList');
        if (patients.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center text-muted py-5">
                    <i class="bi bi-search fs-1 d-block mb-2"></i>
                    No se encontraron pacientes con esos filtros
                </div>`;
        } else {
            container.innerHTML = patients.map((p) => this.renderCard(p)).join('');
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
            name: document.getElementById('pName').value.trim(),
            phone: document.getElementById('pPhone').value.trim(),
            email: document.getElementById('pEmail').value.trim(),
            insurance: document.getElementById('pInsurance').value.trim(),
            status: document.getElementById('pStatus').value,
            reason: document.getElementById('pReason').value.trim(),
            cardiac: document.getElementById('pCardiac').value,
            cardiacDetail: document.getElementById('pCardiacDetail').value.trim(),
            diseases: document.getElementById('pDiseases').value.trim(),
            allergies: document.getElementById('pAllergies').value.trim(),
            medication: document.getElementById('pMedication').value.trim(),
            observations: document.getElementById('pObservations').value.trim()
        };

        if (!data.name || !data.phone) {
            App.showToast('Nombre y teléfono son obligatorios', 'warning');
            return;
        }

        try {
            if (patientId) {
                await setDoc(doc(db, 'users', uid, 'patients', patientId), {
                    ...data,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
                App.showToast('Paciente actualizado correctamente', 'success');
            } else {
                await addDoc(collection(db, 'users', uid, 'patients'), {
                    ...data,
                    createdAt: new Date().toISOString()
                });
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

            App.showToast(`${patient.name} ahora está ${newStatus === 'active' ? 'activo' : 'inactivo'}`, 'info');
            this.render();
        } catch (err) {
            console.error('[Patients] Toggle status error:', err);
            App.showToast('Error al cambiar estado', 'danger');
        }
    },

    async delete(patientId, patientName) {
        if (!confirm(`¿Eliminar a ${patientName}? Esta acción no se puede deshacer.`)) return;

        const { doc, deleteDoc } = window.firebaseExports;
        const db = window.firebaseDB;
        const uid = Auth.getUid();

        try {
            await deleteDoc(doc(db, 'users', uid, 'patients', patientId));
            App.showToast(`${patientName} eliminado`, 'success');
            this.render();
        } catch (err) {
            console.error('[Patients] Delete error:', err);
            App.showToast('Error al eliminar paciente', 'danger');
        }
    }
};
