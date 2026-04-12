# 🎯 ArcoLog

**Diario de entrenamiento para arqueros.** Registra sesiones, sigue tu progreso y visualiza tu evolución con gráficas claras.

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Auth + DB | Supabase (PostgreSQL + JWT) |
| Estilos | Tailwind CSS |
| Gráficas | Recharts |
| Formularios | React Hook Form |
| Deploy | Vercel (gratis) |

---

## Estructura de carpetas

```
arcolog/
├── src/
│   ├── app/
│   │   ├── (app)/               ← Rutas protegidas (auth requerida)
│   │   │   ├── layout.tsx       ← Layout con sidebar + bottom nav
│   │   │   ├── dashboard/       ← Inicio con stats y accesos rápidos
│   │   │   ├── training/
│   │   │   │   ├── new/         ← Formulario nuevo entreno + tandas
│   │   │   │   ├── history/     ← Lista de sesiones
│   │   │   │   └── [id]/        ← Detalle de sesión
│   │   │   ├── competitions/
│   │   │   │   ├── new/         ← Registrar resultado de competición
│   │   │   │   └── history/     ← Lista de competiciones
│   │   │   ├── progress/        ← Gráficas de evolución
│   │   │   └── profile/         ← Perfil y configuración
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── layout.tsx           ← Root layout (fonts, metadata)
│   │   ├── page.tsx             ← Landing pública
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/
│   │   │   └── Sidebar.tsx      ← Sidebar desktop + nav móvil
│   │   └── progress/
│   │       └── ProgressChart.tsx ← Gráfica Recharts (client)
│   ├── lib/
│   │   ├── actions/             ← Server Actions (CRUD)
│   │   │   ├── auth.ts
│   │   │   ├── training.ts
│   │   │   ├── competitions.ts
│   │   │   └── profile.ts
│   │   ├── supabase/
│   │   │   ├── client.ts        ← Cliente browser
│   │   │   └── server.ts        ← Cliente SSR
│   │   └── utils.ts
│   ├── middleware.ts             ← Protección de rutas + refresco de sesión
│   └── types/
│       └── index.ts             ← Tipos TS completos
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql ← Esquema completo con RLS
├── public/
│   └── favicon.svg
└── vercel.json
```

---

## Instalación y puesta en marcha

### 1. Clonar e instalar dependencias

```bash
git clone <tu-repo>
cd arcolog
npm install
```

### 2. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto nuevo
2. En **SQL Editor**, pega y ejecuta el contenido de `supabase/migrations/001_initial_schema.sql`
3. En **Project Settings → API**, copia:
   - `Project URL`
   - `anon public` key

### 3. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Despliegue en Vercel

```bash
# Instala Vercel CLI (si no lo tienes)
npm i -g vercel

# Despliega
vercel

# Añade las variables de entorno en Vercel Dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

O conecta el repositorio directamente desde [vercel.com](https://vercel.com) — detecta Next.js automáticamente.

---

## Esquema de base de datos

```
profiles            ← Extiende auth.users de Supabase
  └── training_sessions
        └── session_ends     ← Tandas de cada sesión
  └── competition_scores
```

**Row Level Security (RLS)** activado en todas las tablas. Cada usuario solo puede ver y modificar sus propios datos.

---

## API (Server Actions)

Toda la lógica de datos usa **Next.js Server Actions** — no hay API REST separada. Las funciones viven en `src/lib/actions/`:

| Función | Descripción |
|---------|-------------|
| `login(formData)` | Autenticar usuario |
| `register(formData)` | Crear cuenta |
| `logout()` | Cerrar sesión |
| `createTrainingSession(data)` | Nueva sesión + tandas |
| `getTrainingSessions()` | Listar sesiones del usuario |
| `getTrainingSession(id)` | Detalle de sesión con tandas |
| `deleteTrainingSession(id)` | Eliminar sesión |
| `createCompetitionScore(data)` | Registrar resultado de competición |
| `getCompetitionScores()` | Listar competiciones |
| `deleteCompetitionScore(id)` | Eliminar competición |
| `getProfile()` | Obtener perfil |
| `updateProfile(formData)` | Actualizar perfil |
| `getDashboardStats()` | Stats para el dashboard |
| `getProgressData()` | Datos para las gráficas |

---

## Funcionalidades del MVP

- ✅ Autenticación (registro / login / logout)
- ✅ Registrar sesiones de entrenamiento con:
  - Fecha, distancia, tipo de diana
  - Objetivo del entreno
  - Cómo te has sentido (1–5)
  - Tiempo / condiciones (soleado, viento, interior...)
  - Notas libres
  - Tandas dinámicas (nº de flechas + puntuación por tanda)
- ✅ Historial de sesiones con detalle completo
- ✅ Registrar resultados de competición (puntuación, X's, 10s, posición)
- ✅ Historial de competiciones con mejor marca destacada
- ✅ Gráficas de progreso (entrenamiento + competición en una sola vista)
- ✅ Dashboard con stats rápidas (sesiones, flechas totales, mejor marca)
- ✅ Perfil de usuario (nombre, tipo de arco, club)
- ✅ Responsive: sidebar en escritorio + bottom nav en móvil
- ✅ Dark mode automático

---

## Hoja de ruta (post-MVP)

- [ ] Invitaciones para grupos / equipos (club compartido)
- [ ] Exportar datos (CSV / PDF)
- [ ] Notificaciones / recordatorios de entrenamiento
- [ ] Foto de diana por sesión (Supabase Storage ya preparado)
- [ ] Comparativa entre miembros del club
- [ ] Monetización: plan Premium vía Stripe

---

## Licencia

MIT
