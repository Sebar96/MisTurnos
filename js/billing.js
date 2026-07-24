/*
 * BILLING.JS - Sistema de suscripciones y pagos
 */

const Billing = {

    plans: {
        basic: {
            id: 'basic',
            name: 'Básico',
            price: 8000,
            maxPatients: 100,
            maxUsers: 1,
            features: ['1 usuario', 'Hasta 100 pacientes', 'Turnos ilimitados', 'WhatsApp integrado']
        },
        professional: {
            id: 'professional',
            name: 'Profesional',
            price: 12000,
            maxPatients: -1, // ilimitado
            maxUsers: 1,
            features: ['1 usuario', 'Pacientes ilimitados', 'Turnos ilimitados', 'WhatsApp integrado', 'Soporte prioritario']
        },
        clinic: {
            id: 'clinic',
            name: 'Consultorio',
            price: 18000,
            maxPatients: -1,
            maxUsers: 3,
            features: ['Hasta 3 usuarios', 'Pacientes ilimitados', 'Turnos ilimitados', 'WhatsApp integrado', 'Soporte prioritario', 'Multi-profesional']
        }
    },

    /**
     * getCurrentPlan(userId)
     * Obtiene el plan actual del usuario.
     */
    async getCurrentPlan(userId) {
        const { doc, getDoc } = window.firebaseExports;
        const db = window.firebaseDB;

        try {
            const docSnap = await getDoc(doc(db, 'users', userId));
            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    planId: data.planId || 'basic',
                    subscriptionStatus: data.subscriptionStatus || 'active',
                    subscriptionExpiry: data.subscriptionExpiry || null,
                    paymentMethod: data.paymentMethod || null,
                    lastPaymentDate: data.lastPaymentDate || null
                };
            }
            return { planId: 'basic', subscriptionStatus: 'active' };
        } catch (err) {
            console.error('[Billing] Error getting plan:', err);
            return { planId: 'basic', subscriptionStatus: 'active' };
        }
    },

    /**
     * canAddPatient(userId)
     * Verifica si el usuario puede agregar más pacientes.
     */
    async canAddPatient(userId) {
        const plan = await this.getCurrentPlan(userId);
        const planDetails = this.plans[plan.planId];

        if (planDetails.maxPatients === -1) return true;

        const { collection, getDocs } = window.firebaseExports;
        const db = window.firebaseDB;

        try {
            const snapshot = await getDocs(collection(db, 'users', userId, 'patients'));
            return snapshot.size < planDetails.maxPatients;
        } catch (err) {
            console.error('[Billing] Error checking patient limit:', err);
            return true;
        }
    },

    /**
     * getPlanBadge(planId)
     * Devuelve el HTML del badge del plan.
     */
    getPlanBadge(planId) {
        const colors = {
            basic: 'secondary',
            professional: 'primary',
            clinic: 'success'
        };
        const plan = this.plans[planId];
        return `<span class="badge bg-${colors[planId] || 'secondary'}">${plan ? plan.name : 'Básico'}</span>`;
    },

    /**
     * showModal()
     * Muestra el modal con los planes disponibles.
     */
    showModal() {
        const user = Auth.getCurrentUser();
        if (!user) return;

        this.getCurrentPlan(user.uid || Auth.getUid()).then((currentPlan) => {
            document.getElementById('modalTitle').textContent = 'Miscripción y Planes';

            let html = `
                <div class="mb-4">
                    <h6 class="fw-bold">Tu plan actual: ${this.getPlanBadge(currentPlan.planId)}</h6>
                    <p class="text-muted small mb-0">
                        Estado: <span class="badge bg-${currentPlan.subscriptionStatus === 'active' ? 'success' : 'warning'}">${currentPlan.subscriptionStatus === 'active' ? 'Activo' : 'Pendiente'}</span>
                    </p>
                </div>
                <div class="row g-3">`;

            for (const [key, plan] of Object.entries(this.plans)) {
                const isCurrent = key === currentPlan.planId;
                html += `
                    <div class="col-md-4">
                        <div class="card h-100 ${isCurrent ? 'border-primary' : ''}">
                            <div class="card-body text-center">
                                <h5 class="card-title fw-bold">${plan.name}</h5>
                                <h3 class="text-primary">$${plan.price.toLocaleString('es-AR')}<small class="text-muted">/mes</small></h3>
                                <ul class="list-unstyled text-start mt-3">
                                    ${plan.features.map((f) => `<li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i>${f}</li>`).join('')}
                                </ul>
                                ${isCurrent ? `
                                    <button class="btn btn-secondary w-100" disabled>Plan Actual</button>
                                ` : `
                                    <button class="btn btn-outline-primary w-100" onclick="Billing.selectPlan('${key}')">
                                        Seleccionar
                                    </button>
                                `}
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
        });
    },

    /**
     * selectPlan(planId)
     * Selecciona un nuevo plan.
     */
    async selectPlan(planId) {
        const user = Auth.getCurrentUser();
        if (!user) return;

        const { doc, setDoc } = window.firebaseExports;
        const db = window.firebaseDB;
        const uid = Auth.getUid();

        const plan = this.plans[planId];
        if (!plan) return;

        // Calcular vencimiento (30 días)
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);

        try {
            await setDoc(doc(db, 'users', uid), {
                planId: planId,
                subscriptionStatus: 'pending',
                subscriptionExpiry: expiry.toISOString(),
                updatedAt: new Date().toISOString()
            }, { merge: true });

            App.showToast(`Plan ${plan.name} seleccionado. Completá el pago para activarlo.`, 'success');

            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
        } catch (err) {
            console.error('[Billing] Error selecting plan:', err);
            App.showToast('Error al seleccionar el plan', 'danger');
        }
    },

    /**
     * showPaymentInfo()
     * Muestra información de pago.
     */
    showPaymentInfo() {
        document.getElementById('modalTitle').textContent = 'Información de Pago';

        document.getElementById('modalBody').innerHTML = `
            <div class="text-center mb-4">
                <i class="bi bi-credit-card text-primary" style="font-size: 3rem;"></i>
                <h5 class="mt-3 fw-bold">Medios de Pago</h5>
            </div>
            <div class="card mb-3">
                <div class="card-body">
                    <h6 class="fw-bold"><i class="bi bi-bank me-2"></i>Transferencia Bancaria</h6>
                    <p class="mb-1">Banco: XXXX</p>
                    <p class="mb-1">CBU: XXXXXXXXXXXXXXXX</p>
                    <p class="mb-1">Alias: MISTURNOS</p>
                    <p class="mb-0"><small class="text-muted">Enviar comprobante por WhatsApp</small></p>
                </div>
            </div>
            <div class="card">
                <div class="card-body">
                    <h6 class="fw-bold"><i class="bi bi-wallet2 me-2"></i>Mercado Pago</h6>
                    <p class="mb-0">Link de pago: <a href="#">Próximamente</a></p>
                </div>
            </div>`;

        document.getElementById('modalFooter').innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>`;

        const modal = new bootstrap.Modal(document.getElementById('appModal'));
        modal.show();
    }
};
