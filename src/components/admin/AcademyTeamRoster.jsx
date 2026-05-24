import { doc, deleteDoc } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { Pencil, Trash2, ArrowUpCircle, Phone, Mail, GraduationCap, Loader } from 'lucide-react'
import { db } from '../../services/firebase'
import { getClubBySlug } from '../../config/clubs-config'
import { calcAge } from '../../hooks/useAcademyTeams'

const POSITION_ORDER = { GK: 1, DEF: 2, MID: 3, FWD: 4 }
const POS_BADGE = {
  GK:  'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25',
  DEF: 'bg-blue-500/15   text-blue-400   border border-blue-500/25',
  MID: 'bg-green-500/15  text-green-400  border border-green-500/25',
  FWD: 'bg-red-500/15    text-red-400    border border-red-500/25',
}
const POS_LABEL = { GK: 'BR', DEF: 'OB', MID: 'ZÁ', FWD: 'ÚT' }

function AgeBadge({ dob }) {
  const age = calcAge(dob)
  if (age === null) return <span className="text-slate-600 text-xs">—</span>
  return (
    <span className="bg-slate-800 text-slate-400 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
      {age} r.
    </span>
  )
}

function Avatar({ player, size = 32 }) {
  const initials = player.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  if (player.photo) {
    return (
      <img
        src={player.photo}
        alt={player.name}
        className="rounded-full object-cover shrink-0 border border-slate-700"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="text-[10px] font-black text-slate-400">{initials || '?'}</span>
    </div>
  )
}

export default function AcademyTeamRoster({
  clubSlug, teamId, players, loading, clubColor,
  onEdit, onPromote,
}) {
  const staticClub = getClubBySlug(clubSlug)
  const clubId = staticClub ? String(staticClub.id) : null

  async function handleDelete(player) {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Odstrániť hráča ${player.name}?`)) return
    try {
      await deleteDoc(doc(db, 'clubs', clubId, 'academy', teamId, 'players', player.id))
      toast.success('Hráč odstránený')
    } catch {
      toast.error('Chyba pri odstraňovaní')
    }
  }

  const sorted = [...players].sort((a, b) => {
    const pd = (POSITION_ORDER[a.position] ?? 9) - (POSITION_ORDER[b.position] ?? 9)
    return pd !== 0 ? pd : (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999)
  })

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center py-20">
        <Loader size={20} className="animate-spin text-slate-600" />
      </div>
    )
  }

  if (players.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center py-20 text-slate-700">
        <GraduationCap size={32} className="mb-3" />
        <p className="text-sm font-black uppercase tracking-widest mb-1">Žiadni hráči v {teamId}</p>
        <p className="text-xs">Pridajte hráča pomocou tlačidla vyššie</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-600 font-bold uppercase tracking-widest">
              <th className="text-left px-4 py-3 w-10" />
              <th className="text-left px-2 py-3 w-8">#</th>
              <th className="text-left px-2 py-3">Meno</th>
              <th className="text-left px-2 py-3 w-16">Pos.</th>
              <th className="text-left px-2 py-3 w-20">Vek</th>
              <th className="text-left px-3 py-3">Rodič / kontakt</th>
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((player) => (
              <tr
                key={player.id}
                className="border-b border-slate-800/40 hover:bg-slate-800/40 transition-colors group"
              >
                {/* Avatar */}
                <td className="px-4 py-3">
                  <Avatar player={player} size={32} />
                </td>

                {/* Jersey */}
                <td className="px-2 py-3 text-slate-500 font-bold text-xs tabular-nums">
                  {player.jerseyNumber ?? '—'}
                </td>

                {/* Name + previous club */}
                <td className="px-2 py-3">
                  <p className="font-bold text-slate-200 truncate max-w-[160px]">{player.name}</p>
                  {player.previousClub && (
                    <p className="text-[10px] text-slate-600 truncate max-w-[160px]">z {player.previousClub}</p>
                  )}
                </td>

                {/* Position badge */}
                <td className="px-2 py-3">
                  <span className={`text-xs font-black px-2 py-0.5 rounded ${POS_BADGE[player.position] ?? 'bg-slate-700 text-slate-400'}`}>
                    {POS_LABEL[player.position] ?? player.position}
                  </span>
                </td>

                {/* Age */}
                <td className="px-2 py-3">
                  <AgeBadge dob={player.dateOfBirth} />
                </td>

                {/* Parent contact */}
                <td className="px-3 py-3">
                  {player.parentName ? (
                    <div className="space-y-0.5">
                      <p className="text-xs text-slate-400 font-medium truncate max-w-[180px]">
                        {player.parentName}
                      </p>
                      <div className="flex items-center gap-3">
                        {player.parentPhone && (
                          <a
                            href={`tel:${player.parentPhone}`}
                            className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
                          >
                            <Phone size={9} /> {player.parentPhone}
                          </a>
                        )}
                        {player.parentEmail && (
                          <a
                            href={`mailto:${player.parentEmail}`}
                            className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
                          >
                            <Mail size={9} /> {player.parentEmail}
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-700">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onPromote(player)}
                      className="text-slate-600 hover:text-green-400 transition-colors"
                      title="Presunúť hráča"
                    >
                      <ArrowUpCircle size={15} />
                    </button>
                    <button
                      onClick={() => onEdit(player)}
                      className="text-slate-600 hover:text-slate-300 transition-colors"
                      title="Upraviť"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(player)}
                      className="text-slate-600 hover:text-red-400 transition-colors"
                      title="Odstrániť"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer summary */}
      <div className="px-5 py-3 border-t border-slate-800 flex items-center gap-4 flex-wrap">
        {['GK', 'DEF', 'MID', 'FWD'].map((pos) => {
          const count = players.filter((p) => p.position === pos).length
          if (!count) return null
          return (
            <span key={pos} className="flex items-center gap-1.5">
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${POS_BADGE[pos]}`}>
                {POS_LABEL[pos]}
              </span>
              <span className="text-xs text-slate-600 font-bold">{count}</span>
            </span>
          )
        })}
        <span className="ml-auto text-xs text-slate-600 font-bold">{players.length} hráčov</span>
      </div>
    </div>
  )
}
