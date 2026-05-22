import { useState } from 'react'
import { Pencil, Trash2, Plus, UserRound } from 'lucide-react'
import { doc, deleteDoc } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { db } from '../../../services/firebase'
import { POSITIONS } from './PlayerModal'
import PlayerModal from './PlayerModal'

const POSITION_ORDER = { GK: 1, DEF: 2, MID: 3, FWD: 4 }

function PositionBadge({ value }) {
  const pos = POSITIONS.find((p) => p.value === value)
  if (!pos) return null
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded ${pos.cls}`}>{pos.label}</span>
  )
}

export default function RosterTable({ clubId, players, onChanged }) {
  const [modal, setModal] = useState(null) // null | 'add' | player object

  const sorted = [...players].sort((a, b) => {
    const pd = (POSITION_ORDER[a.position] ?? 9) - (POSITION_ORDER[b.position] ?? 9)
    if (pd !== 0) return pd
    return (a.number ?? 999) - (b.number ?? 999)
  })

  async function handleDelete(player) {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Odstrániť hráča ${player.name}?`)) return
    try {
      await deleteDoc(doc(db, 'clubs', String(clubId), 'players', player.id))
      toast.success('Hráč odstránený')
      onChanged()
    } catch {
      toast.error('Chyba pri odstraňovaní')
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Zostava</p>
            <p className="text-xs text-slate-400 mt-0.5">{players.length} hráčov</p>
          </div>
          <button
            onClick={() => setModal('add')}
            className="flex items-center gap-2 bg-yellow-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-yellow-300 transition-colors"
          >
            <Plus size={13} /> Pridať hráča
          </button>
        </div>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-300">
            <UserRound size={32} className="mb-2" />
            <p className="text-sm font-bold">Žiadni hráči</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400 font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-2.5 w-10">#</th>
                <th className="text-left px-3 py-2.5">Meno</th>
                <th className="text-left px-3 py-2.5">Pozícia</th>
                <th className="text-left px-3 py-2.5 hidden sm:table-cell">Dátum nar.</th>
                <th className="px-4 py-2.5 w-20" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((player) => (
                <tr key={player.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-3 text-slate-500 font-bold text-xs tabular-nums w-10">
                    {player.number ?? '—'}
                  </td>
                  <td className="px-3 py-3 font-bold text-slate-900">{player.name}</td>
                  <td className="px-3 py-3">
                    <PositionBadge value={player.position} />
                  </td>
                  <td className="px-3 py-3 text-slate-400 text-xs hidden sm:table-cell">
                    {player.dob || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setModal(player)}
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(player)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <PlayerModal
          clubId={clubId}
          player={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); onChanged() }}
        />
      )}
    </>
  )
}
