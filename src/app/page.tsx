import Link from 'next/link'
import { Target, TrendingUp, BookOpen, Award, Users, Trophy } from 'lucide-react'
import { WorldMap } from '@/components/ui/WorldMap'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ArcoLog" className="h-10 w-10 rounded-xl object-contain" />
            <span className="font-semibold text-slate-900 dark:text-white">ArcoLog</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="btn-secondary text-sm py-2">
              Entrar
            </Link>
            <Link href="/auth/register" className="btn-primary text-sm py-2">
              Regístrate
            </Link>
          </div>
        </div>
      </header>

      {/* Hero con imagen */}
      <section className="flex-1 px-4 py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 badge-blue mb-6 px-3 py-1.5 text-sm">
                <Target className="w-3.5 h-3.5" />
                Diario de entrenamiento para arqueros
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                Registra cada flecha.{' '}
                <span className="text-brand-600 dark:text-brand-400">Visualiza tu progreso.</span>
              </h1>
              <p className="text-lg text-slate-500 dark:text-slate-400 mb-10">
                Lleva un control completo de tus sesiones de entrenamiento y competiciones.
                Analiza tu evolución con gráficas claras y mejora más rápido.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link href="/auth/register" className="btn-primary text-base px-6 py-3 w-full sm:w-auto justify-center">
                  Empezar gratis
                </Link>
                <Link href="/auth/login" className="btn-secondary text-base px-6 py-3 w-full sm:w-auto justify-center">
                  Ya tengo cuenta
                </Link>
              </div>
            </div>

            <div className="flex justify-center">
              <img
                src="/hero.png"
                alt="ArcoLog app"
                className="w-full max-w-md rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: BookOpen,
              title: 'Registra sesiones',
              desc: 'Flechas, distancia, tandas, sensaciones y más en segundos.',
            },
            {
              icon: TrendingUp,
              title: 'Visualiza el progreso',
              desc: 'Gráficas de puntuación de entrenamiento y competición en un vistazo.',
            },
            {
              icon: Award,
              title: 'Sigue tus marcas',
              desc: 'Historial de competiciones con tu mejor puntuación siempre visible.',
            },
            {
              icon: Target,
              title: 'Todas las modalidades',
              desc: 'Recurvo, compuesto, longbow. Diana, campo, sala, 3D.',
            },
            {
              icon: Users,
              title: 'Grupos y entrenadores',
              desc: 'Gestiona tu grupo, programa entrenamientos y sigue el progreso de tus arqueros.',
            },
            {
              icon: Trophy,
              title: 'Eliminatorias',
              desc: 'Crea cuadros de eliminatorias y síguelos en directo con un enlace público.',
            },
          ].map(f => (
            <div key={f.title} className="card p-5">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{f.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mapa de usuarios */}
      <section className="w-full py-12 px-4 space-y-4">
        <div className="text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Arqueros de todo el mundo
          </p>
        </div>
        <WorldMap />
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-sm text-slate-400">
        ArcoLog © {new Date().getFullYear()}
      </footer>
    </main>
  )
}