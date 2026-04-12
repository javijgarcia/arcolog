// ============================================================
// ArcoLog — Tipos TypeScript
// ============================================================

export type BowType = 'recurvo' | 'compuesto' | 'longbow' | 'otro'
export type TargetType = 'diana_papel' | 'diana_3d' | 'campo' | 'sala' | 'otro'
export type Weather = 'soleado' | 'nublado' | 'lluvia' | 'viento' | 'interior'

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
  session_date: string          // ISO date string YYYY-MM-DD
  total_arrows: number
  distance_meters: number
  target_type: TargetType | null
  objective: string | null
  feeling_score: number | null  // 1-5
  weather: Weather | null
  notes: string | null
  created_at: string
  updated_at: string
  // Join
  session_ends?: SessionEnd[]
}

export interface SessionEnd {
  id: string
  session_id: string
  end_number: number
  arrows: number
  score: number
  notes: string | null
  created_at: string
}

export interface CompetitionScore {
  id: string
  user_id: string
  competition_date: string
  competition_name: string
  category: string | null
  distance_meters: number | null
  round_type: string | null
  total_score: number
  x_count: number
  tens_count: number
  ranking_position: number | null
  notes: string | null
  created_at: string
  updated_at: string
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
  target_type: TargetType
  objective: string
  feeling_score: number
  weather: Weather
  notes: string
  ends: SessionEndForm[]
}

export interface SessionEndForm {
  end_number: number
  arrows: number
  score: number
  notes?: string
}

export interface CompetitionScoreForm {
  competition_date: string
  competition_name: string
  category: string
  distance_meters: number
  round_type: string
  total_score: number
  x_count: number
  tens_count: number
  ranking_position: number | null
  notes: string
}

// ---- Chart data ----

export interface ProgressDataPoint {
  date: string
  score: number
  type: 'training' | 'competition'
  label: string
}

export interface ArrowsPerDayPoint {
  date: string
  arrows: number
}

// ---- Labels helpers ----

export const BOW_TYPE_LABELS: Record<BowType, string> = {
  recurvo: 'Recurvo',
  compuesto: 'Compuesto',
  longbow: 'Longbow',
  otro: 'Otro',
}

export const TARGET_TYPE_LABELS: Record<TargetType, string> = {
  diana_papel: 'Diana papel',
  diana_3d: 'Diana 3D',
  campo: 'Tiro de campo',
  sala: 'Sala interior',
  otro: 'Otro',
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
