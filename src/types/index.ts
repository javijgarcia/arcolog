// ============================================================
// ArcoLog — Tipos TypeScript v0.2
// ============================================================

export type BowType = 'recurvo' | 'compuesto' | 'longbow' | 'otro'
export type Modality = 'aire_libre' | 'sala' | 'campo' | '3d'
export type Weather = 'soleado' | 'nublado' | 'lluvia' | 'viento' | 'interior'

// ---- Puntuaciones por modalidad ----

export const SCORES_BY_MODALITY = {
  aire_libre: ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'],
  sala: ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'],
  campo: ['6', '5', '4', '3', '2', '1', 'M'],
  '3d': ['11', '10', '8', '5', '0'],
} as const

export const SCORE_COLORS: Record<string, string> = {
  // Aire libre y Sala
  'X':  'bg-yellow-300 text-yellow-900',
  '10': 'bg-yellow-300 text-yellow-900',
  '9':  'bg-yellow-300 text-yellow-900',
  '8':  'bg-red-500 text-white',
  '7':  'bg-red-500 text-white',
  '6':  'bg-blue-500 text-white',
  '5':  'bg-blue-500 text-white',
  '4':  'bg-gray-900 text-white',
  '3':  'bg-gray-900 text-white',
  '2':  'bg-white text-gray-900 border border-gray-300',
  '1':  'bg-white text-gray-900 border border-gray-300',
  'M':  'bg-white text-gray-900 border border-gray-300',
  // Campo
  'campo_6': 'bg-yellow-300 text-yellow-900',
  'campo_5': 'bg-yellow-300 text-yellow-900',
  'campo_4': 'bg-gray-900 text-white',
  'campo_3': 'bg-gray-900 text-white',
  'campo_2': 'bg-gray-900 text-white',
  'campo_1': 'bg-gray-900 text-white',
  'campo_0': 'bg-white text-gray-900 border border-gray-300',
}

// ---- Configuración por modalidad ----

export const MODALITY_CONFIG = {
  aire_libre: {
    label: 'Aire Libre',
    arrowsPerEnd: 6,
    endsPerSeries: 6,
    maxScore: 10,
    hasSeries: true,
    hasDianas: false,
    hasDianaPaper: true,
  },
  sala: {
    label: 'Sala',
    arrowsPerEnd: 3,
    endsPerSeries: 10,
    maxScore: 10,
    hasSeries: true,
    hasDianas: false,
    hasDianaPaper: true,
  },
  campo: {
    label: 'Campo',
    arrowsPerEnd: 3,
    endsPerSeries: 1,
    maxScore: 6,
    hasSeries: false,
    hasDianas: true,
    hasDianaPaper: true,
  },
  '3d': {
    label: '3D',
    arrowsPerEnd: 2,
    endsPerSeries: 1,
    maxScore: 11,
    hasSeries: false,
    hasDianas: true,
    hasDianaPaper: false,
  },
}

// ---- Entidades de base de datos ----

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  bow_type: BowType | null
  club_name: string | null
  created_at: string
  updated_at: string
}

export interface TrainingSession {
  id: string
  user_id: string
  session_date: string
  total_arrows: number
  distance_meters: number
  modality: Modality
  series_count: number
  diana_count: number | null
  diana_paper: string | null
  objective: string | null
  feeling_score: number | null
  weather: Weather | null
  mental_concentration: number | null
  mental_activation: number | null
  mental_nerves: number | null
  mental_notes: string | null
  notes: string | null
  created_at: string
  updated_at: string
  session_ends?: SessionEnd[]
}

export interface SessionEnd {
  id: string
  session_id: string
  end_number: number
  arrows: number
  score: number
  arrow_scores: string[]
  notes: string | null
  created_at: string
}

export interface CompetitionScore {
  id: string
  user_id: string
  competition_date: string
  competition_name: string
  category: string | null
  modality: Modality | null
  competition_type: 'local' | 'provincial' | 'autonomica' | 'nacional' | 'internacional' | null
  distance_meters: number | null
  round_type: string | null
  total_score: number
  x_count: number
  tens_count: number
  ranking_position: number | null
  series_count: number | null
  diana_count: number | null
  notes: string | null
  competition_ends?: CompetitionEnd[]
  created_at: string
  updated_at: string
  ends_json?: string
}

export interface UserStats {
  user_id: string
  total_sessions: number
  total_arrows: number
  total_competitions: number
  personal_best: number | null
  avg_feeling: number | null
}

// ---- Forms ----

export interface TrainingSessionForm {
  session_date: string
  distance_meters: number
  modality: Modality
  series_count: number
  diana_count: number | null
  diana_paper: string | null
  objective: string
  feeling_score: number
  weather: Weather
  mental_concentration: number | null
  mental_activation: number | null
  mental_nerves: number | null
  mental_notes: string
  notes: string
  extra_arrows?: number
  ends: SessionEndForm[]
}

export interface SessionEndForm {
  end_number: number
  arrows: number
  score: number
  arrow_scores: string[]
  notes?: string
}

export interface CompetitionScoreForm {
  competition_date: string
  competition_name: string
  category: string
  modality: Modality | null
 competition_type: 'local' | 'provincial' | 'autonomica' | 'nacional' | 'internacional' | null
  distance_meters: number
  round_type: string
  total_score: number
  x_count: number
  tens_count: number
  ranking_position: number | null
  series_count: number | null
  diana_count: number | null
  notes: string
  ends?: SessionEndForm[]
  series_count?: number
  diana_count?: number | null
  use_control?: boolean
}

// ---- Chart data ----

export interface ProgressDataPoint {
  date: string
  score: number
  type: 'training' | 'competition'
  label: string
}

// ---- Labels ----

export const BOW_TYPE_LABELS: Record<BowType, string> = {
  recurvo: 'Recurvo',
  compuesto: 'Compuesto',
  longbow: 'Longbow',
  otro: 'Otro',
}

export const MODALITY_LABELS: Record<Modality, string> = {
  aire_libre: '🌤 Aire Libre',
  sala: '🏠 Sala',
  campo: '🌲 Campo',
  '3d': '🐗 3D',
}

export const WEATHER_LABELS: Record<Weather, string> = {
  soleado: '☀️ Soleado',
  nublado: '⛅ Nublado',
  lluvia: '🌧 Lluvia',
  viento: '💨 Viento',
  interior: '🏠 Interior',
}

export const FEELING_LABELS: Record<number, string> = {
  1: '😞 Muy mal',
  2: '😕 Regular',
  3: '😐 Normal',
  4: '🙂 Bien',
  5: '😄 Excelente',
}

export const COMPETITION_TYPE_LABELS = {
  local: 'Local',
  provincial: 'Provincial',
  autonomica: 'Autonómica',
  nacional: 'Nacional',
internacional: 'Internacional',
}

export interface Equipment {
  id: string
  user_id: string
  marca_cuerpo: string | null
  marca_palas: string | null
  libras_nominales: number | null
  libras_reales: number | null
  longitud_flecha: number | null
  tubos: string | null
  tipo_plumas: string | null
  spine: string | null
  apertura: string | null
  created_at: string
  updated_at: string
}

export interface SightMark {
  id: string
  user_id: string
  distance_meters: number
  mark: string
  notes: string | null
  created_at: string
}

export interface SessionPhoto {
  id: string
  user_id: string
  session_id: string | null
  competition_id: string | null
  storage_path: string
  caption: string | null
  created_at: string
}
export interface Achievement {
  id: string
  user_id: string
  code: string
  unlocked_at: string
}

export const ACHIEVEMENTS: Record<string, { label: string; description: string; emoji: string }> = {
  first_session: { emoji: '🏹', label: 'Primera flecha', description: 'Registraste tu primera sesión' },
  first_competition: { emoji: '🏆', label: 'Primer torneo', description: 'Registraste tu primera competición' },
  arrows_100: { emoji: '💯', label: '100 flechas', description: 'Has tirado 100 flechas en total' },
  arrows_500: { emoji: '🎯', label: '500 flechas', description: 'Has tirado 500 flechas en total' },
  arrows_1000: { emoji: '⭐', label: '1.000 flechas', description: 'Has tirado 1.000 flechas en total' },
  arrows_5000: { emoji: '🌟', label: '5.000 flechas', description: 'Has tirado 5.000 flechas en total' },
  streak_7: { emoji: '🔥', label: 'Racha de 7 días', description: '7 días seguidos entrenando' },
  streak_30: { emoji: '💪', label: 'Racha de 30 días', description: '30 días seguidos entrenando' },
  sessions_10: { emoji: '📅', label: '10 sesiones', description: 'Has completado 10 sesiones' },
  sessions_25: { emoji: '📈', label: '25 sesiones', description: 'Has completado 25 sesiones' },
  sessions_50: { emoji: '🎖️', label: '50 sesiones', description: 'Has completado 50 sesiones' },
  personal_best: { emoji: '🥇', label: 'Récord personal', description: 'Has superado tu mejor marca en competición' },
  efficiency_80: { emoji: '🎯', label: 'Precisión 80%', description: 'Has conseguido un 80% de efectividad en una sesión' },
  efficiency_90: { emoji: '💎', label: 'Precisión 90%', description: 'Has conseguido un 90% de efectividad en una sesión' },
}
export type GroupRole = 'entrenador' | 'arquero'

export interface Group {
  id: string
  name: string
  description: string | null
  invite_code: string
  owner_id: string
  created_at: string
  updated_at: string
  group_members?: GroupMember[]
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: GroupRole
  joined_at: string
  profiles?: Profile
}
export interface ScheduledTraining {
  id: string
  group_id: string
  created_by: string
  scheduled_date: string
  modality: Modality | null
  distance_meters: number | null
  objective: string | null
  notes: string | null
  created_at: string
  scheduled_training_completions?: ScheduledTrainingCompletion[]
}

export type CompletionStatus = 'completado' | 'pendiente' | 'descartado'

export interface ScheduledTrainingCompletion {
  id: string
  scheduled_training_id: string
  user_id: string
  session_id: string | null
  status: CompletionStatus
  completed_at: string | null
  created_at: string
  profiles?: Profile
}

export interface CompetitionEnd {
  id: string
  competition_id: string
  end_number: number
  arrows: number
  score: number
  arrow_scores: string[]
  created_at: string
}