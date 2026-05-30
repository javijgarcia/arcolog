'use client'

import { useState } from 'react'
import { getExportData } from '@/lib/actions/export'
import { Download } from 'lucide-react'

interface Props {
  type: 'personal' | 'group'
  groupId?: string
  label?: string
}

export function ExportButton({ type, groupId, label = 'Exportar' }: Props) {
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  async function handleExport(format: 'xlsx' | 'pdf') {
    setLoading(true)
    setShowMenu(false)
    try {
      const data = await getExportData(type, groupId)
      if (!data) return

      if (format === 'xlsx') {
        await exportToExcel(data)
      } else {
        await exportToPDF(data)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function exportToExcel(data: any) {
    const XLSX = await import('xlsx')

    const wb = XLSX.utils.book_new()

   // Agrupar sesiones por arquero
    if (data.members) {
      for (const member of data.members) {
        const memberName = (member as any).profiles?.full_name ?? 'Arquero'
        const memberSessions = data.sessions.filter((s: any) => s.user_id === member.user_id)
        if (memberSessions.length === 0) continue

        const memberData = memberSessions.map((s: any) => {
          const totalScore = (s.session_ends ?? []).reduce((sum: number, e: any) => sum + e.score, 0)
          return {
            'Fecha': s.session_date,
            'Modalidad': s.modality ?? '—',
            'Distancia (m)': s.distance_meters > 0 ? s.distance_meters : '—',
            'Flechas': s.total_arrows,
            'Puntuación': totalScore || '—',
            'Sensación': s.feeling_score ?? '—',
            'Objetivo': s.objective ?? '—',
            'Concentración': s.mental_concentration ?? '—',
            'Activación': s.mental_activation ?? '—',
            'Nervios': s.mental_nerves ?? '—',
            'Notas': s.notes ?? '—',
          }
        })

        const ws = XLSX.utils.json_to_sheet(memberData)
        const sheetName = memberName.substring(0, 31)
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
      }
    } else {
      const sessionsData = data.sessions.map((s: any) => {
        const totalScore = (s.session_ends ?? []).reduce((sum: number, e: any) => sum + e.score, 0)
        return {
          'Fecha': s.session_date,
          'Modalidad': s.modality ?? '—',
          'Distancia (m)': s.distance_meters > 0 ? s.distance_meters : '—',
          'Flechas': s.total_arrows,
          'Puntuación': totalScore || '—',
          'Sensación': s.feeling_score ?? '—',
          'Objetivo': s.objective ?? '—',
          'Concentración': s.mental_concentration ?? '—',
          'Activación': s.mental_activation ?? '—',
          'Nervios': s.mental_nerves ?? '—',
          'Notas': s.notes ?? '—',
        }
      })
      const wsS = XLSX.utils.json_to_sheet(sessionsData)
      XLSX.utils.book_append_sheet(wb, wsS, 'Entrenamientos')
    }
	
     

    // Hoja de competiciones
    const competitionsData = data.competitions.map((c: any) => {
      const memberName = data.members
        ? data.members.find((m: any) => m.user_id === c.user_id)?.profiles?.full_name ?? 'Arquero'
        : data.profile?.full_name ?? ''

      return {
        'Fecha': c.competition_date,
        'Arquero': memberName,
        'Competición': c.competition_name,
        'Modalidad': c.modality ?? '—',
        'Tipo': c.competition_type ?? '—',
        'Categoría': c.category ?? '—',
        'Ronda': c.round_type ?? '—',
        'Distancia (m)': c.distance_meters ?? '—',
        'Puntuación': c.total_score,
        'X': c.x_count ?? 0,
        '10s': c.tens_count ?? 0,
        'Posición': c.ranking_position ?? '—',
        'Notas': c.notes ?? '—',
      }
    })

    const wsC = XLSX.utils.json_to_sheet(competitionsData)
    XLSX.utils.book_append_sheet(wb, wsC, 'Competiciones')

    const fileName = type === 'group' ? 'arcolog_grupo.xlsx' : 'arcolog_historial.xlsx'
    XLSX.writeFile(wb, fileName)
  }

  async function exportToPDF(data: any) {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF()

    // Título
    doc.setFontSize(20)
    doc.text('ArcoLog — Historial', 14, 20)

    doc.setFontSize(11)
    doc.text(`Arquero: ${data.profile?.full_name ?? '—'}`, 14, 30)
    doc.text(`Club: ${data.profile?.club_name ?? '—'}`, 14, 37)
    doc.text(`Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}`, 14, 44)

    // Tabla de entrenamientos
    doc.setFontSize(14)
    doc.text('Entrenamientos', 14, 56)

    const sessionsRows = data.sessions.map((s: any) => {
      const totalScore = (s.session_ends ?? []).reduce((sum: number, e: any) => sum + e.score, 0)
      const memberName = data.members
        ? data.members.find((m: any) => m.user_id === s.user_id)?.profiles?.full_name ?? 'Arquero'
        : ''
      return [
        s.session_date,
        ...(data.members ? [memberName] : []),
        s.modality ?? '—',
        s.distance_meters > 0 ? `${s.distance_meters}m` : '—',
        s.total_arrows,
        totalScore || '—',
        s.feeling_score ?? '—',
      ]
    })

    const sessionsHead = [
      ['Fecha', ...(data.members ? ['Arquero'] : []), 'Modalidad', 'Distancia', 'Flechas', 'Puntuación', 'Sensación']
    ]

    autoTable(doc, {
      startY: 60,
      head: sessionsHead,
      body: sessionsRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [12, 143, 230] },
    })

    // Tabla de competiciones
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(14)
    doc.text('Competiciones', 14, finalY)

    const compRows = data.competitions.map((c: any) => {
      const memberName = data.members
        ? data.members.find((m: any) => m.user_id === c.user_id)?.profiles?.full_name ?? 'Arquero'
        : ''
      return [
        c.competition_date,
        ...(data.members ? [memberName] : []),
        c.competition_name,
        c.modality ?? '—',
        c.total_score,
        c.ranking_position ?? '—',
      ]
    })

    const compHead = [
      ['Fecha', ...(data.members ? ['Arquero'] : []), 'Competición', 'Modalidad', 'Puntuación', 'Posición']
    ]

    autoTable(doc, {
      startY: finalY + 4,
      head: compHead,
      body: compRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [245, 158, 11] },
    })

    const fileName = type === 'group' ? 'arcolog_grupo.pdf' : 'arcolog_historial.pdf'
    doc.save(fileName)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
        className="btn-secondary flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        {loading ? 'Exportando...' : label}
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-1 z-10 card p-2 shadow-lg min-w-36">
          <button
            type="button"
            onClick={() => handleExport('xlsx')}
            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            📊 Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            📄 PDF
          </button>
        </div>
      )}
    </div>
  )
}