# 📅 MisTurnos

> **Tu agenda profesional, siempre a mano.**

**MisTurnos** es una Progressive Web App (PWA) diseñada para profesionales independientes que necesitan gestionar sus turnos de forma simple, rápida y en la nube. Ideal para médicos, odontólogos, psicólogos, nutricionistas, kinesiólogos, abogados y cualquier profesional que atienda con cita previa.

---

## ✨ Funcionalidades

### 🔐 Autenticación (Firebase)
- Registro con nombre, especialidad, email y contraseña
- Inicio de sesión con Firebase Authentication
- Datos guardados en la nube (Firestore)
- Acceso desde cualquier dispositivo

### 📊 Dashboard
- Resumen visual con 3 tarjetas de estadísticas:
  - Turnos del día
  - Turnos de la semana
  - Turnos pendientes (programados + confirmados)
- **Feed inicial muestra solo turnos de HOY**
- Acciones rápidas: nuevo turno, nuevo paciente, enviar recordatorios

### 🧙 Wizard de Turnos
- **Paso 1:** Buscar paciente existente por nombre o teléfono
- **Paso 2:** Si no existe, botón **"Crear paciente rápido"**
- **Paso 3:** Seleccionar fecha, hora, motivo y notas
- Flujo rápido y sin fricciones

### 👥 Gestión de Pacientes
- Alta, baja y edición de pacientes
- Campos completos:
  - Nombre, teléfono, email
  - Obra social / Prepaga
  - **Cardiopatía** (sí/no + detalle)
  - **Enfermedades** (texto libre)
  - **Alergias** (texto libre)
  - **Medicación actual** (texto libre)
  - **Observaciones** (texto libre)
- Búsqueda en tiempo real
- Filtros por estado y obra social
- Botón de WhatsApp directo
- Botón para crear turno rápido

### 📆 Gestión de Turnos
- Crear turno con selección de paciente, fecha y hora
- Modificar turno existente
- Reprogramar turno
- Cancelar turno con aviso previo de 30 minutos
- Detección de conflictos de horario
- Estados: Programado → Confirmado → Realizado / Cancelado

### 📱 Mensajes WhatsApp Prearmados
- **Confirmar turno** — mensaje para confirmar con el paciente
- **Reprogramar turno** — mensaje para reprogramar
- **Cancelar turno (profesional)** — cuando el profesional cancela
- **Cancelar turno (paciente)** — cuando el paciente cancela
- **Recordatorio** — día anterior al turno
- Cada mensaje tiene botón **"Copiar"** → se pega en WhatsApp
- **El profesional puede editar el mensaje antes de enviar**

### 🗓️ Vista del Día
- Feed inicial muestra solo turnos de HOY
- Sección "Turnos" muestra todos
- A medida que confirma/cancela, el turno desaparece del feed del día
- El paciente queda registrado para futuros turnos

### 👤 Perfil del Profesional
- Nombre completo y especialidad
- Teléfono de contacto
- Dirección del consultorio
- Link de Google Maps con mapa embebido
- Redes sociales: Instagram, Facebook, LinkedIn
- Foto de perfil (redimensionamiento automático)

### 🌙 Modo Oscuro / Claro
- Toggle con un clic
- Respeta la preferencia del sistema
- Se guarda la elección

### 💾 Backup de Datos
- Exportar todos los datos como archivo `.json`
- Importar datos desde un archivo de backup
- Incluye: perfil, pacientes y turnos

### 📲 PWA
- Instalable en celular, tablet y PC
- Aparece como app independiente
- Service Worker para funcionamiento offline
- Cache de archivos estáticos

---

## 🔒 Seguridad

### Seguridad de Datos
- Cada usuario solo ve SUS datos (pacientes, turnos, perfil)
- Firestore rules: solo podés leer/escribir tu propia carpeta
- Datos guardados en la nube (no en el dispositivo)

### Seguridad de Cuentas
- Login con email/contraseña (Firebase Authentication)
- Contraseña mínima 6 caracteres
- Sesión persistente

### Panel de Administrador (URL separada)
- Login separado con doble factor
- Solo el administrador accede
- Gestión de usuarios, pagos, errores

---

## 📊 Panel de Administrador

### Métricas
| Métrica | Descripción |
|---------|-------------|
| Profesionales activos | Total, nuevos este mes, dados de baja |
| Uso de la app | Turnos creados (hoy/semana/mes), pacientes totales |
| Errores | Errores de login, errores al guardar, caídas |
| Pagos | Quién pagó, quién no, próximo vencimiento |

### Funciones
- Ver lista de todos los profesionales
- Ver/eliminar cuentas
- Gestionar suscripciones
- Subir comprobantes de pago
- Ver errores y alertas

---

## 🔔 Monitoreo y Alertas

- Cada error se registra en Firestore con fecha, tipo y detalle
- Si hay más de 3 errores en 1 hora → email automático al administrador
- Panel de errores visible en el admin

---

## 💳 Suscripciones y Pagos

### Paquetes

| Paquete | Precio | Límite |
|---------|--------|--------|
| **Básico** | $8,000/mes | 100 pacientes |
| **Profesional** | $12,000/mes | Pacientes ilimitados |
| **Consultorio** | $18,000/mes | 3 usuarios, pacientes ilimitados |

### Métodos de Pago
- Mercado Pago
- Transferencia bancaria

### Lo que ven los profesionales
- Badge con su paquete actual
- Fecha de vencimiento
- Botón para upgrade

---

## 🛠️ Tecnologías

| Tecnología | Uso |
|---|---|
| **HTML5** | Estructura semántica |
| **CSS3** | Estilos con variables CSS (temas oscuro/claro) |
| **JavaScript vanilla** | Toda la lógica (sin frameworks) |
| **Bootstrap 5.3** | Grid responsive, modales, formularios |
| **Bootstrap Icons** | Iconografía |
| **Google Fonts (Inter)** | Tipografía moderna |
| **Firebase Authentication** | Login/registro de usuarios |
| **Firebase Firestore** | Base de datos en la nube |
| **Service Worker** | Caché offline |
| **GitHub Pages** | Hosting gratuito |

---

## 📁 Estructura del Proyecto

```
MisTurnos/
│
├── index.html              ← Archivo principal (SPA)
├── admin.html              ← Panel de administrador
├── manifest.json           ← Configuración PWA
├── sw.js                   ← Service Worker (caché offline)
│
├── css/
│   └── styles.css          ← Estilos custom + modo oscuro/claro
│
├── js/
│   ├── app.js              ← Lógica principal, navegación, tema
│   ├── auth.js             ← Firebase Authentication
│   ├── patients.js         ← CRUD pacientes (Firestore)
│   ├── appointments.js     ← CRUD turnos (Firestore)
│   ├── profile.js          ← Perfil profesional (Firestore)
│   ├── messages.js         ← Mensajes WhatsApp prearmados
│   ├── monitor.js          ← Sistema de errores y alertas
│   ├── billing.js          ← Suscripciones y pagos
│   └── admin.js            ← Lógica del panel admin
│
└── img/
    ├── icon-192x192.png    ← Icono PWA 192x192px
    └── icon-512x512.png    ← Icono PWA 512x512px
```

---

## 📖 Cómo Usar la App

### 1️⃣ Registrarse
1. Abrir la app y hacer clic en **"Registrarse"**
2. Completar nombre, especialidad, email y contraseña
3. Hacer clic en **"Crear Cuenta"**

### 2️⃣ Completar el Perfil
1. Ir a **Perfil**
2. Completar datos del consultorio, redes sociales y foto
3. Guardar

### 3️⃣ Crear un Paciente
1. Ir a **Pacientes** → **"Nuevo Paciente"**
2. Completar nombre, teléfono y datos médicos
3. Guardar

### 4️⃣ Asignar un Turno
1. Ir a **Turnos** → **"Nuevo Turno"**
2. Buscar y seleccionar el paciente
3. Elegir fecha, hora y detalles
4. **"Crear Turno"** ✅

### 5️⃣ Enviar Mensajes WhatsApp
1. Ir a **Turnos** y seleccionar un turno
2. Hacer clic en el botón de WhatsApp
3. Elegir tipo de mensaje (confirmar, reprogramar, cancelar)
4. Copiar el mensaje
5. Pegar en WhatsApp y enviar

### 6️⃣ Vista del Día
1. El feed inicial muestra solo turnos de HOY
2. A medida que confirma/cancela, desaparecen del feed
3. En **Turnos** ve todos los turnos

---

## 🗺️ Roadmap

### FASE 1 — Completada ✅
- [x] App PWA con login/registro
- [x] Dashboard con estadísticas
- [x] Gestión de pacientes y turnos
- [x] WhatsApp integrado
- [x] Firebase Authentication + Firestore

### FASE 2 — En progreso 🔧
- [x] Cambios en dashboard (quitar cuadrito Pacientes)
- [x] Campos nuevos en pacientes (cardiopatía, enfermedades, alergias, medicación)
- [x] Mensajes WhatsApp prearmados con botón copiar
- [ ] Vista del día (solo turnos de hoy en feed)
- [ ] Panel de administrador
- [ ] Sistema de monitoreo y alertas
- [ ] Sistema de suscripciones y pagos

### FASE 3 — Futuro
- [ ] EmailJS para recordatorios por email
- [ ] Google Calendar sync
- [ ] Turnos online (link público)
- [ ] Multi-idioma
- [ ] Notificaciones push

---

## 👨‍💻 Autor

**Sebastián Russo**
Estudiante de **Analista Programador Universitario** — UNLP
GitHub: [@Sebarus96](https://github.com/Sebarus96)
Año 2026

---

## 📄 Licencia

Proyecto de uso libre y educativo.
