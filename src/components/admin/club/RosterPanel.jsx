import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { Plus, UserRound, Pencil, Trash2, Loader } from 'lucide-react'
import { db } from '../../../services/firebase'
import { POSITIONS } from '../clubs/PlayerModal'
import PlayerModal from '../clubs/PlayerModal'

const POSITION_ORDER = { GK: 1, DEF: 2, MID: 3, FWD: 4 }

const POS_DARK = {
  GK:  'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25',
  DEF: 'bg-blue-500/15   text-blue-400   border border-blue-500/25',
  MID: 'bg-green-500/15  text-green-400  border border-green-500/25',
  FWD: 'bg-red-500/15    text-red-400    border border-red-500/25',
}

function DarkPositionBadge({ value }) {
  const pos = POSITIONS.find((p) => p.value === value)
  if (!pos) return null
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded ${POS_DARK[value] ?? 'bg-slate-700 text-slate-400'}`}>
      {pos.label}
    </span>
  )
}

export default function RosterPanel({ data, clubColor = '#facc15' }) {
  const clubId = data.club?.id

  const [players,  setPlayers]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null) // null | 'add' | player object

  const load = useCallback(async () => {
    if (!clubId) return
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'clubs', String(clubId), 'players'))
      setPlayers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch {
      toast.error('Chyba pri načítaní hráčov')
    } finally {
      setLoading(false)
    }
  }, [clubId])

  useEffect(() => { load() }, [load])

  async function handleDelete(player) {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Odstrániť hráča ${player.name}?`)) return
    try {
      await deleteDoc(doc(db, 'clubs', String(clubId), 'players', player.id))
      toast.success('Hráč odstránený')
      load()
    } catch {
      toast.error('Chyba pri odstraňovaní')
    }
  }

  const sorted = [...players].sort((a, b) => {
    const pd = (POSITION_ORDER[a.position] ?? 9) - (POSITION_ORDER[b.position] ?? 9)
    return pd !== 0 ? pd : (a.number ?? 999) - (b.number ?? 999)
  })

  // Group by position for the section headers
  const groups = POSITIONS
    .map((pos) => ({ pos, rows: sorted.filter((p) => p.position === pos.value) }))
    .filter((g) => g.rows.length > 0)

  return (
    <>
      <div className="space-y-4">

        {/* Header bar */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 font-bold">
            {loading ? '…' : `${players.length} hráčov`}
          </p>
          <button
            onClick={() => setModal('add')}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-wide px-4 py-2 rounded-xl transition-colors"
            style={{ background: clubColor, color: '#0f172a' }}
          >
            <Plus size={13} /> Pridať hráča
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center py-20">
            <Loader size={20} className="animate-spin text-slate-600" />
          </div>
        ) : players.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center py-20 text-slate-700">
            <UserRound size={32} className="mb-3" />
            <p className="text-sm font-black uppercase tracking-widest mb-1">Žiadni hráči</p>
            <p className="text-xs">Pridajte prvého hráča pomocou tlačidla vyššie</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-600 font-bold uppercase tracking-widest">
                  <th className="text-left px-5 py-3 w-10">#</th>
                  <th className="text-left px-3 py-3">Meno</th>
                  <th className="text-left px-3 py-3">Pozícia</th>
                  <th className="text-left px-3 py-3 hidden sm:table-cell">Dátum nar.</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {groups.map(({ pos, rows }) => (
                  <>
                    <tr key={`hdr-${pos.value}`} className="border-b border-slate-800/60">
                      <td colSpan={5} className="px-5 py-2">
                        <span
                          className="text-[10px] font-black uppercase tracking-widest"
                          style={{ color: clubColor }}
                        >
                          {pos.label}s · {rows.length}
                        </span>
                      </td>
                    </tr>
                    {rows.map((player) => (
                      <tr
                        key={player.id}
                        className="border-b border-slate-800/40 hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="px-5 py-3 text-slate-500 font-bold text-xs tabular-nums">
                          {player.number ?? '—'}
                        </td>
                        <td className="px-3 py-3 font-bold text-slate-200">{player.name}</td>
                        <td className="px-3 py-3">
                          <DarkPositionBadge value={player.position} />
                        </td>
                        <td className="px-3 py-3 text-slate-500 text-xs hidden sm:table-cell">
                          {player.dob || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setModal(player)}
                              className="text-slate-600 hover:text-slate-300 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(player)}
                              className="text-slate-600 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <PlayerModal
          clubId={clubId}
          player={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </>
  )
}
