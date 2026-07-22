/*
 * ============================================================
 * PATIENTS.JS - GESTIÓN DE PACIENTES
 * ============================================================
 * Maneja todo lo relacionado con los pacientes/clientes:
 * - Crear nuevo paciente
 * - Editar paciente existente
 * - Eliminar (desactivar) paciente
 * - Buscar y filtrar
 * - Mostrar tarjetas con información de contacto
 * - Botón de WhatsApp directo
 *
 * Los datos se guardan en localStorage con la clave
 * 'misturnos_patients' como un array de objetos.
 * ============================================================
 */

const Patients = {

    // ============================================================
    // OBTENER DATOS
    // ============================================================

    /**
     * getAll()
     * Devuelve TODOS los pacientes del usuario actual.
     *
     * @returns {Array} Lista de pacientes
     */
    getAll() {
        return JSON.parse(localStorage.getItem('misturnos_patients') || '[]');
    },

    /**
     * getById(id)
     * Busca un paciente por su ID.
     *
     * @param {string} id - ID del paciente
     * @returns {object|null} Paciente encontrado o null
     */
    getById(id) {
        return this.getAll().find((p) => p.id === id) || null;
    },

    /**
     * save(patients)
     * Guarda la lista completa de pacientes en localStorage.
     *
     * @param {Array} patients - Array de pacientes
     */
    save(patients) {
        localStorage.setItem('misturnos_patients', JSON.stringify(patients));
    },

    // ============================================================
    // RENDERIZAR LISTA
    // ============================================================

    /**
     * render()
     * Dibuja la lista de pacientes en la página.
     * Se llama cada vez que se navega a la sección de pacientes.
     */
    render() {
        const patients = this.getAll();
        const container = document.getElementById('patientsList');

        // Si no hay pacientes, mostrar mensaje
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

        // Llenar el filtro de obras sociales (opciones únicas)
        this.populateInsuranceFilter(patients);

        // Renderizar las tarjetas de pacientes
        container.innerHTML = patients.map((patient) => this.renderCard(patient)).join('');
    },

    /**
     * renderCard(patient)
     * Genera el HTML de una tarjeta de paciente.
     *
     * @param {object} patient - Datos del paciente
     * @returns {string} HTML del card
     */
    renderCard(patient) {
        // Obtener las iniciales del nombre para el avatar
        const initials = patient.name
            .split(' ')
            .filter((w) => w.length > 2) // Filtrar preposiciones cortas
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

        // Color del badge de estado
        const statusClass = patient.status === 'active' ? 'bg-success' : 'bg-secondary';
        const statusText = patient.status === 'active' ? 'Activo' : 'Inactivo';

        return `
            <div class="col-sm-6 col-lg-4 col-xl-3">
                <div class="card patient-card border-0 shadow-sm h-100">
                    <div class="card-body">
                        <!-- Fila superior: Avatar + Nombre + Estado -->
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

                        <!-- Motivo de consulta -->
                        ${patient.reason ? `<p class="small text-muted mb-3 text-truncate"><i class="bi bi-chat-dots me-1"></i>${patient.reason}</p>` : ''}

                        <!-- Teléfono -->
                        ${patient.phone ? `<p class="small mb-3"><i class="bi bi-telephone me-1 text-primary"></i>${patient.phone}</p>` : ''}

                        <!-- Botones de acción -->
                        <div class="d-flex gap-2 flex-wrap">
                            <!-- WhatsApp -->
                            ${patient.phone ? `
                                <button class="btn-whatsapp" title="Enviar WhatsApp" onclick="App.openWhatsApp('${patient.phone}', 'Hola ${patient.name}, le escribimos desde MisTurnos.')">
                                    <i class="bi bi-whatsapp"></i>
                                </button>
                            ` : ''}

                            <!-- Crear turno rápido -->
                            <button class="btn btn-outline-primary btn-sm" title="Crear turno" onclick="Appointments.showModal(null, '${patient.id}')">
                                <i class="bi bi-calendar-plus"></i>
                            </button>

                            <!-- Editar -->
                            <button class="btn btn-outline-secondary btn-sm" title="Editar" onclick="Patients.showModal('${patient.id}')">
                                <i class="bi bi-pencil"></i>
                            </button>

                            <!-- Desactivar/Activar -->
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

    // ============================================================
    // FILTROS Y BÚSQUEDA
    // ============================================================

    /**
     * filter()
     * Filtra la lista de pacientes según los criterios de búsqueda.
     * Se ejecuta cada vez que el usuario escribe en la barra de búsqueda
     * o cambia un filtro.
     */
    filter() {
        const searchTerm = document.getElementById('patientSearch').value.toLowerCase();
        const statusFilter = document.getElementById('patientStatusFilter').value;
        const insuranceFilter = document.getElementById('patientInsuranceFilter').value;

        let patients = this.getAll();

        // Filtrar por texto de búsqueda (nombre, teléfono, email)
        if (searchTerm) {
            patients = patients.filter((p) =>
                p.name.toLowerCase().includes(searchTerm) ||
                (p.phone && p.phone.includes(searchTerm)) ||
                (p.email && p.email.toLowerCase().includes(searchTerm))
            );
        }

        // Filtrar por estado
        if (statusFilter !== 'all') {
            patients = patients.filter((p) => p.status === statusFilter);
        }

        // Filtrar por obra social
        if (insuranceFilter !== 'all') {
            patients = patients.filter((p) => p.insurance === insuranceFilter);
        }

        // Renderizar solo los que pasaron el filtro
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

    /**
     * populateInsuranceFilter(patients)
     * Llena el select de obras sociales con las opciones únicas
     * que existen entre los pacientes.
     */
    populateInsuranceFilter(patients) {
        const select = document.getElementById('patientInsuranceFilter');
        // Obtener obras sociales únicas (sin repetir)
        const insurances = [...new Set(patients.map((p) => p.insurance).filter(Boolean))].sort();

        // Mantener la opción "Todas" y agregar las demás
        select.innerHTML = '<option value="all">Todas las obras sociales</option>' +
            insurances.map((i) => `<option value="${i}">${i}</option>`).join('');
    },

    // ============================================================
    // MODAL PARA CREAR / EDITAR
    // ============================================================

    /**
     * showModal(patientId = null)
     * Abre el modal con el formulario para crear o editar un paciente.
     *
     * @param {string|null} patientId - ID del paciente a editar (null para crear nuevo)
     */
    showModal(patientId = null) {
        const isEditing = patientId !== null;
        const patient = isEditing ? this.getById(patientId) : null;

        // Título del modal
        document.getElementById('modalTitle').textContent = isEditing ? 'Editar Paciente' : 'Nuevo Paciente';

        // Construir el formulario HTML
        document.getElementById('modalBody').innerHTML = `
            <form id="patientForm" onsubmit="Patients.saveFromForm(event, '${patientId || ''}')">
                <div class="row g-3">
                    <!-- Nombre completo -->
                    <div class="col-md-6">
                        <label class="form-label">Nombre completo *</label>
                        <input type="text" class="form-control" id="pName" required
                               value="${patient ? patient.name : ''}" placeholder="Juan Pérez">
                    </div>

                    <!-- Teléfono -->
                    <div class="col-md-6">
                        <label class="form-label">Teléfono *</label>
                        <input type="tel" class="form-control" id="pPhone" required
                               value="${patient ? patient.phone : ''}" placeholder="+54 9 11 1234-5678">
                    </div>

                    <!-- Email -->
                    <div class="col-md-6">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-control" id="pEmail"
                               value="${patient ? (patient.email || '') : ''}" placeholder="paciente@email.com">
                    </div>

                    <!-- Obra social -->
                    <div class="col-md-6">
                        <label class="form-label">Obra social / Prepaga</label>
                        <input type="text" class="form-control" id="pInsurance"
                               value="${patient ? (patient.insurance || '') : ''}" placeholder="OSDE, Swiss Medical, etc.">
                    </div>

                    <!-- Estado -->
                    <div class="col-md-6">
                        <label class="form-label">Estado</label>
                        <select class="form-select" id="pStatus">
                            <option value="active" ${patient && patient.status === 'active' ? 'selected' : ''}>Activo</option>
                            <option value="inactive" ${patient && patient.status === 'inactive' ? 'selected' : ''}>Inactivo</option>
                        </select>
                    </div>

                    <!-- Motivo de consulta -->
                    <div class="col-12">
                        <label class="form-label">Motivo de consulta / Descripción</label>
                        <textarea class="form-control" id="pReason" rows="3"
                                  placeholder="Breve descripción del motivo de consulta...">${patient ? (patient.reason || '') : ''}</textarea>
                    </div>
                </div>
            </form>`;

        // Botón de guardar en el footer del modal
        document.getElementById('modalFooter').innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-primary" form="patientForm">
                <i class="bi bi-check-circle me-2"></i>${isEditing ? 'Guardar Cambios' : 'Crear Paciente'}
            </button>`;

        // Abrir el modal con Bootstrap
        const modal = new bootstrap.Modal(document.getElementById('appModal'));
        modal.show();
    },

    // ============================================================
    // GUARDAR PACIENTE
    // ============================================================

    /**
     * saveFromForm(event, patientId)
     * Toma los datos del formulario y crea o actualiza un paciente.
     *
     * @param {Event} event - Evento del formulario
     * @param {string} patientId - ID del paciente (vacío si es nuevo)
     */
    saveFromForm(event, patientId) {
        event.preventDefault();

        // Obtener valores del formulario
        const data = {
            name: document.getElementById('pName').value.trim(),
            phone: document.getElementById('pPhone').value.trim(),
            email: document.getElementById('pEmail').value.trim(),
            insurance: document.getElementById('pInsurance').value.trim(),
            status: document.getElementById('pStatus').value,
            reason: document.getElementById('pReason').value.trim()
        };

        // Validaciones básicas
        if (!data.name || !data.phone) {
            App.showToast('Nombre y teléfono son obligatorios', 'warning');
            return;
        }

        // Obtener la lista actual de pacientes
        const patients = this.getAll();

        if (patientId) {
            // ---- MODO EDICIÓN: actualizar un paciente existente ----
            const index = patients.findIndex((p) => p.id === patientId);
            if (index !== -1) {
                // Mantener los datos originales (id, fecha de creación)
                // y sobreescribir solo los campos editados
                patients[index] = {
                    ...patients[index],   // Copiar todos los campos existentes
                    ...data,              // Sobreescribir con los nuevos valores
                    updatedAt: new Date().toISOString()
                };
                App.showToast('Paciente actualizado correctamente', 'success');
            }
        } else {
            // ---- MODO CREACIÓN: nuevo paciente ----
            const newPatient = {
                id: App.generateId(),
                ...data,
                createdAt: new Date().toISOString()
            };
            patients.push(newPatient);
            App.showToast('Paciente creado correctamente', 'success');
        }

        // Guardar en localStorage
        this.save(patients);

        // Cerrar el modal
        bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();

        // Actualizar la lista en pantalla
        this.render();
    },

    // ============================================================
    // CREACIÓN RÁPIDA (desde el wizard de turnos)
    // ============================================================

    /**
     * quickCreate(event, callback)
     * Crea un paciente con solo nombre y teléfono (los datos mínimos).
     * Se usa dentro del wizard de turnos para no interrumpir el flujo.
     *
     * @param {Event} event - Evento del formulario
     * @param {function} callback - Función que se ejecuta al crear el paciente,
     *                               recibe el ID del nuevo paciente como parámetro
     */
    quickCreate(event, callback) {
        event.preventDefault();

        const name = document.getElementById('qcName').value.trim();
        const phone = document.getElementById('qcPhone').value.trim();

        if (!name || !phone) {
            App.showToast('Nombre y teléfono son obligatorios', 'warning');
            return;
        }

        // Crear el paciente con los datos mínimos
        const newPatient = {
            id: App.generateId(),
            name: name,
            phone: phone,
            email: '',
            insurance: '',
            status: 'active',
            reason: '',
            createdAt: new Date().toISOString()
        };

        // Guardar en localStorage
        const patients = this.getAll();
        patients.push(newPatient);
        this.save(patients);

        App.showToast(`${name} creado correctamente`, 'success');

        // Ejecutar el callback con el ID del nuevo paciente
        if (typeof callback === 'function') {
            callback(newPatient.id);
        }
    },

    // ============================================================
    // CAMBIAR ESTADO (ACTIVO / INACTIVO)
    // ============================================================

    /**
     * toggleStatus(patientId)
     * Cambia el estado de un paciente entre activo e inactivo.
     *
     * @param {string} patientId - ID del paciente
     */
    toggleStatus(patientId) {
        const patients = this.getAll();
        const patient = patients.find((p) => p.id === patientId);

        if (!patient) return;

        // Cambiar el estado
        patient.status = patient.status === 'active' ? 'inactive' : 'active';
        patient.updatedAt = new Date().toISOString();

        // Guardar
        this.save(patients);

        App.showToast(
            `${patient.name} ahora está ${patient.status === 'active' ? 'activo' : 'inactivo'}`,
            'info'
        );

        // Actualizar la vista
        this.render();
    }
};
