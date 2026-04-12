'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { formatDate } from '@/lib/utils'
import type { ProgressDataPoint } from '@/types'

interface Props {
  data: ProgressDataPoint[]
}

export function ProgressChart({ data }: Props) {
  if (data.length === 0) return null

  const chartData = data.map(d => ({
    date: formatDate(d.date),
    rawDate: d.date,
    training: d.type === 'training' ? d.score : null,
    competition: d.type === 'competition' ? d.score : null,
    label: d.label,
  }))

  const maxScore = Math.max(...data.map(d => d.score))
  const personalBest = data.filter(d => d.type === 'competition').reduce(
    (max, d) => (d.score > max ? d.score : max), 0
  )

  return (
    <div className="space-y-1">
      {personalBest > 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-right">
          Mejor marca competición: <strong className="text-amber-600 dark:text-amber-400">{personalBest}</strong>
        </p>
      )}
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'currentColor' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'currentColor' }}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg, #fff)',
              border: '1px solid rgba(148,163,184,0.3)',
              borderRadius: '12px',
              fontSize: '13px',
            }}
            labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            formatter={(value: number, name: string) => [
              `${value} pts`,
              name === 'training' ? 'Entrenamiento' : 'Competición',
            ]}
          />
          <Legend
            formatter={(value) => value === 'training' ? 'Entrenamiento' : 'Competición'}
          />
          {personalBest > 0 && (
            <ReferenceLine
              y={personalBest}
              stroke="#f59e0b"
              strokeDasharray="5 3"
              label={{ value: `PB ${personalBest}`, fontSize: 11, fill: '#f59e0b', position: 'insideTopRight' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="training"
            stroke="#0c8fe6"
            strokeWidth={2}
            dot={{ r: 3, fill: '#0c8fe6' }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="competition"
            stroke="#f59e0b"
            strokeWidth={2.5}
            dot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 7 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
