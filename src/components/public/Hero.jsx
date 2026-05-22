import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="relative bg-slate-900 overflow-hidden">
      {/* Diagonal stripe texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #facc15 0, #facc15 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }}
      />
      {/* Right glow */}
      <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-green-600/5 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-0.5 w-10 bg-yellow-400" />
            <span className="text-yellow-400 text-xs font-black uppercase tracking-widest">
              Sezóna 2025/26
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black uppercase text-white leading-none mb-1">
            TIPOS III.
          </h1>
          <h1 className="text-5xl md:text-7xl font-black uppercase text-yellow-400 leading-none mb-6">
            LIGA VÝCHOD
          </h1>

          <p className="text-slate-400 text-base md:text-lg mb-10 max-w-xl leading-relaxed">
            Sledujte výsledky, tabuľku a novinky z tretej najvyššej futbalovej
            súťaže na východnom Slovensku.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              to="/tabulka"
              className="inline-flex items-center gap-2 bg-yellow-400 text-slate-950 px-6 py-3 font-black uppercase tracking-widest text-xs hover:bg-yellow-300 transition-colors"
            >
              Tabuľka <ChevronRight size={14} />
            </Link>
            <Link
              to="/vysledky"
              className="inline-flex items-center gap-2 border border-slate-600 text-white px-6 py-3 font-black uppercase tracking-widest text-xs hover:border-slate-400 transition-colors"
            >
              Výsledky <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-yellow-400 via-green-600 to-transparent" />
    </section>
  )
}
