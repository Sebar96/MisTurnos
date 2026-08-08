/*
 * MisTurnos - © 2026 Sebastián Russo
 * Todos los derechos reservados.
 *
 * ADMIN.JS - Panel de administración
 */

const Admin = {

    async loadDashboard() {
        const { collection, getDocs } = window.firebaseExports;
        const db = window.firebaseDB;

        document.getElementById('adminDate').textContent = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const users = usersSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

            document.getElementById('statActiveUsers').textContent = users.length;

            const todayStr = new Date().toISOString().split('T')[0];
            let totalTodayAppts = 0;
            let totalPatients = 0;

            for (const user of users) {
                try {
                    const apptsSnapshot = await getDocs(collection(db, 'users', user.id, 'appointments'));
                    apptsSnapshot.docs.forEach((doc) => {
                        const appt = doc.data();
                        if (appt.date === todayStr && appt.status !== 'cancelled') {
                            totalTodayAppts++;
                        }
                    });

                    const patientsSnapshot = await getDocs(collection(db, 'users', user.id, 'patients'));
                    totalPatients += patientsSnapshot.size;
                } catch (e) {
                }
            }

            document.getElementById('statTodayAppts').textContent = totalTodayAppts;
            document.getElementById('statTotalPatients').textContent = totalPatients;

            let recentErrors = [];
            try {
                const errorsSnapshot = await getDocs(collection(db, 'errors'));
                recentErrors = errorsSnapshot.docs.slice(0, 10).map((d) => ({ id: d.id, ...d.data() }));
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const errors24h = recentErrors.filter((e) => e.timestamp && e.timestamp.toDate && e.timestamp.toDate() > yesterday);
                document.getElementById('statErrors24h').textContent = errors24h.length;
            } catch (e) {
                document.getElementById('statErrors24h').textContent = '0';
            }

            const recentUsers = users.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                return dateB - dateA;
            }).slice(0, 5);

            const recentUsersList = document.getElementById('adminRecentUsers');
            if (recentUsers.length === 0) {
                recentUsersList.innerHTML = '<div class="text-center text-muted py-4">No hay usuarios</div>';
            } else {
                recentUsersList.innerHTML = recentUsers.map((u) => `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-0 fw-bold">${u.name || 'Sin nombre'}</h6>
                                <small class="text-muted">${u.email}</small>
                                ${u.specialty ? `<small class="text-muted"> · ${u.specialty}</small>` : ''}
                            </div>
                            <small class="text-muted">${u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-AR') : 'N/A'}</small>
                        </div>
                    </div>
                `).join('');
            }

            const recentErrorsList = document.getElementById('adminRecentErrors');
            if (recentErrors.length === 0) {
                recentErrorsList.innerHTML = '<div class="text-center text-muted py-4">No hay errores</div>';
            } else {
                recentErrorsList.innerHTML = recentErrors.map((err) => `
                    <div class="list-group-item">
                        <small class="text-danger fw-bold">${err.type || 'Error'}</small>
                        <p class="mb-0 small text-muted">${err.message || ''}</p>
                        <small class="text-muted">${err.userEmail || ''} · ${err.timestamp ? (typeof err.timestamp === 'string' ? new Date(err.timestamp).toLocaleString('es-AR') : (err.timestamp.toDate ? err.timestamp.toDate().toLocaleString('es-AR') : '')) : ''}</small>
                    </div>
                `).join('');
            }
        } catch (err) {
            console.error('[Admin] Load dashboard error:', err);
        }
    },

    async loadUsers() {
        const { collection, getDocs, doc, deleteDoc } = window.firebaseExports;
        const db = window.firebaseDB;

        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const users = usersSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

            const container = document.getElementById('adminUsersList');
            if (users.length === 0) {
                container.innerHTML = '<div class="text-center text-muted py-4">No hay usuarios registrados</div>';
                return;
            }

            container.innerHTML = `
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Especialidad</th>
                            <th>Registro</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map((u) => `
                            <tr>
                                <td>${u.name || 'Sin nombre'}</td>
                                <td>${u.email}</td>
                                <td>${u.specialty || 'N/A'}</td>
                                <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-AR') : 'N/A'}</td>
                                <td>
                                    <button class="btn btn-outline-danger btn-sm" onclick="Admin.deleteUser('${u.id}', '${(u.name || u.email).replace(/'/g, "\\'")}')">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;
        } catch (err) {
            console.error('[Admin] Load users error:', err);
        }
    },

    async loadActivity() {
        const { collection, getDocs } = window.firebaseExports;
        const db = window.firebaseDB;

        const container = document.getElementById('adminActivityList');
        container.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-hourglass-split me-2"></i>Cargando actividad...</div>';

        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const users = usersSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

            if (users.length === 0) {
                container.innerHTML = '<div class="text-center text-muted py-4">No hay usuarios registrados</div>';
                return;
            }

            const rows = [];

            for (const user of users) {
                let patientCount = 0;
                let appointmentCount = 0;
                let lastActivity = null;

                try {
                    const patientsSnapshot = await getDocs(collection(db, 'users', user.id, 'patients'));
                    patientCount = patientsSnapshot.size;

                    const apptsSnapshot = await getDocs(collection(db, 'users', user.id, 'appointments'));
                    appointmentCount = apptsSnapshot.size;

                    apptsSnapshot.docs.forEach((doc) => {
                        const appt = doc.data();
                        const apptDate = appt.createdAt ? new Date(appt.createdAt) : (appt.date ? new Date(appt.date + 'T' + (appt.time || '00:00')) : null);
                        if (apptDate && (!lastActivity || apptDate > lastActivity)) {
                            lastActivity = apptDate;
                        }
                    });

                    patientsSnapshot.docs.forEach((doc) => {
                        const pat = doc.data();
                        const patDate = pat.createdAt ? new Date(pat.createdAt) : null;
                        if (patDate && (!lastActivity || patDate > lastActivity)) {
                            lastActivity = patDate;
                        }
                    });

                    if (user.updatedAt) {
                        const updDate = new Date(user.updatedAt);
                        if (!lastActivity || updDate > lastActivity) {
                            lastActivity = updDate;
                        }
                    }
                } catch (e) {}

                const planNames = { basic: 'Básico', professional: 'Profesional', clinic: 'Consultorio' };
                const planColors = { basic: 'secondary', professional: 'primary', clinic: 'success' };
                const planId = user.planId || 'basic';

                let lastActivityStr = 'Nunca';
                if (lastActivity) {
                    const diff = Date.now() - lastActivity.getTime();
                    const mins = Math.floor(diff / 60000);
                    const hours = Math.floor(diff / 3600000);
                    const days = Math.floor(diff / 86400000);

                    if (mins < 1) lastActivityStr = 'Ahora mismo';
                    else if (mins < 60) lastActivityStr = `Hace ${mins} min`;
                    else if (hours < 24) lastActivityStr = `Hace ${hours}h`;
                    else if (days < 7) lastActivityStr = `Hace ${days} días`;
                    else lastActivityStr = lastActivity.toLocaleDateString('es-AR');
                }

                rows.push({
                    name: user.name || 'Sin nombre',
                    email: user.email,
                    specialty: user.specialty || '',
                    planId,
                    planName: planNames[planId] || 'Básico',
                    planColor: planColors[planId] || 'secondary',
                    patientCount,
                    appointmentCount,
                    lastActivity: lastActivity || new Date(0),
                    lastActivityStr
                });
            }

            rows.sort((a, b) => b.lastActivity - a.lastActivity);

            container.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Plan</th>
                                <th class="text-center">Pacientes</th>
                                <th class="text-center">Turnos</th>
                                <th>Última actividad</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map((r) => `
                                <tr>
                                    <td>
                                        <div class="fw-semibold">${r.name}</div>
                                        <small class="text-muted">${r.email}</small>
                                        ${r.specialty ? `<br><small class="text-muted">${r.specialty}</small>` : ''}
                                    </td>
                                    <td><span class="badge bg-${r.planColor}">${r.planName}</span></td>
                                    <td class="text-center fw-bold">${r.patientCount}</td>
                                    <td class="text-center fw-bold">${r.appointmentCount}</td>
                                    <td><small>${r.lastActivityStr}</small></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="text-muted small mt-2">
                    ${rows.length} usuario${rows.length !== 1 ? 's' : ''} · 
                    ${rows.reduce((a, r) => a + r.patientCount, 0)} pacientes · 
                    ${rows.reduce((a, r) => a + r.appointmentCount, 0)} turnos
                </div>`;
        } catch (err) {
            console.error('[Admin] Load activity error:', err);
            container.innerHTML = '<div class="text-center text-muted py-4">Error al cargar actividad</div>';
        }
    },

    async deleteUser(userId, userName) {
        if (!confirm(`¿Eliminar a ${userName} y todos sus datos?`)) return;

        const { doc, deleteDoc } = window.firebaseExports;
        const db = window.firebaseDB;

        try {
            await deleteDoc(doc(db, 'users', userId));
            App.logActivity('admin_delete_user', `Eliminó usuario: ${userName} (${userId})`);
            App.showToast(`${userName} eliminado`, 'success');
            this.loadUsers();
        } catch (err) {
            console.error('[Admin] Delete user error:', err);
            App.showToast('Error al eliminar usuario', 'danger');
        }
    },

    async loadErrors() {
        const { collection, getDocs } = window.firebaseExports;
        const db = window.firebaseDB;

        try {
            const errorsSnapshot = await getDocs(collection(db, 'errors'));

            const container = document.getElementById('adminErrorsList');
            if (errorsSnapshot.empty) {
                container.innerHTML = '<div class="text-center text-muted py-4">No hay errores registrados</div>';
                return;
            }

            const errors = errorsSnapshot.docs.map((d) => {
                const err = d.data();
                let dateStr = 'N/A';
                if (err.timestamp) {
                    const date = typeof err.timestamp === 'string' ? new Date(err.timestamp) : (err.timestamp.toDate ? err.timestamp.toDate() : new Date(err.timestamp));
                    dateStr = date.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                }
                return { ...err, dateStr };
            }).sort((a, b) => {
                const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
                const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
                return dateB - dateA;
            });

            container.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="text-muted">${errors.length} errores registrados</span>
                    <button class="btn btn-outline-danger btn-sm" onclick="Admin.clearErrors()">
                        <i class="bi bi-trash me-1"></i>Limpiar todo
                    </button>
                </div>
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Fecha y Hora</th>
                            <th>Tipo</th>
                            <th>Mensaje</th>
                            <th>Usuario</th>
                            <th>URL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${errors.map((err) => `
                            <tr>
                                <td><small>${err.dateStr}</small></td>
                                <td><span class="badge bg-danger">${err.type || 'Error'}</span></td>
                                <td><small>${err.message || ''}</small></td>
                                <td><small>${err.userEmail || 'N/A'}</small></td>
                                <td><small class="text-muted text-truncate" style="max-width:150px;display:block;">${err.url || ''}</small></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;
        } catch (err) {
            console.error('[Admin] Load errors error:', err);
            document.getElementById('adminErrorsList').innerHTML = '<div class="text-center text-muted py-4">No hay errores registrados</div>';
        }
    },

    async clearErrors() {
        if (!confirm('¿Eliminar todos los errores registrados?')) return;

        const { collection, getDocs, doc, deleteDoc } = window.firebaseExports;
        const db = window.firebaseDB;

        try {
            const snapshot = await getDocs(collection(db, 'errors'));
            const deletes = snapshot.docs.map((d) => deleteDoc(doc(db, 'errors', d.id)));
            await Promise.all(deletes);
            App.logActivity('admin_clear_errors', `Eliminó ${snapshot.size} errores`);
            App.showToast('Errores eliminados', 'success');
            this.loadErrors();
            this.loadDashboard();
        } catch (err) {
            console.error('[Admin] Clear errors error:', err);
            App.showToast('Error al limpiar errores', 'danger');
        }
    },

    showTab(tab) {
        document.querySelectorAll('[id^="adminTab-"]').forEach((el) => el.classList.add('d-none'));
        document.getElementById('adminTab-' + tab).classList.remove('d-none');

        document.querySelectorAll('[data-admin-tab]').forEach((btn) => btn.classList.remove('active'));
        document.querySelector(`[data-admin-tab="${tab}"]`).classList.add('active');

        switch (tab) {
            case 'recent': this.loadDashboard(); break;
            case 'users': this.loadUsers(); break;
            case 'errors': this.loadErrors(); break;
            case 'controls': this.loadSystemCheck(); break;
            case 'activity': this.loadActivity(); break;
        }
    },

    async runSystemCheck() {
        const { collection, getDocs } = window.firebaseExports;
        const db = window.firebaseDB;

        const healthContainer = document.getElementById('systemHealthList');
        healthContainer.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-hourglass-split me-2"></i>Verificando...</div>';

        const checks = [];

        // 1. Firebase connection
        try {
            await getDocs(collection(db, 'users'));
            checks.push({ name: 'Firebase Firestore', status: 'ok', detail: 'Conectado' });
        } catch (err) {
            checks.push({ name: 'Firebase Firestore', status: 'error', detail: 'Error de conexión' });
        }

        // 2. Service Worker
        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg && reg.active) {
                checks.push({ name: 'Service Worker', status: 'ok', detail: 'Activo (scope: ' + reg.scope + ')' });
            } else {
                checks.push({ name: 'Service Worker', status: 'warning', detail: 'No activo' });
            }
        } else {
            checks.push({ name: 'Service Worker', status: 'error', detail: 'No soportado' });
        }

        // 3. Authentication
        try {
            const auth = window.firebaseAuth;
            if (auth && auth.currentUser) {
                checks.push({ name: 'Authentication', status: 'ok', detail: 'Sesión activa' });
            } else {
                checks.push({ name: 'Authentication', status: 'warning', detail: 'No hay sesión activa' });
            }
        } catch (err) {
            checks.push({ name: 'Authentication', status: 'error', detail: 'Error' });
        }

        // 4. Cache
        if (typeof Cache !== 'undefined' && Cache._store) {
            const cacheSize = Object.keys(Cache._store).length;
            checks.push({ name: 'Caché en memoria', status: 'ok', detail: cacheSize + ' entradas' });
        } else {
            checks.push({ name: 'Caché en memoria', status: 'warning', detail: 'No disponible' });
        }

        // 5. Users count
        let totalUsers = 0;
        let totalPatients = 0;
        let totalAppointments = 0;
        let plans = { basic: 0, professional: 0, clinic: 0 };
        let trialsActive = 0;
        let trialsExpired = 0;

        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            totalUsers = usersSnapshot.size;

            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();

                // Plans distribution
                const planId = userData.planId || 'basic';
                plans[planId] = (plans[planId] || 0) + 1;

                // Trials
                if (userData.planTrial && userData.planTrialExpiry) {
                    if (new Date() > new Date(userData.planTrialExpiry)) {
                        trialsExpired++;
                    } else {
                        trialsActive++;
                    }
                }

                try {
                    const patientsSnapshot = await getDocs(collection(db, 'users', userDoc.id, 'patients'));
                    totalPatients += patientsSnapshot.size;

                    const apptsSnapshot = await getDocs(collection(db, 'users', userDoc.id, 'appointments'));
                    totalAppointments += apptsSnapshot.size;
                } catch (e) {}
            }

            checks.push({ name: 'Usuarios', status: 'ok', detail: totalUsers + ' registrados' });
            checks.push({ name: 'Pacientes', status: 'ok', detail: totalPatients + ' totales' });
            checks.push({ name: 'Turnos', status: 'ok', detail: totalAppointments + ' totales' });
        } catch (err) {
            checks.push({ name: 'Datos', status: 'error', detail: 'Error al contar' });
        }

        // 6. Errors
        let errors24h = 0;
        let errors7d = 0;

        try {
            const errorsSnapshot = await getDocs(collection(db, 'errors'));
            const now = new Date();
            const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
            const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

            errorsSnapshot.docs.forEach((doc) => {
                const err = doc.data();
                if (err.timestamp) {
                    const errDate = typeof err.timestamp === 'string' ? new Date(err.timestamp) : (err.timestamp.toDate ? err.timestamp.toDate() : new Date(err.timestamp));
                    if (errDate > dayAgo) errors24h++;
                    if (errDate > weekAgo) errors7d++;
                }
            });

            const errorStatus = errors24h > 5 ? 'warning' : 'ok';
            checks.push({ name: 'Errores (24h)', status: errorStatus, detail: errors24h + ' reportes' });
            checks.push({ name: 'Errores (7 días)', status: errors7d > 20 ? 'warning' : 'ok', detail: errors7d + ' reportes' });
        } catch (err) {
            checks.push({ name: 'Errores', status: 'error', detail: 'Error al contar' });
        }

        // Render health indicators
        this.renderHealthList(checks);

        // Render plan distribution
        this.renderPlanDistribution(plans, trialsActive, trialsExpired);

        // Save check to Firestore
        try {
            const { addDoc, collection: col } = window.firebaseExports;
            await addDoc(col(db, 'systemChecks'), {
                timestamp: new Date().toISOString(),
                totalUsers,
                totalPatients,
                totalAppointments,
                errors24h,
                errors7d,
                plans,
                trialsActive,
                trialsExpired,
                checks: checks.map(c => ({ name: c.name, status: c.status }))
            });
        } catch (err) {
            console.error('[Admin] Error saving check:', err);
        }

        // Update last check time
        document.getElementById('lastCheckTime').textContent = 'Ahora mismo';

        // Load history
        this.loadChecksHistory();
    },

    renderHealthList(checks) {
        const container = document.getElementById('systemHealthList');
        const statusIcons = {
            ok: '<i class="bi bi-check-circle-fill text-success"></i>',
            warning: '<i class="bi bi-exclamation-triangle-fill text-warning"></i>',
            error: '<i class="bi bi-x-circle-fill text-danger"></i>'
        };

        container.innerHTML = checks.map((check) => `
            <div class="d-flex align-items-center justify-content-between py-2 border-bottom" style="border-color: var(--border-color) !important;">
                <div class="d-flex align-items-center gap-2">
                    ${statusIcons[check.status]}
                    <span class="fw-semibold">${check.name}</span>
                </div>
                <span class="text-muted small">${check.detail}</span>
            </div>
        `).join('');
    },

    renderPlanDistribution(plans, trialsActive, trialsExpired) {
        const container = document.getElementById('planDistribution');
        const total = Object.values(plans).reduce((a, b) => a + b, 0);

        if (total === 0) {
            container.innerHTML = '<div class="text-center text-muted py-4">Sin usuarios</div>';
            return;
        }

        const planNames = { basic: 'Básico', professional: 'Profesional', clinic: 'Consultorio' };
        const planColors = { basic: 'secondary', professional: 'primary', clinic: 'success' };

        let html = '';

        for (const [key, count] of Object.entries(plans)) {
            if (count === 0) continue;
            const pct = Math.round((count / total) * 100);
            html += `
                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-1">
                        <small class="fw-semibold">${planNames[key] || key}</small>
                        <small class="text-muted">${count} usuario${count !== 1 ? 's' : ''}</small>
                    </div>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar bg-${planColors[key] || 'secondary'}" style="width: ${pct}%"></div>
                    </div>
                </div>`;
        }

        if (trialsActive > 0 || trialsExpired > 0) {
            html += `
                <hr>
                <div class="d-flex justify-content-between small">
                    <span><i class="bi bi-clock me-1"></i>Trials activos</span>
                    <span class="fw-semibold">${trialsActive}</span>
                </div>
                <div class="d-flex justify-content-between small">
                    <span><i class="bi bi-clock-history me-1"></i>Trials expirados</span>
                    <span class="fw-semibold">${trialsExpired}</span>
                </div>`;
        }

        container.innerHTML = html;
    },

    async loadChecksHistory() {
        const { collection, getDocs, query, orderBy, limit } = window.firebaseExports;
        const db = window.firebaseDB;

        try {
            const q = query(collection(db, 'systemChecks'), orderBy('timestamp', 'desc'), limit(10));
            const snapshot = await getDocs(q);

            const container = document.getElementById('systemChecksHistory');
            if (snapshot.empty) {
                container.innerHTML = '<div class="text-center text-muted py-4">Sin controles anteriores</div>';
                return;
            }

            container.innerHTML = snapshot.docs.map((doc) => {
                const check = doc.data();
                const date = new Date(check.timestamp);
                const dateStr = date.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                const allOk = check.checks && check.checks.every(c => c.status === 'ok');
                const statusBadge = allOk ? '<span class="badge bg-success">OK</span>' : '<span class="badge bg-warning">Con alertas</span>';

                return `
                    <div class="d-flex justify-content-between align-items-center py-2 border-bottom" style="border-color: var(--border-color) !important;">
                        <div>
                            <span class="fw-semibold">${dateStr}</span>
                            <span class="ms-2">${statusBadge}</span>
                        </div>
                        <small class="text-muted">${check.totalUsers || 0} usuarios · ${check.totalPatients || 0} pacientes · ${check.totalAppointments || 0} turnos</small>
                    </div>`;
            }).join('');
        } catch (err) {
            console.error('[Admin] Load checks history error:', err);
        }
    },

    async loadSystemCheck() {
        const { collection, getDocs, query, orderBy, limit } = window.firebaseExports;
        const db = window.firebaseDB;

        try {
            const q = query(collection(db, 'systemChecks'), orderBy('timestamp', 'desc'), limit(1));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const lastCheck = snapshot.docs[0].data();
                const date = new Date(lastCheck.timestamp);
                const dateStr = date.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                document.getElementById('lastCheckTime').textContent = dateStr;
            }

            this.loadChecksHistory();
        } catch (err) {
            console.error('[Admin] Load system check error:', err);
        }
    }
};
