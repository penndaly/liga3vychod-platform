import { useState } from 'react'
import { Trophy, X, Pencil } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../services/firebase'
import { CLUBS } from '../../../data/placeholder'

const SEASON_MONTHS = {
  '2025/26': [
    { key: '2025-08', label: 'August',    year: 2025 },
    { key: '2025-09', label: 'September', year: 2025 },
    { key: '2025-10', label: 'Október',   year: 2025 },
    { key: '2025-11', label: 'November',  year: 2025 },
    { key: '2026-03', label: 'Marec',     year: 2026 },
    { key: '2026-04', label: 'Apríl',     year: 2026 },
    { key: '2026-05', label: 'Máj',       year: 2026 },
    { key: '2026-06', label: 'Jún',       year: 2026 },
  ],
  '2024/25': [
    { key: '2024-08', label: 'August',    year: 2024 },
    { key: '2024-09', label: 'September', year: 2024 },
    { key: '2024-10', label: 'Október',   year: 2024 },
    { key: '2024-11', label: 'November',  year: 2024 },
    { key: '2025-03', label: 'Marec',     year: 2025 },
    { key: '2025-04', label: 'Apríl',     year: 2025 },
    { key: '2025-05', label: 'Máj',       year: 2025 },
    { key: '2025-06', label: 'Jún',       year: 2025 },
  ],
  '2023/24': [
    { key: '2023-08', label: 'August',    year: 2023 },
    { key: '2023-09', label: 'September', year: 2023 },
    { key: '2023-10', label: 'Október',   year: 2023 },
    { key: '2023-11', label: 'November',  year: 2023 },
    { key: '2024-03', label: 'Marec',     year: 2024 },
    { key: '2024-04', label: 'Apríl',     year: 2024 },
    { key: '2024-05', label: 'Máj',       year: 2024 },
    { key: '2024-06', label: 'Jún',       year: 2024 },
  ],
}

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT  = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition-colors bg-white'

function PotmModal({ season, month, existing, onClose, onSaved }) {
  const [form, setForm] = useState({
    playerName: existing?.playerName ?? '',
    club:       existing?.club       ?? CLUBS[0].name,
    note:       existing?.note       ?? '',
  })
  const [saving, setSaving] = useState(false)
  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const docId = `${season.replace('/', '-')}_${month.key}`
      await setDoc(
        doc(db, 'awards_potm', docId),
        {
          playerName: form.playerName.trim(),
          club:       form.club,
          note:       form.note.trim(),
          monthKey:   month.key,
          monthLabel: month.label,
          year:       month.year,
          season,
          updatedAt:  serverTimestamp(),
        },
        { merge: true }
      )
      toast.success('Hráč mesiaca uložený')
      onSaved()
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Hráč mesiaca</h2>
            <p className="text-xs text-slate-400 mt-0.5">{month.label} {month.year}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={LABEL}>Meno hráča</label>
            <input
              type="text"
              required
              value={form.playerName}
              onChange={(e) => set('playerName', e.target.value)}
              className={INPUT}
              placeholder="Ján Novák"
            />
          </div>
          <div>
            <label className={LABEL}>Klub</label>
            <select value={form.club} onChange={(e) => set('club', e.target.value)} className={INPUT}>
              {CLUBS.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Poznámka</label>
            <textarea
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
              rows={2}
              className={INPUT}
              placeholder="Skvelý výkon v 3 zápasoch, 5 gólov..."
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors">
              Zrušiť
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-yellow-400 text-slate-950 text-sm font-black rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors">
              {saving ? 'Ukladám...' : 'Uložiť'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PotmSection({ season, awards, onRefresh }) {
  const [selected, setSelected] = useState(null) // month object
  const months = SEASON_MONTHS[season] ?? []

  const awardMap = Object.fromEntries(awards.map((a) => [a.monthKey, a]))

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Hráč mesiaca</p>
          <p className="text-xs text-slate-400 mt-0.5">Sezóna {season}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100">
          {months.map((month) => {
            const winner = awardMap[month.key]
            return (
              <button
                key={month.key}
                onClick={() => setSelected(month)}
                className="bg-white p-4 text-left hover:bg-yellow-50 transition-colors group relative"
              >
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {month.label}
                  <span className="text-slate-300 ml-1">{month.year}</span>
                </p>

                {winner ? (
                  <div className="mt-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Trophy size={11} className="text-yellow-500 shrink-0" />
                      <p className="text-sm font-black text-slate-900 truncate">{winner.playerName}</p>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{winner.club}</p>
                    {winner.note && (
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">{winner.note}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 mt-2 font-bold">Nevybratý</p>
                )}

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Pencil size={11} className="text-slate-400" />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {selected && (
        <PotmModal
          season={season}
          month={selected}
          existing={awardMap[selected.key]}
          onClose={() => setSelected(null)}
          onSaved={() => { setSelected(null); onRefresh() }}
        />
      )}
    </>
  )
}
