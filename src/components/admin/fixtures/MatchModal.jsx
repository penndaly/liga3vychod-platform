import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { CLUBS } from '../../../data/placeholder'
import { createDocument, updateDocument } from '../../../services/api'

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT  = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition-colors bg-white'

const STATUSES = [
  { value: 'scheduled', label: 'Plánovaný' },
  { value: 'live',      label: 'Live' },
  { value: 'completed', label: 'Odohraný' },
  { value: 'postponed', label: 'Odložený' },
]

export default function MatchModal({ match, onClose, onSaved }) {
  const isEdit = Boolean(match?.id)

  const [form, setForm] = useState({
    round:      match?.round     ?? '',
    home:       match?.home      ?? '',
    away:       match?.away      ?? '',
    date:       match?.date      ?? '',
    time:       match?.time      ?? '16:30',
    status:     match?.status    ?? 'scheduled',
    homeGoals:  match?.homeGoals != null ? String(match.homeGoals) : '',
    awayGoals:  match?.awayGoals != null ? String(match.awayGoals) : '',
  })
  const [saving, setSaving] = useState(false)

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))
  const showScore = form.status === 'completed' || form.status === 'live'

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.home === form.away) {
      toast.error('Domáci a hostia nemôžu byť rovnaký tím')
      return
    }
    setSaving(true)
    try {
      const data = {
        round:      Number(form.round),
        home:       form.home,
        away:       form.away,
        date:       form.date,
        time:       form.time,
        status:     form.status,
        homeGoals:  form.homeGoals !== '' ? Number(form.homeGoals) : null,
        awayGoals:  form.awayGoals !== '' ? Number(form.awayGoals) : null,
      }
      if (isEdit) {
        await updateDocument('fixtures', match.id, data)
        toast.success('Zápas aktualizovaný')
      } else {
        await createDocument('fixtures', data)
        toast.success('Zápas pridaný')
      }
      onSaved()
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
            {isEdit ? 'Upraviť zápas' : 'Pridať zápas'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={LABEL}>Kolo</label>
            <input
              type="number" min="1" max="46" required
              value={form.round}
              onChange={(e) => set('round', e.target.value)}
              className={INPUT}
              placeholder="1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Domáci</label>
              <select required value={form.home} onChange={(e) => set('home', e.target.value)} className={INPUT}>
                <option value="">Vybrať tím</option>
                {CLUBS.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Hostia</label>
              <select required value={form.away} onChange={(e) => set('away', e.target.value)} className={INPUT}>
                <option value="">Vybrať tím</option>
                {CLUBS.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Dátum</label>
              <input
                type="text" required
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                className={INPUT}
                placeholder="25.5.2025"
              />
            </div>
            <div>
              <label className={LABEL}>Čas</label>
              <input
                type="text" required
                value={form.time}
                onChange={(e) => set('time', e.target.value)}
                className={INPUT}
                placeholder="16:30"
              />
            </div>
          </div>

          <div>
            <label className={LABEL}>Stav</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className={INPUT}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {showScore && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Góly domáci</label>
                <input
                  type="number" min="0"
                  value={form.homeGoals}
                  onChange={(e) => set('homeGoals', e.target.value)}
                  className={INPUT}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={LABEL}>Góly hostia</label>
                <input
                  type="number" min="0"
                  value={form.awayGoals}
                  onChange={(e) => set('awayGoals', e.target.value)}
                  className={INPUT}
                  placeholder="0"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Zrušiť
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-yellow-400 text-slate-950 text-sm font-black rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Ukladám...' : 'Uložiť'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
