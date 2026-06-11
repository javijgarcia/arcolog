'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import type { Modality } from '@/types'
import { SCORES_BY_MODALITY } from '@/types'

interface Props {
  arrowScores: string[]
  modality: Modality
}

const SCORE_COLORS_MAP: Record<string, string> = {
  'X':  '#fde047',
  '11': '#fde047',
  '10': '#fde047',
  '9':  '#fde047',
  '8':  '#ef4444',
  '7':  '#ef4444',
  '6':  '#3b82f6',
  '5':  '#3b82f6',
  '4':  '#1f2937',
  '3':  '#1f2937',
  '2':  '#e5e7eb',
  '1':  '#e5e7eb',
  'M':  '#e5e7eb',
  '0':  '#e5e7eb',
}

export function ScoreDistributionChart({ arrowScores, modality }: Props) {
  if (arrowScores.length === 0) return null

  const scores = SCORES_BY_MODALITY[modality] as readonly string[]

  const counts = scores.map(score => ({
    score,
    count: arrowScores.filter(s => s === score).length,
    color: SCORE_COLORS_MAP[score] ?? '#94a3b8',
  })).filter(d => d.count > 0)

  if (counts.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={counts} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
        <XAxis
          dataKey="score"
          tick={{ fontSize: 12, fill: 'currentColor' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'currentColor' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--tooltip-bg, #fff)',
            border: '1px solid rgba(148,163,184,0.3)',
            borderRadius: '12px',
            fontSize: '13px',
          }}
          formatter={(value: number) => [`${value} flechas`, 'Cantidad']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {counts.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}