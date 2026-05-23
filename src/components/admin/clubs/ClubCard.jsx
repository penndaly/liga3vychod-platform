import { Link } from 'react-router-dom'
import { Users, ChevronRight } from 'lucide-react'

function StatusBadge({ status }) {
  const cfg = {
    complete: { cls: 'bg-green-100 text-green-700', label: 'Aktívny' },
    partial:  { cls: 'bg-yellow-100 text-yellow-700', label: 'Profil' },
    empty:    { cls: 'bg-slate-100 text-slate-500', label: 'Čakajúci' },
  }[status]
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded ${cfg.cls}`}>{cfg.label}</span>
  )
}

export default function ClubCard({ club, firestoreData }) {
  const status = !firestoreData
    ? 'empty'
    : firestoreData.logoUrl && firestoreData.ground
    ? 'complete'
    : 'partial'

  return (
    <Link
      to={`/admin/clubs/${club.id}/edit`}
      className="bg-white border border-slate-100 rounded-xl p-5 hover:border-slate-200 hover:shadow-sm transition-all group flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 group-hover:border-slate-300 flex items-center justify-center overflow-hidden transition-colors shrink-0">
          {firestoreData?.logoUrl ? (
            <img src={firestoreData.logoUrl} alt={club.name} className="w-full h-full object-contain p-1.5" />
          ) : (
            <span className="text-sm font-black text-slate-400">{club.short}</span>
          )}
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="flex-1">
        <p className="text-sm font-bold text-slate-900 leading-snug group-hover:text-green-700 transition-colors">
          {firestoreData?.name ?? club.name}
        </p>
        {firestoreData?.city ? (
          <p className="text-xs text-slate-400 mt-0.5">{firestoreData.city}</p>
        ) : (
          <p className="text-xs text-slate-300 mt-0.5">Profil nevyplnený</p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        {firestoreData?.ground ? (
          <span className="truncate">{firestoreData.ground}</span>
        ) : (
          <span />
        )}
        <ChevronRight size={13} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  )
}
