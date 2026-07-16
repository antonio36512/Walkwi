# Walkwi - Documentación del Proyecto

## 1. Visión General

**Walkwi** es una aplicación móvil marketplace para servicios de paseo de mascotas. Conecta a dueños de mascotas con paseadores verificados, con sistema de pago integrado, tracking GPS en tiempo real, verificación por códigos y sistema de reseñas/reports.

### Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React Native + Expo + Expo Router |
| **UI** | React Native Paper (Material Design) |
| **Mapas** | MapLibre GL + Expo Location |
| **Backend** | Express.js + MongoDB (Mongoose) |
| **Auth** | JWT + Google OAuth (Expo AuthSession) |
| **Pagos** | PayPal (sandbox) |
| **Deep Links** | `walkwi://` scheme |

### Roles de Usuario

- **`user`** — Dueño de mascota. Crea reservas, paga, califica paseadores.
- **`walker`** — Paseador de mascotas. Acepta reservas, inicia/finaliza paseos, usa códigos de verificación.
- **`admin`** — Panel web con gestión de usuarios, reservas, métricas, reseñas y reports.

---

## 2. Arquitectura del Proyecto

```
Walkwi-eduardo/
├── server/
│   ├── index.js                    # Entry point del servidor
│   ├── config/
│   │   └── database.js             # Conexión a MongoDB
│   ├── models/
│   │   ├── User.js                 # Modelo de usuario
│   │   ├── Booking.js              # Modelo de reserva
│   │   └── Report.js               # Modelo de reporte
│   ├── routes/
│   │   ├── auth.js                 # Login, registro, Google OAuth, recuperación
│   │   ├── bookings.js             # CRUD de reservas, tracking, códigos
│   │   ├── payment.js              # PayPal crear/capturar/reembolsar
│   │   ├── reviews.js              # Crear reseñas
│   │   ├── reports.js              # Crear reports
│   │   ├── admin.js                # Panel admin (resumen, métricas, usuarios)
│   │   ├── users.js                # Perfil de usuario, avatar
│   │   └── adminWeb.js             # Panel admin web
│   └── scripts/
│       ├── seedWalkers.js          # Crea paseadores de prueba
│       └── testDatabase.js         # Test de conexión a MongoDB
├── app/                            # Expo Router (pantallas)
│   ├── (auth)/                     # Autenticación
│   │   ├── index.js                # Login
│   │   ├── register.js             # Registro
│   │   └── forgot-password.js      # Recuperación
│   ├── (tabs)/                     # Navegación principal (4 tabs)
│   │   ├── index.js                # Home (paseadores)
│   │   ├── bookings.js             # Mis reservas
│   │   ├── messages.js             # Mensajes
│   │   └── profile.js              # Perfil
│   ├── booking/
│   │   ├── [id].js                 # Detalle de reserva
│   │   ├── new.js                  # Crear reserva (wizard 5 pasos)
│   │   ├── walker/[id].js          # Vista del paseador
│   │   ├── payment.js              # Pago con PayPal
│   │   └── confirm-booking.js      # Confirmación
│   ├── booking-walker/
│   │   └── [id].js                 # Detalle reserva (vista walker)
│   ├── map.js                      # Tracking en mapa
│   ├── tracking-live.js            # Tracking en vivo (polling)
│   ├── map-picker.js               # Selector de ubicación
│   ├── walker-location.js          # Ubicación del paseador
│   └── _layout.js                  # Layout global (providers)
└── src/
    ├── context/
    │   └── AuthContext.js          # Context de autenticación global
    └── components/
        ├── Map.js                   # MapLibre con rutas y tracking
        ├── WalkerCard.js            # Tarjeta de paseador
        ├── WalkButton.js            # Botón "Pasear Ahora"
        ├── SearchBar.js             # Barra de búsqueda
        ├── ReviewSummary.js         # Resumen de reseñas
        ├── BookingDetails.js        # Detalles de reserva
        └── tracking/                # Componentes de tracking
            ├── TrackingMap.js       # Mapa de tracking
            ├── TrackingControls.js  # Controles de tracking
            └── StartCodeInput.js    # Input de código de inicio
```

---

## 3. Modelos de Datos

### User (`server/models/User.js`)

```javascript
{
  name: String,           // Nombre completo
  email: String,          // Email único
  password: String,       // Hash bcrypt (8 rounds)
  phone: String,          // Teléfono
  avatar: String,         // URL del avatar
  role: 'user' | 'walker' | 'admin',
  isProfileComplete: Boolean,
  location: {
    type: 'Point',
    coordinates: [lng, lat]  // GeoJSON
  },
  averageRating: Number,  // Promedio de estrellas (solo walkers)
  totalReviews: Number,   // Total de reviews (solo walkers)
  // Solo walkers:
  pricePerWalk: Number,   // Precio en USD por paseo
  walkerDescription: String,
  experience: String,
  // Recuperación de contraseña:
  resetCode: String,
  resetCodeExpires: Date,
  resetCodeAttempts: Number  // Máx 3 intentos
}
```

### Booking (`server/models/Booking.js`)

```javascript
{
  // Referencias
  owner: ObjectId → User,      // Dueño de la mascota
  walker: ObjectId → User,     // Paseador asignado

  // Mascota
  pet: {
    name: String,
    type: 'Perro' | 'Gato' | 'Otro',
    weight: 'small' | 'medium' | 'large',
    photo: String,
    notes: String              // Instrucciones especiales
  },

  // Fechas y ubicación
  walkDate: String,           // YYYY-MM-DD
  walkTime: String,           // HH:mm
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },

  // Estado
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled',

  // Códigos de verificación
  startCode: String,          // 4 dígitos generado por el dueño
  endCode: String,            // 4 dígitos generado por el dueño
  ownerVerifiedStart: Boolean,
  ownerVerifiedEnd: Boolean,

  // Tracking GPS
  tracking: {
    current: {
      latitude: Number,
      longitude: Number,
      timestamp: Date
    },
    history: [{ latitude, longitude, timestamp }],
    isActive: Boolean
  },

  // Pago
  payment: {
    paypalOrderId: String,
    paypalCaptureId: String,
    amount: Number,
    status: 'pending' | 'captured' | 'refunded' | 'partially_refunded',
    refundAmount: Number,
    refundReason: String
  },

  // Calificación
  rating: Number,              // 1-5 estrellas
  review: String,              // Texto de la reseña

  // Otros
  cancelReason: String,
  cancelledBy: 'user' | 'walker',
  createdAt: Date
}
```

### Report (`server/models/Report.js`)

```javascript
{
  reporter: ObjectId → User,    // Quien reporta
  reported: ObjectId → User,    // Quien es reportado
  booking: ObjectId → Booking,  // Reserva asociada
  reason: String,               // Motivo predefinido
  description: String,
  status: 'pending' | 'resolved' | 'dismissed'
}
```

---

## 4. Flujo de Autenticación

### Login con Email/Password (`POST /api/auth/login`)

1. Valida email y contraseña
2. Genera JWT con payload `{ id, email, role }` (expira 7 días)
3. Retorna `{ user, token }`
4. El frontend guarda en AsyncStorage: `token`, `user.id`, `user.name`, `user.email`, `user.role`, `user.avatar`, `user.phone`

### Login con Google OAuth

**Backend (`POST /api/auth/google`):**
1. Recibe `{ email, name, googleId, avatar }` del frontend
2. Si el usuario ya existe → retorna JWT + user
3. Si no existe → crea usuario con `password: null` (no puede loguearse con password)
4. Si es el primer usuario → `role: 'admin'`, sino → `role: 'user'`

**Frontend:**
1. Usa `AuthSession.startAsync({ authUrl: ... })` con `response_type=code`
2. El navegador de Google redirige a `walkwi://?token=...` (deep link)
3. `useAuthUrl.js` detecta el token y llama `loginWithGoogle(token)`
4. Si falla → redirige a `walkwi://?error=google_auth_failed`

### Registro (`POST /api/auth/register`)

- Valida nombre, email, contraseña (mín 6 caracteres), teléfono
- Hashea password con bcrypt (8 rounds)
- Retorna JWT + user

### Recuperación de Contraseña

1. `POST /api/auth/forgot-password` → busca usuario, genera código de 6 dígitos, lo envía por Gmail
2. `POST /api/auth/verify-reset-code` → valida código (máx 3 intentos)
3. `POST /api/auth/reset-password` → cambia contraseña, limpia código
4. Los códigos expiran después de 10 intentos fallidos

---

## 5. Sistema de Reservas (Booking)

### Fase 1: Creación (Dueño)

**`POST /api/bookings`** — Wizard de 5 pasos:

1. **Mascota**: nombre, tipo, peso, notas, foto
2. **Fecha y hora**: walkDate (YYYY-MM-DD), walkTime (HH:mm)
3. **Dirección**: selección en mapa (lat/lng), dirección manual o usar ubicación actual
4. **Resumen**: todos los datos + precio estimado
5. **Pago**: PayPal sandbox (crear orden → capturar)

### Fase 2: Aceptación del Paseador

**`PUT /api/bookings/:id/accept`** — Solo el walker asignado puede aceptar.
- Estado: `pending` → `accepted`

### Fase 3: Códigos de Verificación

**Generación de códigos:**
- **`POST /api/bookings/:id/generate-codes`** — Solo el dueño. Genera `startCode` y `endCode` de 4 dígitos cada uno.
- Códigos se guardan en `booking.startCode` y `booking.endCode`

**Uso de códigos:**
- **`POST /api/bookings/:id/verify-start-code`** — El walker ingresa el código de inicio
  - Si es correcto → `status: 'accepted'` → `status: 'in_progress'`, `tracking.isActive = true`
  - Si es incorrecto → incrementa intentos fallidos
- **`POST /api/bookings/:id/verify-end-code`** — El walker ingresa el código de fin
  - Si es correcto → `status: 'completed'`, `tracking.isActive = false`
  - Si es incorrecto → incrementa intentos fallidos

**Flujo de códigos:**
```
Dueño crea reserva → Dueño genera códigos (4 dígitos cada uno)
→ Walker ingresa código de INICIO → Paseo comienza (tracking activo)
→ Walker ingresa código de FIN → Paseo termina
```

### Fase 4: Paseo con Tracking GPS

(Ver sección 6)

### Fase 5: Finalización y Calificación

- `POST /api/bookings/:id/review` — Califica al paseador (1-5 estrellas + texto)
- `POST /api/reviews` — Crea reseña formal
- `PUT /api/reviews/:id` — Actualiza reseña del dueño
- `DELETE /api/reviews/:id` — Elimina reseña del dueño

### Diagrama de Estados

```
pending ──→ accepted ──→ in_progress ──→ completed
   │            │              │
   └──→ cancelled  └──→ cancelled  └──→ cancelled
```

**Reglas de transición por rol:**
| Estado | Owner puede | Walker puede |
|--------|------------|--------------|
| `pending` | cancelar | aceptar |
| `accepted` | cancelar | iniciar (verificar código) |
| `in_progress` | cancelar (con razón) | finalizar (verificar código) |
| `completed` | calificar | — |

### Cancelación con Penalización

- **Walker cancela después de aceptar**: reembolso del 80% al dueño
- **Dueño cancela después de aceptar**: sin reembolso (penalización)
- **Cancelación antes de aceptar**: reembolso del 100%

---

## 6. Sistema de Tracking GPS

### Cuándo se activa

- Solo durante estado `in_progress` (después de verificar código de inicio)
- Se desactiva al verificar código de fin

### Cómo funciona

**Walker envía ubicación (`POST /api/bookings/:id/tracking`):**
- Cada **5 segundos** o cada **10 metros** de distancia recorrida
- Guarda en `tracking.current` (última posición) y `tracking.history` (máx 500 puntos)
- Actualiza `walker.location` (para que otros lo vean en el mapa principal)

**Dueño recibe ubicación (`GET /api/bookings/:id/tracking`):**
- Retorna `tracking.current`, `tracking.history`, `status`, `address` (dirección del paseo)
- Retorna `walkerId` para mostrar avatar del paseador en el mapa

### Frontend - TrackingMap (`src/components/tracking/TrackingMap.js`)

- MapLibre GL con mapa oscuro (`basemaps/styles/dark`)
- Muestra ubicación actual del walker (punto azul)
- Muestra dirección del paseo (punto rojo)
- Muestra ruta del tracking si hay historial
- Si no hay datos de tracking, muestra un marker con texto "Sin datos de tracking"
- `FollowUserButton` para centrar en la ubicación del walker

### Modos de Visualización

1. **`tracking-live.js`** — Polling cada 5 segundos. Muestra `TrackingMap` + `TrackingControls` + `StartCodeInput`
2. **`map.js`** — Modo estático. Muestra la dirección del paseo (no polling en vivo)
3. **`walker-location.js`** — Muestra ubicación del walker para el dueño

---

## 7. Sistema de Pago (PayPal Sandbox)

### Crear Orden (`POST /api/payment/create-order`)

```javascript
{
  bookingId: "ObjectId",
  amount: 15.00  // monto en USD
}
```

- Crea orden en PayPal sandbox
- Guarda `paypalOrderId` en el booking
- Retorna `orderId` para el frontend

### Capturar Pago (`POST /api/payment/capture-order`)

- Confirma el pago después de completar el paseo
- Actualiza `payment.status: 'captured'`

### Reembolso (`POST /api/payment/refund`)

- Reembolso total o parcial
- Actualiza `payment.status: 'refunded'` o `'partially_refunded'`
- Guarda `refundAmount` y `refundReason`

---

## 8. Sistema de Reseñas

### Crear Reseña (`POST /api/reviews`)

```javascript
{
  bookingId: ObjectId,
  rating: 1-5,
  comment: String
}
```

- Solo se puede calificar una reserva `completed`
- Actualiza `averageRating` y `totalReviews` del walker

### Ver Reseñas (`GET /api/reviews/walker/:walkerId`)

- Retorna todas las reseñas de un walker con info del reviewer

### Resumen de Reseñas (`GET /api/reviews/walker/:walkerId/summary`)

- Retorna `averageRating`, `totalReviews`, `reviewsByRating` (cont por estrella)

---

## 9. Sistema de Reports

### Crear Report (`POST /api/reports`)

```javascript
{
  reportedId: ObjectId,    // usuario reportado
  bookingId: ObjectId,     // reserva asociada
  reason: String,          // motivo predefinido
  description: String      // detalles adicionales
}
```

**Motivos predefinidos:**
- "Comportamiento inapropiado"
- "Daño a la mascota"
- "No se presentó"
- "Robo o hurto"
- "Otro"

### Dashboard Admin (`GET /api/admin/dashboard`)

- Total de reports por estado
- Total de reseñas
- Reseñas recientes
- Reservas completadas
- Ingresos totales (capturados)

---

## 10. Panel Admin (Web)

Ubicación: `server/admin-web/` (HTML/CSS/JS vanilla)

### Funcionalidades

- **Panel principal**: métricas (total usuarios, reservas, reports pendientes)
- **Gestión de usuarios**: ver, suspender, reactivar, eliminar
- **Gestión de reports**: ver, resolver, descartar
- **Gestión de reseñas**: ver todas las reseñas del sistema
- **Gestión de reservas**: ver todas las reservas con detalles

---

## 11. Variables de Entorno (.env)

```env
# Base de datos
MONGODB_URI=mongodb://localhost:27017/walkwi

# JWT
JWT_SECRET= mi_secreto_jwt  # ⚠️ Tiene espacio después del =

# PayPal (sandbox)
PAYPAL_CLIENT_ID=tu_paypal_client_id
PAYPAL_CLIENT_SECRET=tu_paypal_client_secret
PAYPAL_MODE=sandbox

# Google OAuth
GOOGLE_SIGNIN_CLIENT_ID=tu_google_client_id
GOOGLE_SIGNIN_CLIENT_SECRET=tu_google_client_secret

# Gmail (para recuperación de contraseña)
GMAIL_USER=tu_email@gmail.com
GMAIL_APP_PASSWORD=tu_app_password

# Puerto
PORT=5000

# Frontend URL (para deep links)
FRONTEND_URL=http://localhost:8081
```

> **Nota:** `JWT_SECRET= mi_secreto_jwt` tiene un espacio después del `=`. Esto puede causar problemas si se lee con un parser estricto. Verificar que no haya espacios.

---

## 12. Cómo Ejecutar el Proyecto

### Requisitos previos
- Node.js 18+
- MongoDB corriendo localmente
- Cuenta de PayPal sandbox
- Cuenta de Google Cloud (para OAuth)
- Cuenta Gmail con App Password

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/antonio36512/Walkwi.git
cd Walkwi
git checkout eduardo

# Instalar dependencias
cd Walkwi-eduardo
npm install
cd server
npm install
cd ..
```

### Configurar .env

Copiar el archivo `.env` al directorio `Walkwi-eduardo/Walkwi-eduardo/` (no al padre).

### Ejecutar

```bash
# Terminal 1: Servidor backend
cd Walkwi-eduardo/Walkwi-eduardo/server
npm start

# Terminal 2: App Expo
cd Walkwi-eduardo/Walkwi-eduardo
npm start
```

### Seed de Paseadores de Prueba

```bash
cd Walkwi-eduardo/Walkwi-eduardo/server
node scripts/seedWalkers.js
```

Crea 3 paseadores de prueba:
- `paseador1@test.com` / `password123`
- `paseador2@test.com` / `password123`
- `paseador3@test.com` / `password123`

### Puertos

| Servicio | Puerto |
|----------|--------|
| Backend Express | 5000 |
| Expo Dev Server | 8081 |
| MongoDB | 27017 |
| ngrok (forwarding) | Variable |

---

## 13. Deep Links

### Formato

```
walkwi://?token=eyJhbGciOiJIUzI1NiJ9...  (login exitoso)
walkwi://?error=google_auth_failed         (login fallido)
```

### Uso

1. Google OAuth redirige al deep link con el token
2. `app/[...slug].js` detecta `token` o `error` en los query params
3. `useAuthUrl.js` procesa el deep link y llama `loginWithGoogle(token)`
4. Se navega automáticamente a `(tabs)/` si el login es exitoso

---

## 14. Estados de Reserva - Resumen Visual

```
┌─────────┐    ┌──────────┐    ┌──────────────┐    ┌───────────┐
│ PENDING │───→│ ACCEPTED │───→│ IN_PROGRESS  │───→│ COMPLETED │
└─────────┘    └──────────┘    └──────────────┘    └───────────┘
     │              │                │
     └──→ CANCELLED └──→ CANCELLED   └──→ CANCELLED
```

**Transiciones por código:**
- `pending → accepted`: Walker acepta la reserva
- `accepted → in_progress`: Walker verifica código de inicio (4 dígitos)
- `in_progress → completed`: Walker verifica código de fin (4 dígitos)
- Cualquier estado → `cancelled`: Cancelación con penalización según timing

---

## 15. Endpoints de la API

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/google` | Login/registro con Google |
| POST | `/api/auth/forgot-password` | Enviar código de recuperación |
| POST | `/api/auth/verify-reset-code` | Verificar código |
| POST | `/api/auth/reset-password` | Cambiar contraseña |
| GET | `/api/auth/me` | Verificar token |

### Reservas
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/bookings` | Crear reserva |
| GET | `/api/bookings/my-bookings` | Mis reservas (dueño) |
| GET | `/api/bookings/walker/my-bookings` | Mis reservas (paseador) |
| GET | `/api/bookings/walker/stats` | Estadísticas del paseador |
| GET | `/api/bookings/:id` | Detalle de reserva |
| PUT | `/api/bookings/:id/accept` | Walker acepta |
| POST | `/api/bookings/:id/verify-start-code` | Verificar código inicio |
| POST | `/api/bookings/:id/verify-end-code` | Verificar código fin |
| POST | `/api/bookings/:id/generate-codes` | Generar códigos (dueño) |
| POST | `/api/bookings/:id/tracking` | Enviar ubicación (walker) |
| GET | `/api/bookings/:id/tracking` | Obtener tracking |
| POST | `/api/bookings/:id/review` | Calificar |
| PUT | `/api/bookings/:id/cancel` | Cancelar |
| DELETE | `/api/bookings/:id` | Eliminar reserva |

### Pago
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/payment/create-order` | Crear orden PayPal |
| POST | `/api/payment/capture-order` | Capturar pago |
| POST | `/api/payment/refund` | Reembolso |
| GET | `/api/payment/details/:bookingId` | Detalles de pago |
| GET | `/api/payment/balance/:walkerId` | Balance del paseador |

### Reseñas
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/reviews` | Crear reseña |
| GET | `/api/reviews/walker/:walkerId` | Reseñas de un walker |
| GET | `/api/reviews/walker/:walkerId/summary` | Resumen de reseñas |
| GET | `/api/reviews/my-reviews` | Mis reseñas (como dueño) |
| PUT | `/api/reviews/:id` | Actualizar reseña |
| DELETE | `/api/reviews/:id` | Eliminar reseña |

### Reports
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/reports` | Crear report |
| GET | `/api/reports/my-reports` | Mis reports |

### Admin
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/dashboard` | Dashboard |
| GET | `/api/admin/summary` | Resumen completo |
| GET | `/api/admin/metrics` | Métricas |
| GET | `/api/admin/users` | Listar usuarios |
| PUT | `/api/admin/users/:id/suspension` | Suspender/reactivar |
| DELETE | `/api/admin/users/:id` | Eliminar usuario |
| GET | `/api/admin/reviews` | Todas las reseñas |
| GET | `/api/admin/reports` | Todos los reports |
| PUT | `/api/admin/reports/:id/resolve` | Resolver report |
| PUT | `/api/admin/reports/:id/dismiss` | Descartar report |

### Usuarios
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/users/walkers` | Listar paseadores |
| GET | `/api/users/profile/:id` | Perfil de usuario |
| GET | `/api/users/search` | Buscar paseadores |
| PUT | `/api/users/profile` | Actualizar perfil |
| PUT | `/api/users/profile/avatar` | Subir avatar |
| GET | `/api/users/walker/:id/availability` | Disponibilidad |
