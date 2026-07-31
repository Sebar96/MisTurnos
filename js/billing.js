/*
 * MisTurnos - © 2026 Sebastián Russo
 * Todos los derechos reservados.
 *
 * BILLING.JS - Sistema de suscripciones y pagos
 */

const Billing = {

    plans: {
        basic: {
            id: 'basic',
            name: 'Básico',
            price: 4000,
            priceUSD: 4,
            maxPatients: 25,
            maxUsers: 1,
            features: [
                '1 usuario',
                'Hasta 25 pacientes',
                'Turnos ilimitados',
                'WhatsApp manual'
            ]
        },
        professional: {
            id: 'professional',
            name: 'Profesional',
            price: 8000,
            priceUSD: 8,
            maxPatients: 50,
            maxUsers: 2,
            features: [
                'Hasta 2 usuarios',
                'Hasta 50 pacientes',
                'Turnos ilimitados',
                'Recordatorios automáticos',
                'Estadísticas básicas'
            ]
        },
        clinic: {
            id: 'clinic',
            name: 'Consultorio',
            price: 12000,
            priceUSD: 12,
            maxPatients: -1,
            maxUsers: 3,
            features: [
                'Hasta 3 usuarios',
                'Pacientes ilimitados',
                'Turnos ilimitados',
                'Recordatorios automáticos',
                'Agenda compartida',
                'Soporte prioritario'
            ]
        }
    },

    async getCurrentPlan(userId) {
        const { doc, getDoc } = window.firebaseExports;
        const db = window.firebaseDB;

        try {
            const docSnap = await getDoc(doc(db, 'users', userId));
            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    planId: data.planId || 'basic',
                    trial: data.planTrial || false,
                    trialExpiry: data.planTrialExpiry || null,
                    subscriptionStatus: data.subscriptionStatus || 'active'
                };
            }
            return { planId: 'basic', trial: false, subscriptionStatus: 'active' };
        } catch (err) {
            console.error('[Billing] Error getting plan:', err);
            return { planId: 'basic', trial: false, subscriptionStatus: 'active' };
        }
    },

    async isTrialExpired(userId) {
        const plan = await this.getCurrentPlan(userId);
        if (!plan.trial || !plan.trialExpiry) return false;
        return new Date() > new Date(plan.trialExpiry);
    },

    async canAddPatient(userId) {
        const plan = await this.getCurrentPlan(userId);

        if (plan.trial && plan.trialExpiry) {
            if (new Date() > new Date(plan.trialExpiry)) {
                return false;
            }
        }

        const planDetails = this.plans[plan.planId];
        if (!planDetails) return false;
        if (planDetails.maxPatients === -1) return true;

        const { collection, getDocs } = window.firebaseExports;
        const db = window.firebaseDB;

        try {
            const snapshot = await getDocs(collection(db, 'users', userId, 'patients'));
            return snapshot.size < planDetails.maxPatients;
        } catch (err) {
            return true;
        }
    },

    async getPatientCount(userId) {
        const { collection, getDocs } = window.firebaseExports;
        const db = window.firebaseDB;

        try {
            const snapshot = await getDocs(collection(db, 'users', userId, 'patients'));
            return snapshot.size;
        } catch (err) {
            return 0;
        }
    },

    getPlanBadge(planId) {
        const colors = {
            basic: 'secondary',
            professional: 'primary',
            clinic: 'success'
        };
        const plan = this.plans[planId];
        return `<span class="badge bg-${colors[planId] || 'secondary'}">${plan ? plan.name : 'Básico'}</span>`;
    },

    showUpgradeModal(reason) {
        document.getElementById('modalTitle').textContent = 'Mejorá tu plan';

        const user = Auth.getCurrentUser();

        let html = '';

        if (reason === 'trial_expired') {
            html += `
                <div class="alert alert-warning mb-4">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Tu prueba gratuita expiró.</strong> Elegí un plan para seguir usando MisTurnos.
                </div>`;
        } else if (reason === 'limit_reached') {
            html += `
                <div class="alert alert-warning mb-4">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Llegaste al límite de tu plan.</strong> Elegí un plan con más pacientes.
                </div>`;
        }

        html += `<div class="row g-3">`;

        for (const [key, plan] of Object.entries(this.plans)) {
            html += `
                <div class="col-md-4">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body text-center">
                            <h5 class="card-title fw-bold">${plan.name}</h5>
                            <h3 class="text-primary">$${plan.price.toLocaleString('es-AR')}<small class="text-muted">/mes</small></h3>
                            <p class="text-muted small mb-2">~USD ${plan.priceUSD}/mes</p>
                            <ul class="list-unstyled text-start mt-3">
                                ${plan.features.map((f) => `<li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i>${f}</li>`).join('')}
                            </ul>
                            <button class="btn btn-outline-primary w-100" onclick="Billing.selectPlan('${key}')">
                                Seleccionar
                            </button>
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

    showCurrentPlan() {
        const user = Auth.getCurrentUser();
        if (!user) return;

        this.getCurrentPlan(Auth.getUid()).then(async (currentPlan) => {
            const planDetails = this.plans[currentPlan.planId];
            const patientCount = await this.getPatientCount(Auth.getUid());
            const maxPatients = planDetails ? planDetails.maxPatients : 25;
            const patientsText = maxPatients === -1 ? 'Ilimitados' : `${patientCount} / ${maxPatients}`;

            let trialInfo = '';
            if (currentPlan.trial && currentPlan.trialExpiry) {
                const expiry = new Date(currentPlan.trialExpiry);
                const now = new Date();
                const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

                if (daysLeft > 0) {
                    trialInfo = `
                        <div class="alert alert-info mb-3">
                            <i class="bi bi-clock me-2"></i>
                            <strong>Prueba gratuita:</strong> quedan ${daysLeft} días
                        </div>`;
                } else {
                    trialInfo = `
                        <div class="alert alert-warning mb-3">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            <strong>Tu prueba expiró.</strong> Elegí un plan para seguir usando.
                        </div>`;
                }
            }

            document.getElementById('modalTitle').textContent = 'Tu Plan';

            let html = `
                ${trialInfo}
                <div class="mb-4">
                    <h6 class="fw-bold">Plan actual: ${this.getPlanBadge(currentPlan.planId)}</h6>
                    <p class="text-muted small mb-1">
                        Pacientes: <strong>${patientsText}</strong>
                    </p>
                    <p class="text-muted small mb-0">
                        Estado: <span class="badge bg-${currentPlan.subscriptionStatus === 'active' ? 'success' : 'warning'}">${currentPlan.subscriptionStatus === 'active' ? 'Activo' : 'Pendiente'}</span>
                    </p>
                </div>
                <hr>
                <h6 class="fw-bold mb-3">Planes disponibles</h6>
                <div class="row g-3">`;

            for (const [key, plan] of Object.entries(this.plans)) {
                const isCurrent = key === currentPlan.planId;
                html += `
                    <div class="col-md-4">
                        <div class="card h-100 ${isCurrent ? 'border-primary' : 'border-0 shadow-sm'}">
                            <div class="card-body text-center">
                                <h5 class="card-title fw-bold">${plan.name}</h5>
                                <h3 class="text-primary">$${plan.price.toLocaleString('es-AR')}<small class="text-muted">/mes</small></h3>
                                <p class="text-muted small mb-2">~USD ${plan.priceUSD}/mes</p>
                                <ul class="list-unstyled text-start mt-3">
                                    ${plan.features.map((f) => `<li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i>${f}</li>`).join('')}
                                </ul>
                                ${isCurrent ? `
                                    <button class="btn btn-secondary w-100" disabled>Plan Actual</button>
                                ` : `
                                    <button class="btn btn-outline-primary w-100" onclick="Billing.selectPlan('${key}')">
                                        Cambiar a ${plan.name}
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

    async selectPlan(planId) {
        const user = Auth.getCurrentUser();
        if (!user) return;

        const { doc, setDoc } = window.firebaseExports;
        const db = window.firebaseDB;
        const uid = Auth.getUid();

        const plan = this.plans[planId];
        if (!plan) return;

        try {
            await setDoc(doc(db, 'users', uid), {
                planId: planId,
                planTrial: false,
                planTrialExpiry: null,
                subscriptionStatus: 'active',
                updatedAt: new Date().toISOString()
            }, { merge: true });

            App.showToast(`Plan ${plan.name} activado.`, 'success');

            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
        } catch (err) {
            console.error('[Billing] Error selecting plan:', err);
            App.showToast('Error al seleccionar el plan', 'danger');
        }
    }
};
