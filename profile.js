/*
 * PROFILE.JS - Firestore
 */

const Profile = {

    async load() {
        const uid = Auth.getUid();
        if (!uid) return;

        const { doc, getDoc } = window.firebaseExports;
        const db = window.firebaseDB;

        try {
            const docSnap = await getDoc(doc(db, 'users', uid));
            const profile = docSnap.exists() ? docSnap.data() : {};

            const user = Auth.getCurrentUser();
            if (!user) return;

            document.getElementById('profileName').value = profile.name || user.name || '';
            document.getElementById('profileSpecialty').value = profile.specialty || user.specialty || '';
            document.getElementById('profileEmail').value = profile.email || user.email || '';
            document.getElementById('profilePhone').value = profile.phone || '';
            document.getElementById('profileAddress').value = profile.address || '';
            document.getElementById('profileMapUrl').value = profile.mapUrl || '';
            document.getElementById('profileInstagram').value = profile.instagram || '';
            document.getElementById('profileFacebook').value = profile.facebook || '';
            document.getElementById('profileLinkedIn').value = profile.linkedin || '';

            const photoPreview = document.getElementById('profilePhotoPreview');
            if (profile.photo) {
                photoPreview.src = profile.photo;
            }

            document.getElementById('profileNameDisplay').textContent = profile.name || user.name;
            document.getElementById('profileSpecialtyDisplay').textContent = profile.specialty || user.specialty;

            this.updateMapPreview(profile.mapUrl || '');
        } catch (err) {
            console.error('[Profile] Error loading:', err);
        }
    },

    async save(event) {
        event.preventDefault();

        const { doc, setDoc } = window.firebaseExports;
        const db = window.firebaseDB;
        const uid = Auth.getUid();

        const profile = {
            name: document.getElementById('profileName').value.trim(),
            specialty: document.getElementById('profileSpecialty').value.trim(),
            email: document.getElementById('profileEmail').value.trim(),
            phone: document.getElementById('profilePhone').value.trim(),
            address: document.getElementById('profileAddress').value.trim(),
            mapUrl: document.getElementById('profileMapUrl').value.trim(),
            instagram: document.getElementById('profileInstagram').value.trim(),
            facebook: document.getElementById('profileFacebook').value.trim(),
            linkedin: document.getElementById('profileLinkedIn').value.trim()
        };

        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data().photo) {
                profile.photo = userSnap.data().photo;
            }

            await setDoc(userRef, profile, { merge: true });

            document.getElementById('navUserName').textContent = profile.name;
            document.getElementById('profileNameDisplay').textContent = profile.name;
            document.getElementById('profileSpecialtyDisplay').textContent = profile.specialty;

            this.updateMapPreview(profile.mapUrl);

            App.showToast('Perfil guardado correctamente', 'success');
        } catch (err) {
            console.error('[Profile] Error saving:', err);
            App.showToast('Error al guardar el perfil', 'danger');
        }
    },

    handlePhoto(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            App.showToast('El archivo debe ser una imagen', 'warning');
            return;
        }

        if (file.size > 500 * 1024) {
            App.showToast('La imagen no debe superar los 500KB', 'warning');
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            const base64 = e.target.result;

            this.resizeImage(base64, 200, 200).then(async (resized) => {
        const { doc, setDoc, getDoc } = window.firebaseExports;
                const db = window.firebaseDB;
                const uid = Auth.getUid();

                try {
                    await setDoc(doc(db, 'users', uid), {
                        photo: resized
                    }, { merge: true });

                    document.getElementById('profilePhotoPreview').src = resized;
                    App.showToast('Foto de perfil actualizada', 'success');
                } catch (err) {
                    console.error('[Profile] Error saving photo:', err);
                    App.showToast('Error al guardar la foto', 'danger');
                }
            });
        };

        reader.readAsDataURL(file);
    },

    resizeImage(base64, maxWidth, maxHeight) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = base64;
        });
    },

    updateMapPreview(mapUrl) {
        const container = document.getElementById('profileMapContainer');
        const iframe = document.getElementById('profileMapFrame');

        if (!mapUrl) {
            container.classList.add('d-none');
            return;
        }

        let embedUrl = mapUrl;

        if (mapUrl.includes('@')) {
            const match = mapUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
            if (match) {
                embedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${match[2]}!3d${match[1]}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1`;
            }
        }

        iframe.src = embedUrl;
        container.classList.remove('d-none');
    }
};
