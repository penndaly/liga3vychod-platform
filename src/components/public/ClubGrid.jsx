import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { CLUBS_2025_26 } from '../../config/clubs-config'

export default function ClubGrid() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-yellow-400" />
          <h2 className="text-xs font-black uppercase tracking-widest text-yellow-400">
            Kluby — Sezóna 2025/26
          </h2>
        </div>
        <Link to="/kluby" className="text-xs text-slate-600 hover:text-slate-300 uppercase tracking-wide transition-colors">
          Všetky →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {CLUBS_2025_26.map((club) => (
          <Link
            key={club.id}
            to={`/kluby/${club.id}`}
            className="flex flex-col items-center gap-2 p-4 bg-slate-800/60 border border-slate-700/60 hover:border-slate-500 rounded-xl transition-all group text-center hover:bg-slate-800"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
              style={{ background: club.color ?? '#475569' }}
            >
              <span className="text-xs font-black text-white drop-shadow">{club.short}</span>
            </div>
            <span className="text-slate-400 group-hover:text-white text-xs leading-tight transition-colors line-clamp-2">
              {club.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
