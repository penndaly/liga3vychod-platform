import { Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCollection } from '../../../hooks/useFirestore'
import { CLUBS } from '../../../data/placeholder'

const STATUS = {
  active:   { label: 'Aktívny',   cls: 'bg-green-50 text-green-600 border-green-200' },
  pending:  { label: 'Čakajúci',  cls: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  missing:  { label: 'Chýba',     cls: 'bg-red-50 text-red-500 border-red-200' },
}

export default function ClubHealthGrid() {
  const { data: firestoreClubs } = useCollection('clubs')

  // Build map of configured clubs by name for O(1) lookup
  const configured = new Set(firestoreClubs.map((c) => c.name))

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-blue-500" />
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
            Stav klubov
          </h2>
        </div>
        <Link
          to="/admin/clubs"
          className="text-xs text-slate-400 hover:text-slate-700 uppercase tracking-wide transition-colors"
        >
          Spravovať →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {CLUBS.map((club) => {
          const status = configured.has(club.name) ? STATUS.active : STATUS.pending
          return (
            <div
              key={club.id}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors text-center"
            >
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="text-xs font-black text-slate-500">{club.short}</span>
              </div>
              <span className="text-xs text-slate-600 font-medium leading-tight line-clamp-2">
                {club.name}
              </span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${status.cls}`}>
                {status.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
