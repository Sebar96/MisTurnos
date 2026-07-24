/*
 * MESSAGES.JS - Mensajes WhatsApp prearmados
 */

const Messages = {

    templates: {
        confirm: {
            label: 'Confirmar turno',
            icon: 'bi-check-circle',
            color: 'success',
            template: (patientName, date, time, professionalName) =>
                `Hola ${patientName}, le confirmamos su turno del ${App.formatDateHuman(date)} a las ${time} con ${professionalName}.\n\nPor favor, confirme su asistencia.\n\n¡Lo esperamos!`
        },
        reschedule: {
            label: 'Reprogramar turno',
            icon: 'bi-arrow-repeat',
            color: 'warning',
            template: (patientName, date, time, professionalName) =>
                `Hola ${patientName}, le informamos que su turno del ${App.formatDateHuman(date)} a las ${time} con ${professionalName} necesita ser reprogramado.\n\nPor favor, comuníquese con nosotros para acordar una nueva fecha y hora.\n\nDisculpe las molestias.`
        },
        cancelByProfessional: {
            label: 'Cancelar turno (yo cancelo)',
            icon: 'bi-x-circle',
            color: 'danger',
            template: (patientName, date, time, professionalName) =>
                `Hola ${patientName}, le informamos que su turno del ${App.formatDateHuman(date)} a las ${time} con ${professionalName} ha sido cancelado.\n\nSi desea reprogramar, por favor comuníquese con nosotros.\n\nDisculpe las molestias.`
        },
        cancelByPatient: {
            label: 'Cancelar turno (paciente cancela)',
            icon: 'bi-person-x',
            color: 'secondary',
            template: (patientName, date, time, professionalName) =>
                `Hola ${professionalName}, le informamos que ${patientName} ha cancelado su turno del ${App.formatDateHuman(date)} a las ${time}.\n\nEl turno ha sido liberado.`
        },
        reminder: {
            label: 'Recordatorio',
            icon: 'bi-bell',
            color: 'info',
            template: (patientName, date, time, professionalName) =>
                `Hola ${patientName}, le recordamos que tiene un turno mañana ${App.formatDateHuman(date)} a las ${time} con ${professionalName}.\n\nSi necesita reprogramar, por favor comuníquese con anticipación.\n\n¡Lo esperamos!`
        }
    },

    /**
     * showModal(appointmentId)
     * Muestra el modal con los mensajes prearmados para un turno.
     */
    async showModal(appointmentId) {
        const appointment = await Appointments.getById(appointmentId);
        if (!appointment) {
            App.showToast('Turno no encontrado', 'danger');
            return;
        }

        const patient = await Patients.getById(appointment.patientId);
        const user = Auth.getCurrentUser();

        if (!patient || !user) {
            App.showToast('Error al cargar datos', 'danger');
            return;
        }

        const patientName = patient.name;
        const professionalName = user.name || 'el profesional';
        const date = appointment.date;
        const time = appointment.time;

        document.getElementById('modalTitle').textContent = `Mensajes WhatsApp - ${patientName}`;

        let html = `
            <div class="mb-3">
                <p class="text-muted mb-2">Seleccioná un mensaje y copialo para enviar por WhatsApp:</p>
                <div class="d-flex align-items-center p-2 rounded bg-light mb-3">
                    <i class="bi bi-person me-2"></i>
                    <strong>${patientName}</strong>
                    <span class="ms-2 text-muted">•</span>
                    <span class="ms-2">${App.formatDateHuman(date)} ${time}</span>
                </div>
            </div>
            <div class="d-grid gap-2">`;

        for (const [key, msg] of Object.entries(this.templates)) {
            const messageText = msg.template(patientName, date, time, professionalName);
            html += `
                <div class="card border-${msg.color}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <h6 class="card-title fw-bold text-${msg.color} mb-2">
                                    <i class="bi ${msg.icon} me-1"></i>${msg.label}
                                </h6>
                                <p class="card-text small text-muted mb-2" style="white-space: pre-line;">${messageText}</p>
                            </div>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-${msg.color} btn-sm" onclick="Messages.copyToClipboard(this, '${key}', '${patientName}', '${date}', '${time}', '${professionalName}')">
                                <i class="bi bi-clipboard me-1"></i>Copiar
                            </button>
                            ${patient.phone ? `
                                <button class="btn btn-outline-success btn-sm" onclick="Messages.openWhatsApp('${patient.phone}', '${key}', '${patientName}', '${date}', '${time}', '${professionalName}')">
                                    <i class="bi bi-whatsapp me-1"></i>Abrir WhatsApp
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>`;
        }

        html += `</div>`;

        document.getElementById('modalBody').innerHTML = html;
        document.getElementById('modalFooter').innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>`;

        const modal = new bootstrap.Modal(document.getElementById('appModal'));
        modal.show();
    },

    /**
     * copyToClipboard(button, key, patientName, date, time, professionalName)
     * Copia el mensaje al portapapeles.
     */
    copyToClipboard(button, key, patientName, date, time, professionalName) {
        const msg = this.templates[key];
        if (!msg) return;

        const messageText = msg.template(patientName, date, time, professionalName);

        navigator.clipboard.writeText(messageText).then(() => {
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="bi bi-check me-1"></i>Copiado';
            button.classList.remove('btn-' + msg.color);
            button.classList.add('btn-outline-' + msg.color);

            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.classList.remove('btn-outline-' + msg.color);
                button.classList.add('btn-' + msg.color);
            }, 2000);

            App.showToast('Mensaje copiado al portapapeles', 'success');
        }).catch(() => {
            App.showToast('Error al copiar el mensaje', 'danger');
        });
    },

    /**
     * openWhatsApp(phone, key, patientName, date, time, professionalName)
     * Abre WhatsApp con el mensaje prearmado.
     */
    openWhatsApp(phone, key, patientName, date, time, professionalName) {
        const msg = this.templates[key];
        if (!msg) return;

        const messageText = msg.template(patientName, date, time, professionalName);
        App.openWhatsApp(phone, messageText);
    }
};
