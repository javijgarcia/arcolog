'use client'

import type { Modality } from '@/types'

interface Impact {
  x: number
  y: number
  score: string
}

interface Props {
  ends: {
    arrow_scores: string[]
    impact_x: number[] | null
    impact_y: number[] | null
  }[]
  modality: Modality
}

const ZONES_STANDARD = [
  { score: 'X', maxR: 0.04, color: '#fde047' },
  { score: '10', maxR: 0.08, color: '#fde047' },
  { score: '9', maxR: 0.14, color: '#fde047' },
  { score: '8', maxR: 0.21, color: '#ef4444' },
  { score: '7', maxR: 0.28, color: '#ef4444' },
  { score: '6', maxR: 0.36, color: '#3b82f6' },
  { score: '5', maxR: 0.44, color: '#3b82f6' },
  { score: '4', maxR: 0.53, color: '#1f2937' },
  { score: '3', maxR: 0.62, color: '#1f2937' },
  { score: '2', maxR: 0.73, color: '#f3f4f6' },
  { score: '1', maxR: 0.85, color: '#f3f4f6' },
  { score: 'M', maxR: 1.0, color: '#f9fafb' },
]

const ZONES_CAMPO = [
  { score: '6', maxR: 0.12, color: '#fde047' },
  { score: '5', maxR: 0.25, color: '#fde047' },
  { score: '4', maxR: 0.42, color: '#1f2937' },
  { score: '3', maxR: 0.58, color: '#1f2937' },
  { score: '2', maxR: 0.75, color: '#1f2937' },
  { score: '1', maxR: 0.88, color: '#1f2937' },
  { score: 'M', maxR: 1.0, color: '#f9fafb' },
]

const ZONES_3D = [
  { score: '11', maxR: 0.08, color: '#fde047' },
  { score: '10', maxR: 0.20, color: '#fde047' },
  { score: '8', maxR: 0.45, color: '#f3f4f6' },
  { score: '5', maxR: 0.75, color: '#f3f4f6' },
  { score: '0', maxR: 1.0, color: '#e5e7eb' },
]

function getZones(modality: Modality) {
  if (modality === 'campo') return ZONES_CAMPO
  if (modality === '3d') return ZONES_3D
  return ZONES_STANDARD
}

const ARROW_COLORS: Record<string, string> = {
  'X': '#ca8a04', '11': '#ca8a04', '10': '#ca8a04', '9': '#ca8a04',
  '8': '#dc2626', '7': '#dc2626',
  '6': '#2563eb', '5': '#2563eb',
  '4': '#111827', '3': '#111827', '2': '#111827', '1': '#111827',
  'M': '#9ca3af', '0': '#9ca3af',
}

export function ImpactMap({ ends, modality }: Props) {
  const SIZE = 300
  const CENTER = SIZE / 2
  const RADIUS = SIZE / 2 - 10
  const zones = getZones(modality)

  // Recopilar todos los impactos
  const impacts: Impact[] = []
  for (const end of ends) {
    if (!end.impact_x || !end.impact_y) continue
    end.impact_x.forEach((x, i) => {
      const y = end.impact_y![i]
      const score = end.arrow_scores?.[i] ?? 'M'
      impacts.push({ x, y, score })
    })
  }

  if (impacts.length === 0) return null

  // Calcular centro de agrupación
  const avgX = impacts.reduce((s, i) => s + i.x, 0) / impacts.length
  const avgY = impacts.reduce((s, i) => s + i.y, 0) / impacts.length

  return (
    <div className="space-y-3">
      <div className="flex justify-center">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ maxWidth: '100%' }}
        >
          {/* Anillos */}
          {[...zones].reverse().map((zone, i) => (
            <circle
              key={i}
              cx={CENTER}
              cy={CENTER}
              r={zone.maxR * RADIUS}
              fill={zone.color}
              stroke={zone.color === '#1f2937' ? '#374151' : '#d1d5db'}
              strokeWidth={0.5}
            />
          ))}

          {/* Cruz central */}
          <line x1={CENTER - 10} y1={CENTER} x2={CENTER + 10} y2={CENTER} stroke="#9ca3af" strokeWidth={0.5} />
          <line x1={CENTER} y1={CENTER - 10} x2={CENTER} y2={CENTER + 10} stroke="#9ca3af" strokeWidth={0.5} />

          {/* Centro de agrupación */}
          <circle
            cx={CENTER + avgX * RADIUS}
            cy={CENTER + avgY * RADIUS}
            r={8}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="3 2"
          />

          {/* Impactos */}
          {impacts.map((impact, i) => (
            <g key={i}>
              <circle
                cx={CENTER + impact.x * RADIUS}
                cy={CENTER + impact.y * RADIUS}
                r={5}
                fill={ARROW_COLORS[impact.score] ?? '#9ca3af'}
                stroke="white"
                strokeWidth={1}
                opacity={0.85}
              />
            </g>
          ))}
        </svg>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <div className="w-3 h-3 rounded-full border-2 border-purple-500 border-dashed" />
        <span>Centro de agrupación</span>
        <span className="text-slate-300">·</span>
        <span>{impacts.length} impactos registrados</span>
      </div>
    </div>
  )
}