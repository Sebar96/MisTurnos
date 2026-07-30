/*
 * AUTH.JS - Firebase Authentication
 */

const Auth = {

    _currentFirebaseUser: null,
    _userProfile: null,

    checkSession() {
        const { onAuthStateChanged } = window.firebaseExports;
        const auth = window.firebaseAuth;

        onAuthStateChanged(auth, (user) => {
            if (user) {
                this._currentFirebaseUser = user;
                this.loadUserProfile(user.uid);
            } else {
                this._currentFirebaseUser = null;
                this._userProfile = null;
                this.showLogin();
            }
        });
    },

    async loadUserProfile(uid) {
        const { doc, getDoc } = window.firebaseExports;
        const db = window.firebaseDB;

        try {
            const docSnap = await getDoc(doc(db, 'users', uid));

            if (docSnap.exists()) {
                this._userProfile = { id: uid, ...docSnap.data() };
            } else {
                this._userProfile = { id: uid, name: '', email: '', specialty: '' };
            }

            this.showApp(this._userProfile);
        } catch (err) {
            console.error('[Auth] Error loading profile:', err);
            this._userProfile = { id: uid, name: '', email: '', specialty: '' };
            this.showApp(this._userProfile);
        }
    },

    getCurrentUser() {
        return this._userProfile;
    },

    getUid() {
        return this._currentFirebaseUser ? this._currentFirebaseUser.uid : null;
    },

    isAdmin() {
        return this._currentFirebaseUser && this._currentFirebaseUser.email === 'sebarusso96@gmail.com';
    },

    showApp(user) {
        document.getElementById('page-login').classList.add('d-none');
        document.getElementById('navbar').classList.remove('d-none');
        document.getElementById('navUserName').textContent = user.name || user.email || 'Usuario';

        const adminItem = document.getElementById('navAdminItem');

        if (this.isAdmin()) {
            if (adminItem) adminItem.style.display = '';
            App.navigate('admin');
        } else {
            if (adminItem) adminItem.style.display = 'none';
            App.navigate('dashboard');
        }

        setTimeout(() => App.checkOnboarding(), 500);
    },

    showLogin() {
        document.getElementById('page-login').classList.remove('d-none');
        document.querySelectorAll('.page-section').forEach((s) => {
            if (s.id !== 'page-login') s.classList.add('d-none');
        });
        document.getElementById('navbar').classList.add('d-none');
    },

    async login(event) {
        event.preventDefault();

        const { signInWithEmailAndPassword } = window.firebaseExports;
        const auth = window.firebaseAuth;

        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            App.showToast('Completá todos los campos', 'warning');
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            App.showToast('¡Bienvenido!', 'success');
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
        } catch (err) {
            console.error('[Auth] Login error:', err);
            if (err.code === 'auth/user-not-found') {
                App.showToast('No existe una cuenta con ese email', 'danger');
            } else if (err.code === 'auth/wrong-password') {
                App.showToast('Contraseña incorrecta', 'danger');
            } else {
                App.showToast('Error al iniciar sesión', 'danger');
            }
        }
    },

    async register(event) {
        event.preventDefault();

        const { createUserWithEmailAndPassword } = window.firebaseExports;
        const { doc, setDoc } = window.firebaseExports;
        const auth = window.firebaseAuth;
        const db = window.firebaseDB;

        const name = document.getElementById('regName').value.trim();
        const specialty = document.getElementById('regSpecialty').value.trim();
        const email = document.getElementById('regEmail').value.trim().toLowerCase();
        const password = document.getElementById('regPassword').value;
        const passwordConfirm = document.getElementById('regPasswordConfirm').value;

        if (!name || !specialty || !email || !password || !passwordConfirm) {
            App.showToast('Completá todos los campos', 'warning');
            return;
        }

        if (password.length < 6) {
            App.showToast('La contraseña debe tener al menos 6 caracteres', 'warning');
            return;
        }

        if (password !== passwordConfirm) {
            App.showToast('Las contraseñas no coinciden', 'danger');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            await setDoc(doc(db, 'users', uid), {
                name: name,
                specialty: specialty,
                email: email,
                createdAt: new Date().toISOString()
            });

            App.showToast('¡Cuenta creada exitosamente!', 'success');

            document.getElementById('regName').value = '';
            document.getElementById('regSpecialty').value = '';
            document.getElementById('regEmail').value = '';
            document.getElementById('regPassword').value = '';
            document.getElementById('regPasswordConfirm').value = '';

            const loginTab = document.querySelector('[data-bs-target="#tabLogin"]');
            if (loginTab) bootstrap.Tab.getOrCreateInstance(loginTab).show();
        } catch (err) {
            console.error('[Auth] Register error:', err);
            if (err.code === 'auth/email-already-in-use') {
                App.showToast('Ya existe una cuenta con ese email', 'danger');
            } else {
                App.showToast('Error al crear la cuenta', 'danger');
            }
        }
    },

    async logout() {
        const confirmed = await App.confirmAction('¿Seguro que querés cerrar sesión?', {
            confirmText: 'Cerrar sesión',
            confirmColor: 'danger'
        });
        if (!confirmed) return;

        const { signOut } = window.firebaseExports;
        const auth = window.firebaseAuth;

        try {
            await signOut(auth);
            App.showToast('Sesión cerrada', 'info');
        } catch (err) {
            console.error('[Auth] Logout error:', err);
        }
    },

    async loginWithGoogle() {
        try {
            const { GoogleAuthProvider, signInWithPopup } = window.firebaseExports;
            const auth = window.firebaseAuth;
            const provider = new GoogleAuthProvider();

            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const { doc, getDoc, setDoc } = window.firebaseExports;
            const db = window.firebaseDB;

            const docSnap = await getDoc(doc(db, 'users', user.uid));
            if (!docSnap.exists()) {
                await setDoc(doc(db, 'users', user.uid), {
                    name: user.displayName || '',
                    email: user.email || '',
                    specialty: '',
                    photo: user.photoURL || '',
                    createdAt: new Date().toISOString()
                });
            }

            App.showToast('¡Bienvenido!', 'success');
        } catch (err) {
            console.error('[Auth] Google login error:', err);
            if (err.code !== 'auth/popup-closed-by-user') {
                App.showToast('Error al iniciar sesión con Google', 'danger');
            }
        }
    }
};
