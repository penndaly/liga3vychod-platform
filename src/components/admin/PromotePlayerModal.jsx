import { useState } from 'react'
import { X, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { getClubBySlug } from '../../config/clubs-config'
import { TEAM_DEFS } from '../../hooks/useAcademyTeams'

const TEAM_OPTIONS = [
  ...TEAM_DEFS.map((t) => ({ id: t.id, label: `${t.id} — ${t.sublabel}` })),
  { id: 'FIRST_TEAM', label: 'Prvý tím' },
]

export default function PromotePlayerModal({ clubSlug, fromTeam, player, onClose, onDone }) {
  const staticClub = getClubBySlug(clubSlug)
  const clubId = staticClub ? String(staticClub.id) : null

  const currentIdx  = TEAM_DEFS.findIndex((t) => t.id === fromTeam)
  const defaultTarget = currentIdx > 0 ? TEAM_DEFS[currentIdx - 1].id : 'FIRST_TEAM'

  const [toTeam,  setToTeam]  = useState(defaultTarget)
  const [moving,  setMoving]  = useState(false)

  const toLabel = TEAM_OPTIONS.find((t) => t.id === toTeam)?.label ?? toTeam
  const isUp    = TEAM_OPTIONS.findIndex((t) => t.id === toTeam) < TEAM_OPTIONS.findIndex((t) => t.id === fromTeam)

  async function handle() {
    if (!clubId || toTeam === fromTeam) return
    setMoving(true)
    try {
      const fromRef = doc(db, 'clubs', clubId, 'academy', fromTeam, 'players', player.id)
      const snap    = await getDoc(fromRef)
      if (!snap.exists()) throw new Error('Hráč neexistuje')

      const data = snap.data()

      if (toTeam === 'FIRST_TEAM') {
        // Write to clubs/{clubId}/players
        await setDoc(doc(db, 'clubs', clubId, 'players', player.id), {
          name:     data.name,
          position: data.position,
          number:   data.jerseyNumber ?? null,
          dob:      data.dateOfBirth  ?? null,
          promotedFrom: fromTeam,
          promotedAt:   serverTimestamp(),
        })
      } else {
        await setDoc(
          doc(db, 'clubs', clubId, 'academy', toTeam, 'players', player.id),
          { ...data, promotedFrom: fromTeam, promotedDate: serverTimestamp() }
        )
      }
      await deleteDoc(fromRef)
      toast.success(`Hráč presunutý z ${fromTeam} do ${toLabel.split(' —')[0]}`)
      onDone()
    } catch (err) {
      toast.error(err.message ?? 'Chyba pri presune')
    } finally {
      setMoving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-100">Presun hráča</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Player summary */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3">
            <p className="text-sm font-black text-slate-100">{player.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">Súčasný tím: <span className="text-yellow-400 font-bold">{fromTeam}</span></p>
          </div>

          {/* Direction icon */}
          <div className="flex items-center justify-center">
            {isUp ? (
              <ArrowUpCircle size={28} className="text-green-400" />
            ) : (
              <ArrowDownCircle size={28} className="text-amber-400" />
            )}
          </div>

          {/* Target team */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
              Cieľový tím
            </label>
            <select
              value={toTeam}
              onChange={(e) => setToTeam(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-yellow-400 transition-colors"
            >
              {TEAM_OPTIONS.filter((t) => t.id !== fromTeam).map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Hráč bude presunutý z <span className="text-slate-300 font-bold">{fromTeam}</span> do{' '}
            <span className="text-slate-300 font-bold">{toLabel.split(' —')[0]}</span>.
            Dáta hráča sa zachovajú.
          </p>

          <div className="flex gap-3">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-700 text-slate-400 text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Zrušiť
            </button>
            <button
              onClick={handle} disabled={moving}
              className="flex-1 py-2.5 bg-green-600 text-white text-sm font-black rounded-xl hover:bg-green-500 disabled:opacity-50 transition-colors"
            >
              {moving ? 'Presúvam...' : 'Presunúť'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
