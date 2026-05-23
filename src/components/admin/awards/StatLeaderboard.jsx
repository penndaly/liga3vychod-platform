import { Pencil, Trash2, Plus } from 'lucide-react'

const RANK_CLS = {
  1: 'text-yellow-500 font-black',
  2: 'text-slate-400 font-black',
  3: 'text-amber-600 font-black',
}

export default function StatLeaderboard({
  title, players, sortKey, label, unit, color,
  onAdd, onEdit, onDelete, loading,
}) {
  const sorted = [...players]
    .filter((p) => (p[sortKey] ?? 0) > 0)
    .sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0))

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${color}`} />
          <p className="text-sm font-black text-slate-900 uppercase tracking-widest">{title}</p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Plus size={11} /> Pridať
        </button>
      </div>

      {loading ? (
        <div className="space-y-px p-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-50 rounded animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="py-10 text-center text-slate-300 text-sm font-bold">Žiadne záznamy</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-50 text-xs text-slate-400 font-bold uppercase tracking-widest">
              <th className="text-left px-5 py-2.5 w-8">#</th>
              <th className="text-left px-3 py-2.5">Hráč</th>
              <th className={`text-right px-4 py-2.5 font-black`}>{label}</th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((player, i) => {
              const rank = i + 1
              return (
                <tr key={player.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                  <td className={`px-5 py-2.5 text-sm w-8 ${RANK_CLS[rank] ?? 'text-slate-400 font-bold'}`}>
                    {rank}
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-bold text-slate-900 text-sm leading-tight">{player.name}</p>
                    <p className="text-xs text-slate-400 truncate">{player.club}</p>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-xl font-black text-slate-900">{player[sortKey] ?? 0}</span>
                    {unit && <span className="text-xs text-slate-400 ml-1">{unit}</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(player)} className="text-slate-400 hover:text-slate-700 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => onDelete(player)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
