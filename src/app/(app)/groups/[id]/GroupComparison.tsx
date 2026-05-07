'use client'

import { useState, useEffect } from 'react'
import { getGroupProgressComparison } from '@/lib/actions/groups'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import { formatDate } from '@/lib/utils'

const COLORS = ['#0c8fe6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#f97316']

interface MemberData {
  user_id: string
  full_name: string
  sessions: { date: string; score: number }[]
}

export function GroupComparison({ groupId }: { groupId: string }) {
  const [data, setData] = useState<MemberData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getGroupProgressComparison(groupId).then(result => {
      setData(result as MemberData[])
      setLoading(false)
    })
  }, [groupId])

  if (loading) return <div className="py-8 text-center text-sm text-slate-400">Cargando...</div>

  const membersWithData = data.filter(m => m.sessions.length > 0)

  if (membersWithData.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-400">
        No hay suficientes datos para comparar
      </div>
    )
  }

  // Combinar todas las fechas únicas
  const allDates = [...new Set(
    membersWithData.flatMap(m => m.sessions.map(s => s.date))
  )].sort()

  // Construir datos para la gráfica
  const chartData = allDates.map(date => {
    const point: Record<string, any> = {
      date: formatDate(date),
    }
    membersWithData.forEach(m => {
      const session = m.sessions.find(s => s.date === date)
      point[m.full_name] = session?.score ?? null
    })
    return point
  })

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: 'currentColor' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'currentColor' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--tooltip-bg, #fff)',
            border: '1px solid rgba(148,163,184,0.3)',
            borderRadius: '12px',
            fontSize: '12px',
          }}
          formatter={(value: number, name: string) => [`${value} pts`, name]}
        />
        <Legend />
        {membersWithData.map((m, idx) => (
          <Line
            key={m.user_id}
            type="monotone"
            dataKey={m.full_name}
            stroke={COLORS[idx % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}