/*
 * MONITOR.JS - Sistema de monitoreo y alertas
 */

const Monitor = {

    _errorCount: 0,
    _lastAlertTime: null,

    /**
     * logError(type, message, details)
     * Registra un error en Firestore.
     */
    async logError(type, message, details = null) {
        const { addDoc, collection } = window.firebaseExports;
        const db = window.firebaseDB;
        const user = Auth.getCurrentUser();

        try {
            await addDoc(collection(db, 'errors'), {
                type: type,
                message: message,
                details: details,
                userEmail: user ? user.email : 'unknown',
                userId: Auth.getUid(),
                timestamp: new Date().toISOString(),
                url: window.location.href
            });

            this._errorCount++;
            this.checkAlertThreshold();
        } catch (err) {
            console.error('[Monitor] Error logging error:', err);
        }
    },

    /**
     * checkAlertThreshold()
     * Si hay más de 3 errores en 1 hora, envía alerta.
     */
    checkAlertThreshold() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // Si ya se envió alerta hace menos de 1 hora, no enviar otra
        if (this._lastAlertTime && this._lastAlertTime > oneHourAgo) {
            return;
        }

        if (this._errorCount >= 3) {
            this.sendAlert();
            this._lastAlertTime = now;
            this._errorCount = 0;
        }
    },

    /**
     * sendAlert()
     * Envía alerta por email (simulado por ahora).
     * En producción, usaría un servicio como EmailJS o un Cloud Function.
     */
    sendAlert() {
        console.warn('[Monitor] ALERT: More than 3 errors in the last hour!');
        // TODO: Implementar envío de email con EmailJS o Cloud Function
        // Por ahora solo mostramos en consola
    },

    /**
     * getErrors(limit)
     * Obtiene los últimos errores registrados.
     */
    async getErrors(limit = 50) {
        const { collection, getDocs, query, orderBy, limit: limitQuery } = window.firebaseExports;
        const db = window.firebaseDB;

        try {
            const q = query(
                collection(db, 'errors'),
                orderBy('timestamp', 'desc'),
                limitQuery(limit)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        } catch (err) {
            console.error('[Monitor] Error getting errors:', err);
            return [];
        }
    },

    /**
     * getErrorsCount(hours)
     * Cuenta errores en las últimas X horas.
     */
    async getErrorsCount(hours = 24) {
        const errors = await this.getErrors(100);
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

        return errors.filter((e) => {
            if (!e.timestamp) return false;
            const errorDate = new Date(e.timestamp);
            return errorDate > cutoff;
        }).length;
    }
};

// Interceptar errores globales
window.addEventListener('error', (event) => {
    Monitor.logError('JavaScript Error', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

window.addEventListener('unhandledrejection', (event) => {
    Monitor.logError('Unhandled Promise Rejection', event.reason?.message || 'Unknown error');
});
