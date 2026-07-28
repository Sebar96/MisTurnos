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

    async deleteUser(userId, userName) {
        if (!confirm(`¿Eliminar a ${userName} y todos sus datos?`)) return;

        const { doc, deleteDoc } = window.firebaseExports;
        const db = window.firebaseDB;

        try {
            await deleteDoc(doc(db, 'users', userId));
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
        }
    }
};
