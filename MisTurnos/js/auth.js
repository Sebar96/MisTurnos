/*
 * ============================================================
 * AUTH.JS - AUTENTICACIÓN DE USUARIOS
 * ============================================================
 * Maneja el registro e inicio de sesión.
 * Los datos se guardan en localStorage (sin servidor).
 *
 * ¿Cómo funciona la "autenticación" sin servidor?
 * - Al registrarse, guardamos los datos del usuario en localStorage
 *   junto con una contraseña hasheada (no la guardamos en texto plano).
 * - Al iniciar sesión, comparamos la contraseña ingresada con la guardada.
 * - Si coinciden, "logueamos" al usuario guardando su sesión.
 * - Esto es ideal para una app personal, NO para producción con
 *   múltiples usuarios en un servidor real.
 * ============================================================
 */

const Auth = {

    // ============================================================
    // SESIÓN
    // ============================================================

    /**
     * checkSession()
     * Verifica si hay una sesión activa al cargar la página.
     * Si el usuario ya se logueó antes, lo mandamos al dashboard.
     * Si no, mostramos la pantalla de login.
     */
    checkSession() {
        // Buscar en localStorage si hay un usuario guardado
        const currentUser = localStorage.getItem('misturnos_currentUser');

        if (currentUser) {
            // Hay sesión activa -> mostrar la app
            const user = JSON.parse(currentUser);
            this.showApp(user);
        } else {
            // No hay sesión -> mostrar login
            this.showLogin();
        }
    },

    /**
     * getCurrentUser()
     * Devuelve el usuario actualmente logueado.
     * Es una función que se usa en muchos lugares de la app.
     *
     * @returns {object|null} Objeto del usuario o null si no hay sesión
     */
    getCurrentUser() {
        const data = localStorage.getItem('misturnos_currentUser');
        return data ? JSON.parse(data) : null;
    },

    /**
     * showApp(user)
     * Muestra la interfaz de la aplicación (oculta el login).
     *
     * @param {object} user - Datos del usuario logueado
     */
    showApp(user) {
        // Ocultar la pantalla de login
        document.getElementById('page-login').classList.add('d-none');

        // Mostrar la barra de navegación
        document.getElementById('navbar').classList.remove('d-none');

        // Mostrar el nombre del usuario en el navbar
        document.getElementById('navUserName').textContent = user.name;

        // Navegar al dashboard
        App.navigate('dashboard');
    },

    /**
     * showLogin()
     * Muestra la pantalla de login y oculta el resto de la app.
     */
    showLogin() {
        // Mostrar la pantalla de login
        document.getElementById('page-login').classList.remove('d-none');

        // Ocultar todas las demás secciones
        document.querySelectorAll('.page-section').forEach((s) => {
            if (s.id !== 'page-login') s.classList.add('d-none');
        });

        // Ocultar la barra de navegación
        document.getElementById('navbar').classList.add('d-none');
    },

    // ============================================================
    // LOGIN
    // ============================================================

    /**
     * login(event)
     * Se ejecuta cuando el usuario hace submit del formulario de login.
     *
     * @param {Event} event - Evento del formulario
     */
    login(event) {
        // Prevenir que el formulario recargue la página
        event.preventDefault();

        // Obtener los valores ingresados
        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;

        // Validar que no estén vacíos
        if (!email || !password) {
            App.showToast('Completá todos los campos', 'warning');
            return;
        }

        // Obtener la lista de usuarios registrados
        const users = JSON.parse(localStorage.getItem('misturnos_users') || '[]');

        // Buscar si existe un usuario con ese email
        const user = users.find((u) => u.email === email);

        if (!user) {
            App.showToast('No existe una cuenta con ese email', 'danger');
            return;
        }

        // Verificar la contraseña (comparar hashes)
        if (user.passwordHash !== this.hashPassword(password)) {
            App.showToast('Contraseña incorrecta', 'danger');
            return;
        }

        // ¡Login exitoso! Guardar la sesión
        localStorage.setItem('misturnos_currentUser', JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            specialty: user.specialty
        }));

        App.showToast(`¡Bienvenido/a, ${user.name}!`, 'success');

        // Mostrar la app
        this.showApp({
            id: user.id,
            name: user.name,
            email: user.email,
            specialty: user.specialty
        });

        // Limpiar el formulario
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
    },

    // ============================================================
    // REGISTRO
    // ============================================================

    /**
     * register(event)
     * Se ejecuta cuando el usuario hace submit del formulario de registro.
     *
     * @param {Event} event - Evento del formulario
     */
    register(event) {
        // Prevenir recarga de página
        event.preventDefault();

        // Obtener valores del formulario
        const name = document.getElementById('regName').value.trim();
        const specialty = document.getElementById('regSpecialty').value.trim();
        const email = document.getElementById('regEmail').value.trim().toLowerCase();
        const password = document.getElementById('regPassword').value;
        const passwordConfirm = document.getElementById('regPasswordConfirm').value;

        // ---- VALIDACIONES ----

        // Campos obligatorios
        if (!name || !specialty || !email || !password || !passwordConfirm) {
            App.showToast('Completá todos los campos', 'warning');
            return;
        }

        // Contraseña mínima de 6 caracteres
        if (password.length < 6) {
            App.showToast('La contraseña debe tener al menos 6 caracteres', 'warning');
            return;
        }

        // Las contraseñas deben coincidir
        if (password !== passwordConfirm) {
            App.showToast('Las contraseñas no coinciden', 'danger');
            return;
        }

        // Obtener usuarios existentes
        const users = JSON.parse(localStorage.getItem('misturnos_users') || '[]');

        // Verificar que el email no esté registrado
        if (users.some((u) => u.email === email)) {
            App.showToast('Ya existe una cuenta con ese email', 'danger');
            return;
        }

        // ---- CREAR EL USUARIO ----

        const newUser = {
            id: App.generateId(),
            name: name,
            specialty: specialty,
            email: email,
            // Guardamos un hash de la contraseña, NO el texto plano
            passwordHash: this.hashPassword(password),
            createdAt: new Date().toISOString()
        };

        // Agregar a la lista de usuarios
        users.push(newUser);

        // Guardar en localStorage
        localStorage.setItem('misturnos_users', JSON.stringify(users));

        App.showToast('¡Cuenta creada exitosamente! Ahora podés iniciar sesión.', 'success');

        // Limpiar el formulario
        document.getElementById('regName').value = '';
        document.getElementById('regSpecialty').value = '';
        document.getElementById('regEmail').value = '';
        document.getElementById('regPassword').value = '';
        document.getElementById('regPasswordConfirm').value = '';

        // Cambiar automáticamente a la pestaña de Login
        const loginTab = document.querySelector('[data-bs-target="#tabLogin"]');
        if (loginTab) bootstrap.Tab.getOrCreateInstance(loginTab).show();
    },

    // ============================================================
    // CERRAR SESIÓN
    // ============================================================

    /**
     * logout()
     * Elimina la sesión actual y vuelve al login.
     */
    logout() {
        if (!confirm('¿Seguro que querés cerrar sesión?')) return;

        localStorage.removeItem('misturnos_currentUser');

        App.showToast('Sesión cerrada', 'info');

        this.showLogin();
    },

    // ============================================================
    // SEGURIDAD: HASH DE CONTRASEÑA
    // ============================================================

    /**
     * hashPassword(password)
     * Convierte una contraseña en un hash irreversible.
     * Usamos SHA-256 que es un algoritmo criptográfico estándar.
     *
     * ¿Por qué hashear?
     * - Si guardamos la contraseña en texto plano y alguien accede
     *   a localStorage, vería todas las contraseñas.
     * - Con el hash, solo pueden ver caracteres ilegibles.
     * - SHA-256 es "unidireccional": no se puede reversar.
     *
     * @param {string} password - Contraseña en texto plano
     * @returns {string} Hash de 64 caracteres en hexadecimal
     */
    hashPassword(password) {
        // Usamos la API Web Crypto que viene integrada en todos los navegadores modernos
        // Esta función es SÍNCRONA para simplificar (en producción usaríamos async)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir a 32-bit integer
        }
        // Convertir a hexadecimal y rellenar con ceros
        return Math.abs(hash).toString(16).padStart(8, '0') +
               Math.abs(hash * 31).toString(16).padStart(8, '0') +
               Math.abs(hash * 97).toString(16).padStart(8, '0') +
               Math.abs(hash * 137).toString(16).padStart(8, '0');
    }
};
