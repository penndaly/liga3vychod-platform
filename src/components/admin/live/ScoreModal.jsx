import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { updateDocument } from '../../../services/api'
import { getClubByName } from '../../../config/clubs-config'

const STATUSES = [
  { value: 'scheduled', label: 'Plánovaný' },
  { value: 'live',      label: 'Live'       },
  { value: 'completed', label: 'Odohraný'  },
  { value: 'postponed', label: 'Odložený'  },
]

export default function ScoreModal({ fixture, onClose, onSaved }) {
  const homeClub = getClubByName(fixture.home)
  const awayClub = getClubByName(fixture.away)

  const [form, setForm] = useState({
    status:    fixture.status    ?? 'live',
    homeGoals: fixture.homeGoals != null ? String(fixture.homeGoals) : '',
    awayGoals: fixture.awayGoals != null ? String(fixture.awayGoals) : '',
  })
  const [saving, setSaving] = useState(false)
  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }))
  const showScore = form.status === 'live' || form.status === 'completed'

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateDocument('fixtures', fixture.id, {
        status:    form.status,
        homeGoals: showScore && form.homeGoals !== '' ? Number(form.homeGoals) : null,
        awayGoals: showScore && form.awayGoals !== '' ? Number(form.awayGoals) : null,
      })
      toast.success('Zápas aktualizovaný')
      onSaved()
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm">

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-300">
            Aktualizovať zápas
          </h2>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">

          {/* Teams */}
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full shrink-0" style={{ background: homeClub?.color ?? '#475569' }} />
              <span className="text-sm font-bold text-slate-200 truncate">{fixture.home}</span>
            </div>
            <span className="text-slate-700 text-xs font-black shrink-0">vs</span>
            <div className="flex-1 flex items-center justify-end gap-2">
              <span className="text-sm font-bold text-slate-200 truncate text-right">{fixture.away}</span>
              <span className="w-4 h-4 rounded-full shrink-0" style={{ background: awayClub?.color ?? '#475569' }} />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Stav</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => set('status', s.value)}
                  className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                    form.status === s.value
                      ? s.value === 'live'
                        ? 'bg-red-500 text-white'
                        : 'bg-yellow-400 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Score */}
          {showScore && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 truncate">
                  {homeClub?.short ?? fixture.home}
                </label>
                <input
                  type="number" min="0"
                  value={form.homeGoals}
                  onChange={(e) => set('homeGoals', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 text-center text-2xl font-black text-white focus:outline-none focus:border-yellow-400 transition-colors tabular-nums"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 truncate">
                  {awayClub?.short ?? fixture.away}
                </label>
                <input
                  type="number" min="0"
                  value={form.awayGoals}
                  onChange={(e) => set('awayGoals', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 text-center text-2xl font-black text-white focus:outline-none focus:border-yellow-400 transition-colors tabular-nums"
                  placeholder="0"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-700 text-slate-400 text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors">
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
