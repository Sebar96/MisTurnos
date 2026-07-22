# 📅 MisTurnos

> **Tu agenda profesional, siempre a mano.**

**MisTurnos** es una Progressive Web App (PWA) diseñada para profesionales independientes que necesitan gestionar sus turnos de forma simple, rápida y sin depender de un servidor. Ideal para médicos, psicólogos, nutricionistas, kinesiólogos, abogados y cualquier profesional que atienda con cita previa.

---

## ✨ Funcionalidades Implementadas

### 🔐 Autenticación
- Registro con nombre, especialidad, email y contraseña
- Inicio de sesión con validación de credenciales
- Sesión persistente (no se desloguea al cerrar el navegador)

### 📊 Dashboard
- Resumen visual con 4 tarjetas de estadísticas:
  - Turnos del día
  - Turnos de la semana
  - Total de pacientes activos
  - Turnos pendientes (programados + confirmados)
- Lista de próximos turnos del día ordenados por hora
- Acciones rápidas: nuevo turno, nuevo paciente, enviar recordatorios

### 🧙 Wizard de Turnos (Turno → Paciente → Listo)
- **Paso 1:** Buscar paciente existente por nombre o teléfono
- **Paso 2:** Si no existe, botón **"Crear paciente rápido"** (solo nombre y teléfono)
- **Paso 3:** Seleccionar fecha, hora, motivo y notas
- Flujo rápido y sin fricciones para asignar turnos

### 👥 Gestión de Pacientes
- Alta, baja y edición de pacientes
- Campos: nombre, teléfono, email, obra social, motivo de consulta
- Búsqueda en tiempo real por nombre, teléfono o email
- Filtros por estado (activo/inactivo) y obra social
- Botón de **WhatsApp directo** en cada tarjeta
- Botón para crear turno rápido desde la tarjeta del paciente

### 📆 Gestión de Turnos
- Crear turno con selección de paciente, fecha y hora
- Modificar turno existente
- Reprogramar turno (cambiar fecha/hora)
- Cancelar turno con **aviso previo de 30 minutos**
- Detección de conflictos de horario (no permite dos turnos iguales)
- Estados del turno:
  - 🟦 **Programado** — recién creado
  - 🟩 **Confirmado** — el paciente confirmó
  - ⬜ **Realizado** — se cumplió el turno
  - 🟥 **Cancelado** — se canceló

### 👤 Perfil del Profesional
- Nombre completo y especialidad
- Teléfono de contacto
- Dirección del consultorio
- Link de Google Maps con mapa embebido
- Redes sociales: Instagram, Facebook, LinkedIn
- Foto de perfil (subir imagen, se redimensiona automáticamente)

### 📱 WhatsApp Integrado
- Botón de WhatsApp directo en tarjetas de pacientes
- Envío de **recordatorios por WhatsApp** el día anterior al turno
- Mensaje de cancelación automática por WhatsApp
- Links de WhatsApp prellenados con mensaje personalizado

### 🌙 Modo Oscuro / Claro
- Toggle con un clic en la barra de navegación
- Respeta la preferencia del sistema operativo
- Se guarda la elección para futuras sesiones

### 💾 Backup de Datos
- **Exportar** todos los datos como archivo `.json`
- **Importar** datos desde un archivo de backup
- Incluye: perfil, pacientes y turnos

### 📲 PWA (Progressive Web App)
- **Instalable** en celular, tablet y PC
- Aparece como app independiente (sin barra de navegador)
- Icono personalizado "MT" en azul-indigo
- **Service Worker** para funcionamiento offline
- Cache de archivos estáticos para carga instantánea

### 📱 Responsive
- Se adapta a celular, tablet y PC
- Navegación colapsable en móvil (menú hamburguesa)
- Tarjetas y formularios que se reorganizan según el tamaño de pantalla

---

## 🛠️ Tecnologías

| Tecnología | Uso |
|---|---|
| **HTML5** | Estructura semántica de la aplicación |
| **CSS3** | Estilos personalizados con variables CSS (temas oscuro/claro) |
| **JavaScript vanilla** | Toda la lógica de la aplicación (sin frameworks) |
| **Bootstrap 5.3** | Grid responsive, modales, formularios, componentes UI |
| **Bootstrap Icons** | Iconografía de la interfaz |
| **Google Fonts (Inter)** | Tipografía moderna y legible |
| **Service Worker** | Caché offline y funcionamiento sin conexión |
| **localStorage** | Almacenamiento local de todos los datos (sin servidor) |

---

## 📁 Estructura del Proyecto

```
MisTurnos/
│
├── index.html              ← Archivo principal (SPA con todas las secciones)
├── manifest.json           ← Configuración PWA (nombre, iconos, colores)
├── sw.js                   ← Service Worker (caché offline)
├── generate-icons.js       ← Script para generar iconos PNG (Node.js)
│
├── css/
│   └── styles.css          ← Estilos custom + modo oscuro/claro + responsive
│
├── js/
│   ├── app.js              ← Cerebro principal: init, navegación, tema, export/import
│   ├── auth.js             ← Registro, login, logout, hash de contraseñas
│   ├── patients.js         ← CRUD de pacientes, búsqueda, filtros, creación rápida
│   ├── appointments.js     ← CRUD de turnos, wizard, estados, recordatorios
│   └── profile.js          ← Perfil profesional, foto, mapa, redes sociales
│
└── img/
    ├── icon-192x192.png    ← Icono PWA 192x192px
    └── icon-512x512.png    ← Icono PWA 512x512px
```

### Descripción de cada archivo

| Archivo | Descripción |
|---|---|
| `index.html` | Punto de entrada. Contiene todas las secciones (login, dashboard, pacientes, turnos, perfil) como divs que se muestran/ocultan con JavaScript. Incluye el modal genérico y los toasts de notificación. |
| `manifest.json` | Define los metadatos de la PWA: nombre, iconos, color de tema, modo display. Permite que el navegador ofrezca "Instalar app". |
| `sw.js` | Service Worker que cachea todos los archivos estáticos. Usa estrategia "Cache First" para que la app funcione sin conexión a internet. |
| `css/styles.css` | Estilos personalizados con CSS custom properties para el modo oscuro/claro. Incluye animaciones, scrollbar personalizada y estilos responsive. |
| `js/app.js` | Funciones utilitarias: generación de IDs, formateo de fechas, navegación SPA, toggle de tema, export/import de datos, envío de recordatorios WhatsApp, y registro del Service Worker. |
| `js/auth.js` | Manejo de sesiones: registro de usuarios (con hash de contraseña), inicio de sesión, cierre de sesión, y persistencia de sesión en localStorage. |
| `js/patients.js` | Gestión completa de pacientes: crear, editar, buscar, filtrar, activar/desactivar, y creación rápida (solo nombre + teléfono) para el wizard de turnos. |
| `js/appointments.js` | Gestión de turnos con wizard de 2 pasos: selección de paciente → fecha/hora. Incluye estados, reprogramación, cancelación con aviso, y detección de conflictos horarios. |
| `js/profile.js` | Editor de perfil profesional: datos personales, ubicación del consultorio con mapa embebido, redes sociales, y subida de foto de perfil con redimensionamiento automático. |
| `generate-icons.js` | Script de Node.js que genera los iconos PNG del proyecto desde cero, sin dependencias externas. Dibuja las letras "MT" en un círculo azul-indigo. |

---

## 🚀 Cómo Ejecutar la App

### Opción 1: Live Server (recomendado)

1. Instalar [Visual Studio Code](https://code.visualstudio.com/)
2. Instalar la extensión **Live Server** desde el marketplace
3. Abrir la carpeta `MisTurnos` en VS Code
4. Hacer clic derecho en `index.html` → **"Open with Live Server"**
5. Se abrirá la app en `http://127.0.0.1:5500`

> ⚠️ **¿Por qué Live Server?** El Service Worker solo funciona bajo protocolo HTTP, no con archivos directos (`file://`). Live Server simula un servidor local.

### Opción 2: Python (alternativa)

```bash
cd MisTurnos
python -m http.server 8000
```

Abrir `http://localhost:8000` en el navegador.

### Opción 3: Node.js (alternativa)

```bash
npx serve MisTurnos
```

---

## 📖 Cómo Usar la App

### 1️⃣ Registrarse
1. Abrir la app y hacer clic en la pestaña **"Registrarse"**
2. Completar nombre, especialidad, email y contraseña
3. Hacer clic en **"Crear Cuenta"**
4. Volver a la pestaña **"Iniciar Sesión"** y entrar con tus datos

### 2️⃣ Completar el Perfil
1. Ir a **Perfil** desde el menú superior
2. Completar datos del consultorio, redes sociales y subir foto
3. Guardar cambios

### 3️⃣ Crear un Paciente
1. Ir a **Pacientes** → **"Nuevo Paciente"**
2. Completar nombre, teléfono y demás datos
3. Guardar

### 4️⃣ Asignar un Turno
1. Ir a **Turnos** → **"Nuevo Turno"** (o desde el Dashboard)
2. **Paso 1:** Buscar y seleccionar el paciente en la lista
   - Si no lo encontrás, hacé clic en **"Crear paciente rápido"**
3. **Paso 2:** Elegir fecha, hora y opcionalmente motivo/notas
4. Hacer clic en **"Crear Turno"** ✅

### 5️⃣ Gestionar el Turno
- **Confirmar:** marcá el turno como confirmado cuando el paciente avise
- **Reprogramar:** cambia fecha y hora sin perder los datos
- **Cancelar:** con aviso previo de 30 minutos + opción de WhatsApp

### 6️⃣ Enviar Recordatorios
- Desde el Dashboard, hacé clic en **"Enviar Recordatorios"**
- Se abren ventanas de WhatsApp con el mensaje para cada paciente con turno mañana

---

## 🔮 Próximos Pasos

- [ ] 🗺️ **Google Maps API** — Geolocalización exacta del consultorio
- [ ] 📧 **EmailJS** — Envío de recordatorios por email además de WhatsApp
- [ ] 📅 **Google Calendar** — Sincronización bidireccional con el calendario
- [ ] 👥 **Múltiples profesionales** — Panel de administración para clínicas
- [ ] 🔔 **Notificaciones push** — Alertas nativas del navegador
- [ ] 📊 **Reportes y estadísticas** — Gráficos de asistencia, ingresos, etc.
- [ ] 💳 **Turnos online** — Link público para que pacientes pidan turnos solos
- [ ] 🌐 **Multi-idioma** — Soporte para español, inglés y portugués

---

## 👨‍💻 Autor

**Sebastián**
Estudiante de **Analista Programador Universitario** — UNLP
Año 2026

---

## 📄 Licencia

Este es un proyecto de uso libre y educativo.
