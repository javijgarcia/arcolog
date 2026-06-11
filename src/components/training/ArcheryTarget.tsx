'use client'

import { useState, useRef } from 'react'
import type { Modality } from '@/types'

interface ImpactPoint {
  x: number
  y: number
  score: string
  arrowNumber: number
}

interface Props {
  modality: Modality
  endNumber: number
  arrowsPerEnd: number
  onEndComplete: (end: {
    end_number: number
    arrows: number
    score: number
    arrow_scores: string[]
    impacts: { x: number; y: number }[]
  }) => void
}

// Definición de zonas para Aire Libre y Sala (diana circular WA)
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

function getScoreFromPosition(dx: number, dy: number, modality: Modality): string {
  const dist = Math.sqrt(dx * dx + dy * dy)
  const zones = getZones(modality)
  for (const zone of zones) {
    if (dist <= zone.maxR) return zone.score
  }
  return 'M'
}

function scoreToNumber(score: string): number {
  if (score === 'X') return 10
  if (score === 'M') return 0
  return parseInt(score) || 0
}

const ARROW_COLORS: Record<string, string> = {
  'X': '#ca8a04', '11': '#ca8a04', '10': '#ca8a04', '9': '#ca8a04',
  '8': '#dc2626', '7': '#dc2626',
  '6': '#2563eb', '5': '#2563eb',
  '4': '#111827', '3': '#111827', '2': '#111827', '1': '#111827',
  'M': '#9ca3af', '0': '#9ca3af',
}

export function ArcheryTarget({ modality, endNumber, arrowsPerEnd, onEndComplete }: Props) {
  const [impacts, setImpacts] = useState<ImpactPoint[]>([])
  const svgRef = useRef<SVGSVGElement>(null)
  const zones = getZones(modality)
  const SIZE = 300
  const CENTER = SIZE / 2
  const RADIUS = SIZE / 2 - 10

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (impacts.length >= arrowsPerEnd) return

    const svg = svgRef.current
    if (!svg) return

    const rect = svg.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)

    const score = getScoreFromPosition(x, y, modality)
    const newImpact: ImpactPoint = { x, y, score, arrowNumber: impacts.length + 1 }
    const newImpacts = [...impacts, newImpact]
    setImpacts(newImpacts)

    if (newImpacts.length === arrowsPerEnd) {
      const totalScore = newImpacts.reduce((sum, i) => sum + scoreToNumber(i.score), 0)
      onEndComplete({
        end_number: endNumber,
        arrows: arrowsPerEnd,
        score: totalScore,
        arrow_scores: newImpacts.map(i => i.score),
        impacts: newImpacts.map(i => ({ x: i.x, y: i.y })),
      })
      setImpacts([])
    }
  }

  function handleUndo() {
    setImpacts(prev => prev.slice(0, -1))
  }

  const currentScore = impacts.reduce((sum, i) => sum + scoreToNumber(i.score), 0)
  const remaining = arrowsPerEnd - impacts.length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Tanda #{endNumber} · {remaining} {remaining === 1 ? 'flecha' : 'flechas'} restantes
        </span>
        <span className="text-lg font-bold text-slate-900 dark:text-white">{currentScore} pts</span>
      </div>

      {/* Flechas marcadas */}
      <div className="flex gap-2 min-h-8">
        {impacts.map((impact, i) => (
          <div
            key={i}
            className="flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: ARROW_COLORS[impact.score] ?? '#9ca3af' }}
          >
            {impact.score}
          </div>
        ))}
        {Array.from({ length: remaining }).map((_, i) => (
          <div key={`empty-${i}`} className="flex-1 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600" />
        ))}
      </div>

      {/* Diana SVG */}
      <div className="flex justify-center">
        <svg
          ref={svgRef}
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="cursor-crosshair touch-none rounded-full shadow-md"
          onClick={handleClick}
          style={{ maxWidth: '100%' }}
        >
          {/* Anillos de la diana */}
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

          {/* Líneas de cruz centrales */}
          <line x1={CENTER - 10} y1={CENTER} x2={CENTER + 10} y2={CENTER} stroke="#9ca3af" strokeWidth={0.5} />
          <line x1={CENTER} y1={CENTER - 10} x2={CENTER} y2={CENTER + 10} stroke="#9ca3af" strokeWidth={0.5} />

          {/* Puntuaciones en la diana */}
          {zones.slice(0, -1).map((zone, i) => {
            const prevR = i > 0 ? zones[i - 1].maxR * RADIUS : 0
            const r = zone.maxR * RADIUS
            const labelR = (prevR + r) / 2
            return (
              <text
                key={i}
                x={CENTER + labelR}
                y={CENTER}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={Math.max(8, Math.min(12, (r - prevR) * 0.6))}
                fill={zone.color === '#1f2937' ? '#f9fafb' : '#6b7280'}
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {zone.score}
              </text>
            )
          })}

          {/* Impactos marcados */}
          {impacts.map((impact, i) => {
            const px = CENTER + impact.x * RADIUS
            const py = CENTER + impact.y * RADIUS
            return (
              <g key={i}>
                <circle
                  cx={px}
                  cy={py}
                  r={6}
                  fill={ARROW_COLORS[impact.score] ?? '#9ca3af'}
                  stroke="white"
                  strokeWidth={1.5}
                />
                <text
                  x={px}
                  y={py}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={7}
                  fill="white"
                  fontWeight="bold"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {i + 1}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {impacts.length > 0 && (
        <button
          type="button"
          onClick={handleUndo}
          className="btn-secondary w-full justify-center text-sm"
        >
          ← Borrar última flecha
        </button>
      )}
    </div>
  )
}