/*
 * ============================================================
 * PROFILE.JS - PERFIL DEL PROFESIONAL
 * ============================================================
 * Maneja todo lo relacionado con el perfil del profesional:
 * - Nombre y especialidad
 * - Dirección del consultorio
 * - Link de Google Maps (con iframe embebido)
 * - Redes sociales (Instagram, Facebook, LinkedIn)
 * - Foto de perfil (se guarda en localStorage como base64)
 *
 * Los datos se guardan en localStorage con la clave
 * 'misturnos_profile' como un objeto.
 *
 * ¿Qué es base64?
 * Es una forma de convertir una imagen en texto.
 * Por ejemplo, una foto de 10KB se convierte en un string
 * de ~13,000 caracteres. No es eficiente para archivos grandes,
 * pero para una foto de perfil funciona perfecto.
 * ============================================================
 */

const Profile = {

    // ============================================================
    // CARGAR PERFIL
    // ============================================================

    /**
     * load()
     * Carga los datos del perfil en el formulario.
     * Se llama cada vez que se navega a la sección de perfil.
     */
    load() {
        // Obtener datos del perfil guardado
        const profile = JSON.parse(localStorage.getItem('misturnos_profile') || '{}');

        // Obtener datos del usuario logueado
        const user = Auth.getCurrentUser();
        if (!user) return;

        // Llenar los campos del formulario con los datos guardados
        // Si no hay dato guardado, usar el del usuario o dejar vacío
        document.getElementById('profileName').value = profile.name || user.name || '';
        document.getElementById('profileSpecialty').value = profile.specialty || user.specialty || '';
        document.getElementById('profileEmail').value = profile.email || user.email || '';
        document.getElementById('profilePhone').value = profile.phone || '';
        document.getElementById('profileAddress').value = profile.address || '';
        document.getElementById('profileMapUrl').value = profile.mapUrl || '';
        document.getElementById('profileInstagram').value = profile.instagram || '';
        document.getElementById('profileFacebook').value = profile.facebook || '';
        document.getElementById('profileLinkedIn').value = profile.linkedin || '';

        // Mostrar la foto de perfil (o el avatar por defecto)
        const photoPreview = document.getElementById('profilePhotoPreview');
        if (profile.photo) {
            photoPreview.src = profile.photo;
        }

        // Mostrar nombre y especialidad debajo de la foto
        document.getElementById('profileNameDisplay').textContent = profile.name || user.name;
        document.getElementById('profileSpecialtyDisplay').textContent = profile.specialty || user.specialty;

        // Mostrar el mini mapa si hay URL
        this.updateMapPreview(profile.mapUrl || '');
    },

    // ============================================================
    // GUARDAR PERFIL
    // ============================================================

    /**
     * save(event)
     * Guarda todos los datos del perfil en localStorage.
     *
     * @param {Event} event - Evento del formulario
     */
    save(event) {
        event.preventDefault();

        // Recopilar todos los valores del formulario
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

        // Obtener la foto actual (si existe, conservarla)
        const currentProfile = JSON.parse(localStorage.getItem('misturnos_profile') || '{}');
        if (currentProfile.photo) {
            profile.photo = currentProfile.photo;
        }

        // Guardar en localStorage
        localStorage.setItem('misturnos_profile', JSON.stringify(profile));

        // Actualizar el nombre en el navbar
        document.getElementById('navUserName').textContent = profile.name;

        // Actualizar la visualización
        document.getElementById('profileNameDisplay').textContent = profile.name;
        document.getElementById('profileSpecialtyDisplay').textContent = profile.specialty;

        // Actualizar el mapa
        this.updateMapPreview(profile.mapUrl);

        App.showToast('Perfil guardado correctamente', 'success');
    },

    // ============================================================
    // FOTO DE PERFIL
    // ============================================================

    /**
     * handlePhoto(event)
     * Procesa la imagen que el usuario sube como foto de perfil.
     * La convierte a base64 y la guarda en localStorage.
     *
     * ¿Por qué base64 y no un archivo?
     * Porque localStorage solo almacena TEXTO. No podemos guardar
     * un archivo .jpg directamente. Base64 convierte la imagen
     * en una cadena de texto que representa la imagen.
     *
     * @param {Event} event - Evento del input file
     */
    handlePhoto(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Verificar que sea una imagen
        if (!file.type.startsWith('image/')) {
            App.showToast('El archivo debe ser una imagen', 'warning');
            return;
        }

        // Verificar tamaño máximo (500KB para no llenar localStorage)
        if (file.size > 500 * 1024) {
            App.showToast('La imagen no debe superar los 500KB', 'warning');
            return;
        }

        // FileReader lee el archivo y lo convierte a base64
        const reader = new FileReader();

        reader.onload = (e) => {
            const base64 = e.target.result;

            // Reducir el tamaño de la imagen si es necesario
            this.resizeImage(base64, 200, 200).then((resized) => {
                // Guardar en el perfil
                const profile = JSON.parse(localStorage.getItem('misturnos_profile') || '{}');
                profile.photo = resized;
                localStorage.setItem('misturnos_profile', JSON.stringify(profile));

                // Actualizar la vista
                document.getElementById('profilePhotoPreview').src = resized;

                App.showToast('Foto de perfil actualizada', 'success');
            });
        };

        // Iniciar la lectura del archivo
        reader.readAsDataURL(file);
    },

    /**
     * resizeImage(base64, maxWidth, maxHeight)
     * Reduce el tamaño de una imagen usando un canvas.
     * Esto es importante para no llenar localStorage.
     *
     * @param {string} base64 - Imagen en base64
     * @param {number} maxWidth - Ancho máximo en píxeles
     * @param {number} maxHeight - Alto máximo en píxeles
     * @returns {Promise<string>} Imagen redimensionada en base64
     */
    resizeImage(base64, maxWidth, maxHeight) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                // Calcular nuevas dimensiones manteniendo la proporción
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

                // Crear un canvas y dibujar la imagen reducida
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convertir el canvas a base64 (calidad 0.8 = 80%)
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = base64;
        });
    },

    // ============================================================
    // MAPA INTEGRADO
    // ============================================================

    /**
     * updateMapPreview(mapUrl)
     * Si hay una URL de Google Maps, muestra un iframe embebido.
     * Si no hay URL, oculta el contenedor del mapa.
     *
     * ¿Cómo funciona el mapa embebido?
     * Google Maps permite "embeber" un mapa usando un iframe.
     * El usuario copia la URL de Google Maps y nosotros la
     * convertimos en una URL de embed.
     *
     * @param {string} mapUrl - URL de Google Maps
     */
    updateMapPreview(mapUrl) {
        const container = document.getElementById('profileMapContainer');
        const iframe = document.getElementById('profileMapFrame');

        if (!mapUrl) {
            container.classList.add('d-none');
            return;
        }

        // Convertir URL normal de Google Maps a URL de embed
        let embedUrl = mapUrl;

        // Si tiene el formato de búsqueda, extraer las coordenadas
        if (mapUrl.includes('@')) {
            // Formato: https://www.google.com/maps/place/...@lat,lng,17z
            const match = mapUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
            if (match) {
                embedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${match[2]}!3d${match[1]}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1`;
            }
        }

        // Si es un link corto (maps.app.goo.gl), usar el original
        // Los iframes no aceptan links cortos, pero funciona como fallback
        iframe.src = embedUrl;
        container.classList.remove('d-none');
    }
};
