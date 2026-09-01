# CHANGELOG — MisTurnos

## v2.1.5 - 2026-08-30 - sw v13
- perf: `js/patients.js:38` `getAll` `Promise.race 6s` evita skeletons eternos en móvil (reporte 19:46).
- feat: `js/app.js:78` `sw.js?v` + `firebase.json:14` `sw.js no-cache` fuerza actualización sin borrar caché.

## v2.1.4 - 2026-08-30 - sw v12
- fix: `js/app.js:78` `updateViaCache:'none'` + `firebase.json:14` `sw.js no-cache` para PWA instalada en GH Pages (`sebar96.github.io/MisTurnos`).

## v2.1.3 - 2026-08-30 - sw v11
- feat: auto-update transparente `sw.js:71` `networkFirst` index + `js/app.js:94` `controllerchange` + banner 3s `js/app.js:99`.
- fix: GH Pages `Source: gh-pages branch` (antes `Actions` fallaba `Páginas-Construcción`).

## v2.1.2 - 2026-08-30 - sw v10
- fix: anti-cuelgue `js/patients.js:335` `canAddPatient` timeout 8s + spinner + `js/patients.js:387` modal safe `getInstance || new Modal`.

## v2.1.1 - 2026-08-30 - sw v9
- fix: `js/patients.js:316` null-check total en prefill (`_set` helper) corrige `Cannot set properties of null (setting 'value')` 30/08 12:44.
- feat: PWA `manifest.json:5-6` `start_url/scope "./"` para Firebase `cleanUrls:true` `firebase.json:35`.
- fix: CSP `index.html:8` agrega `https://cdn.jsdelivr.net` a `connect-src` (bloqueaba sourcemap bootstrap).
- footer: `index.html:756` badge `v2.1.1` visible + `js/app.js:74` `APP_VERSION`.

## v2.1.0 - 2026-08-30 - sw v8
- feat: banner actualización visible `js/app.js:92` degradado + `css/styles.css:864` `slideUp` + check periódico 5min `js/app.js:84`.
- fix: footer versión `index.html:756` + `js/app.js:49`.
- chore: `jsconfig.json:1` + `.vscode/settings.json:1` silencia TS en JS.

## v2.0.1 - 2026-08-30 - sw v7
- fix: `js/app.js:107` banner duplicado `</button>` causaba 107 errores TS.
- fix: `js/patients.js:323` null-check `pCardiac`/`pCardiacDetail`/`pDiseases`/`pAllergies`/`pMedication` para `needsMedicalData=false`.
- fix: `js/appointments.js:244` `filter()` duplicado que sobreescribía `filter:217`.
- fix: `firebase.json:12` excluye `deploy.bat` (Spark prohíbe ejecutables).
- deploy: Firebase + GH Pages `df5f4e5`, `e87055c`.

## v2.0.0 - 2026-08-28
- Base estable con 2 profesionales, 8 pacientes, 0 errores tras fixes. Dashboard `Admin:388`.
