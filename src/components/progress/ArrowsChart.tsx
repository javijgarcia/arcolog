'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DataPoint {
  month: string
  label: string
  training: number
  competition: number
  total: number
}

interface Props {
  data: DataPoint[]
}

export function ArrowsChart({ data }: Props) {
  if (data.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'currentColor' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'currentColor' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--tooltip-bg, #fff)',
            border: '1px solid rgba(148,163,184,0.3)',
            borderRadius: '12px',
            fontSize: '13px',
          }}
          formatter={(value: number) => [`${value} flechas`, 'Total']}
        />
        <Bar dataKey="total" fill="#0c8fe6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}