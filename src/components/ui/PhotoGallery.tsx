'use client'

import { useState, useRef } from 'react'
import { Camera, Trash2, X, Plus } from 'lucide-react'
import { uploadPhoto, deletePhoto } from '@/lib/actions/photos'

interface Photo {
  id: string
  url: string
  caption: string | null
  storage_path: string
}

interface Props {
  photos: Photo[]
  sessionId?: string
  competitionId?: string
}

export function PhotoGallery({ photos: initialPhotos, sessionId, competitionId }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState<Photo | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)

    for (const file of Array.from(files)) {
      const result = await uploadPhoto(
        file,
        sessionId ?? null,
        competitionId ?? null,
      )
      if (!result.error) {
        const url = URL.createObjectURL(file)
        setPhotos(prev => [...prev, {
          id: Date.now().toString(),
          url,
          caption: null,
          storage_path: '',
        }])
      }
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDelete(photo: Photo) {
    await deletePhoto(photo.id, photo.storage_path)
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
    setSelected(null)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {photos.map(photo => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
            onClick={() => setSelected(photo)}
          >
            <img
              src={photo.url}
              alt={photo.caption ?? 'Foto'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center gap-1 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <p className="text-xs text-slate-400">Subiendo...</p>
          ) : (
            <>
              <Camera className="w-5 h-5 text-slate-400" />
              <p className="text-xs text-slate-400">Añadir</p>
            </>
          )}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleUpload}
      />

      {/* Modal foto ampliada */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-w-lg w-full"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={selected.url}
              alt={selected.caption ?? 'Foto'}
              className="w-full rounded-2xl"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={() => handleDelete(selected)}
                className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setSelected(null)}
                className="w-9 h-9 rounded-xl bg-black/50 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            {selected.caption && (
              <p className="text-white text-sm mt-2 text-center">{selected.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}