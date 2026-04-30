import Link from 'next/link'
import { Target } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <Link href="/" className="flex items-center gap-2.5 mb-8">
       <img src="/logo.png" alt="ArcoLog" className="h-10 w-10 rounded-xl object-contain" />
        <span className="font-semibold text-xl text-slate-900 dark:text-white">ArcoLog</span>
      </Link>
      <div className="card w-full max-w-sm p-8">
        {children}
      </div>
    </div>
  )
}
