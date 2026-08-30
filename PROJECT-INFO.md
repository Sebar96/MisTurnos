# MisTurnos - Referencia del Proyecto

## Stack
- **Frontend**: HTML + Bootstrap 5 + JavaScript vanilla (PWA)
- **Backend**: Firebase (Auth + Firestore + Hosting)
- **Pagos**: Mercado Pago via API en Vercel
- **API**: https://mis-turnos-api.vercel.app

## Estructura de archivos
```
MisTurnos/
├── index.html          # App principal (SPA)
├── landing.html        # Página de venta
├── admin.html          # Panel admin (separate)
├── sw.js               # Service Worker (PWA)
├── manifest.json       # PWA manifest
├── firebase.json       # Config Firebase Hosting
├── .firebaserc         # Proyecto Firebase: misturnos-23c46
├── css/
│   ├── styles.css      # Estilos principales
│   └── landing.css     # Estilos landing
├── js/
│   ├── app.js          # Lógica principal, navegación, utils
│   ├── auth.js         # Login/registro con Firebase Auth
│   ├── patients.js     # CRUD pacientes (Firestore)
│   ├── appointments.js # CRUD turnos (Firestore)
│   ├── profile.js      # Perfil del profesional
│   ├── billing.js      # Sistema de planes/pagos
│   ├── admin.js        # Panel de administración
│   ├── monitor.js      # Sistema de errores y alertas
│   ├── messages.js     # WhatsApp messages
│   └── i18n.js         # Internacionalización (ES/EN)
├── img/                # Iconos y logos
└── deploy.bat          # Script para subir cambios
```

## Cómo deployar
```bash
# Desde la carpeta MisTurnos:
firebase deploy --only hosting

# O doble clic en deploy.bat
```

## Proyecto Firebase
- **Nombre**: misturnos-23c46
- **URL**: https://misturnos-23c46.web.app
- **Consola**: https://console.firebase.google.com/project/misturnos-23c46/overview

## GitHub
- **Repo**: https://github.com/Sebar96/MisTurnos
- **Rama principal**: main

## Usuarios registrados
- sebarusso96@gmail.com (admin)
- barbara.bronzi96@gmail.com

## Planes de pago
| Plan | Precio | Pacientes | Usuarios |
|------|--------|-----------|----------|
| Básico | $5.000/mes | 25 | 1 |
| Profesional | $10.000/mes | 50 | 2 |
| Consultorio | $15.000/mes | Ilimitados | 3 |

## Bugs corregidos (histórico)
1. **pCardiac null error** - campos médicos crasheaban si needsMedicalData=false → null-checks
2. **filter() duplicado** - filtros de turnos no funcionaban → eliminado duplicado
3. **deploy.bat bloqueado** - Firebase Spark no permite .bat → excluido de firebase.json

## Notas importantes
- Los datos médicos (cardiac, diseases, allergies, medication) son opcionales
- Se muestran solo si el usuario activa "needsMedicalData" en perfil
- El modal de pacientes se genera dinámicamente con innerHTML
- La app tiene sistema de cache con TTL de 5 minutos
- Login con email/password y Google
- Sistema de onboarding para nuevos usuarios
- Export/import de datos en JSON

---

## Cómo reportar errores (copia y pegá esto)

Cuando tengas un error, decime algo como:

```
Error en la app:
- Qué hice: [ej: "abrí un paciente para editarlo"]
- Qué pasó: [ej: "no se abrió, salto error"]
- Error: [pegá el mensaje de error del admin o consola]
- Quién: [email del usuario]
- Cuándo: [fecha/hora]
```

### Ejemplo:
```
Error en la app:
- Qué hice: guardé un paciente nuevo
- Qué pasó: se borró el formulario sin guardar
- Error: null is not an object (evaluating 'pCardiac.value')
- Quién: barbara.bronzi96@gmail.com
- Cuándo: 28/8/2026, 09:04
```

### Dónde ver errores:
1. **Panel Admin** → pestaña "Errores" → ahí aparecen todos
2. **Consola del navegador** → F12 → pestaña Console
3. **Firebase Console** → Firestore → colección "errors"

### Para subir correcciones:
1. Yo corrijo el código
2. Vos hacé doble clic en `deploy.bat`
3. Listo, queda online
