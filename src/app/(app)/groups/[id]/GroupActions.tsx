'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, UserMinus, Trash2 } from 'lucide-react'
import { leaveGroup, removeMember } from '@/lib/actions/groups'
import { promoteMember, demoteMember } from '@/lib/actions/groups'

export function LeaveGroupButton({ groupId }: { groupId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLeave() {
    if (!confirm('¿Seguro que quieres salir del grupo?')) return
    setLoading(true)
    await leaveGroup(groupId)
    router.push('/groups')
  }

  return (
    <button
      type="button"
      onClick={handleLeave}
      disabled={loading}
      className="btn-ghost p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
    >
      <LogOut className="w-4 h-4" />
    </button>
  )
}

export function RemoveMemberButton({ groupId, userId, memberName }: { groupId: string; userId: string; memberName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRemove() {
    if (!confirm(`¿Eliminar a ${memberName} del grupo?`)) return
    setLoading(true)
    const result = await removeMember(groupId, userId)
    if (result?.error) {
      alert(result.error)
      setLoading(false)
      return
    }
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={loading}
      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
    >
      <UserMinus className="w-4 h-4" />
    </button>
  )
}

export function PromoteMemberButton({ groupId, userId, memberName }: { groupId: string; userId: string; memberName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handlePromote() {
    if (!confirm(`¿Promocionar a ${memberName} como entrenador?`)) return
    setLoading(true)
    const result = await promoteMember(groupId, userId)
    if (result?.error) {
      alert(result.error)
      setLoading(false)
      return
    }
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handlePromote}
      disabled={loading}
      title="Promocionar a entrenador"
      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
    >
      <span className="text-sm">⬆️</span>
    </button>
  )
}

export function DemoteMemberButton({ groupId, userId, memberName }: { groupId: string; userId: string; memberName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDemote() {
    if (!confirm(`¿Convertir a ${memberName} en arquero?`)) return
    setLoading(true)
    const result = await demoteMember(groupId, userId)
    if (result?.error) {
      alert(result.error)
      setLoading(false)
      return
    }
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleDemote}
      disabled={loading}
      title="Convertir en arquero"
      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
    >
      <span className="text-sm">⬇️</span>
    </button>
 )
}

export function DeleteScheduledButton({ trainingId, groupId }: { trainingId: string; groupId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('¿Eliminar este entrenamiento programado?')) return
    setLoading(true)
    const { deleteScheduledTraining } = await import('@/lib/actions/scheduled')
    await deleteScheduledTraining(trainingId, groupId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
