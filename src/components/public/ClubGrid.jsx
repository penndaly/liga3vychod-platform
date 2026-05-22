import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { CLUBS } from '../../data/placeholder'

export default function ClubGrid() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-2 mb-6">
        <Shield size={14} className="text-yellow-400" />
        <h2 className="text-xs font-black uppercase tracking-widest text-yellow-400">
          Kluby — Sezóna 2025/26
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {CLUBS.map((club) => (
          <Link
            key={club.id}
            to={`/kluby/${club.id}`}
            className="flex flex-col items-center gap-2 p-4 bg-slate-800 border border-slate-700 hover:border-yellow-400 rounded transition-colors group text-center"
          >
            <div className="w-12 h-12 rounded-full bg-slate-700 border border-slate-600 group-hover:border-yellow-400 group-hover:bg-yellow-400/10 flex items-center justify-center transition-colors shrink-0">
              <span className="text-xs font-black text-yellow-400">{club.short}</span>
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
