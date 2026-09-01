# MisTurnos — RUNBOOK Operativo (Plan A)

> **Para retomar:** Copiá este archivo completo + el último bloque de `CHANGELOG.md` y pegalo al iniciar nueva conversación. Con eso tengo todo el contexto sin re-explicar.

## 1. Dónde está cada cosa
```
C:\Users\sebal\OneDrive\Desktop\AppAgenda\          <- REPO GIT (origin: Sebar96/MisTurnos, branch main)
└── MisTurnos/                                      <- APP (abrí VS Code AQUÍ para ver git)
    ├── index.html:1 / js/app.js:1 / sw.js:1
    ├── firebase.json:2 / manifest.json:5
    ├── RUNBOOK.md / CHANGELOG.md / PROJECT-INFO.md
    └── ...

C:\Users\sebal\OneDrive\Desktop\MisTurnos-API\       <- API Mercado Pago (Vercel)
    ├── api/ / package.json:1 / vercel.json:1
    └── Deploy: https://mis-turnos-api.vercel.app  (js/billing.js:10)
```
**Abrí siempre VS Code en `AppAgenda`**, no solo en `MisTurnos`, sino no ves `.git`.

## 2. URLs Producción
- **Firebase (primario, instantáneo):** https://misturnos-23c46.web.app — `firebase.json:2` `public:"."` `hosting` `misturnos-23c46`
- **GitHub Pages (espejo):** https://sebar96.github.io/MisTurnos/ — rama `gh-pages` via `gh-pages -d .` (puede tardar 2min, hoy falló runner `Páginas-Construcción-Despliegue` por outage GitHub)
- **Consola Firebase:** https://console.firebase.google.com/project/misturnos-23c46/overview

## 3. Stack
Frontend PWA (`index.html:1` Bootstrap 5 + vanilla JS) / Firebase Auth+Firestore+Hosting / Mercado Pago via Vercel API.

## 4. Cómo deployar (comando único)
```powershell
cd "C:\Users\sebal\OneDrive\Desktop\AppAgenda\MisTurnos"
firebase deploy --only hosting   # Firebase (siempre)
gh-pages -d .                    # Solo si cliente usa GH Pages (Barbara iOS)
# Alternativa doble clic: deploy.bat (excluido de hosting firebase.json:12 por plan Spark)
```
Hard reload cliente: `Ctrl+Shift+R` desktop / `Ajustes > Safari > Borrar historial` iOS.

## 5. Versionado
`js/app.js:74` `APP_VERSION: '2.1.1'` + `sw.js:6` `CACHE_NAME='misturnos-v9'` + `index.html:756` footer `<span id="appVersion">v2.1.1</span>`. Ver en footer + consola `[App] Inicializando MisTurnos...` `js/app.js:46`.

## 6. Cómo reportar error (plantilla 5 líneas)
```
Error en la app:
- Qué hice:
- Qué pasó:
- Error: [mensaje Admin > Errors o Console F12]
- Quién: [email]
- Cuándo: [fecha/hora]
- URL: [misturnos-23c46.web.app vs sebar96.github.io/MisTurnos]
- Versión: [footer vX.Y.Z]
```
Ver errores: `Admin:388` `Controles > Recent Errors` / `js/monitor.js:17` `errors` collection.

## 7. Flujo soporte rápido (cliente pago)
P0 App caída <2h, P1 Funcional (pCardiac) <24h, P2 Cosmético <1sem. SLA respuesta <4h.

## 8. Rollback
```powershell
git revert HEAD --no-edit; git push; firebase deploy --only hosting; gh-pages -d .
```

## 9. Contactos / Planes
- Admin: sebarusso96@gmail.com — Usuaria prueba: barbara.bronzi96@gmail.com
- Planes `js/billing.js:12`: Básico $5k/25 pac, Profesional $10k/50, Consultorio $15k/ilim.

## 10. Qué NO tocar en Plan A
No mover `.git` de `AppAgenda` a `MisTurnos` (Plan B). No crear GitHub Action automática aún.
