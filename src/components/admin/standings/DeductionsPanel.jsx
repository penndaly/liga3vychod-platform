import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { CLUBS } from '../../../data/placeholder'
import { createDocument, deleteDocument } from '../../../services/api'

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT  = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition-colors bg-white'

const CLUB_NAMES = CLUBS.map((c) => c.name)

export default function DeductionsPanel({ deductions, season, onSaved }) {
  const [form, setForm] = useState({ club: '', points: '', reason: '', date: '' })
  const [saving, setSaving] = useState(false)

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  async function handleAdd(e) {
    e.preventDefault()
    const pts = Number(form.points)
    if (!pts || pts === 0) { toast.error('Zadajte nenulový počet bodov'); return }
    setSaving(true)
    try {
      await createDocument('deductions', {
        club:    form.club,
        points:  pts,
        reason:  form.reason,
        date:    form.date,
        season,
      })
      toast.success('Odpočet pridaný')
      setForm({ club: '', points: '', reason: '', date: '' })
      onSaved()
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, club) {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Odstrániť odpočet pre ${club}?`)) return
    try {
      await deleteDocument('deductions', id)
      toast.success('Odpočet odstránený')
      onSaved()
    } catch {
      toast.error('Chyba pri odstraňovaní')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <AlertTriangle size={13} className="text-amber-500" />
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
          Odpočty bodov
        </h2>
      </div>

      {/* Existing deductions */}
      <div className="divide-y divide-slate-50">
        {deductions.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            Žiadne odpočty v sezóne {season}
          </p>
        ) : (
          deductions.map((d) => (
            <div key={d.id} className="flex items-start gap-3 px-5 py-3 group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-500">
                    -{d.points} {d.points === 1 ? 'bod' : d.points < 5 ? 'body' : 'bodov'}
                  </span>
                  <span className="text-xs font-medium text-slate-700 truncate">{d.club}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">{d.reason}</p>
                {d.date && <p className="text-xs text-slate-300 mt-0.5">{d.date}</p>}
              </div>
              <button
                onClick={() => handleDelete(d.id, d.club)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-400 transition-all shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="border-t border-slate-100 p-5 space-y-3">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
          Pridať odpočet
        </p>

        <div>
          <label className={LABEL}>Klub</label>
          <select required value={form.club} onChange={(e) => set('club', e.target.value)} className={INPUT}>
            <option value="">Vybrať klub</option>
            {CLUB_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={LABEL}>Body (±)</label>
            <input
              type="number"
              required
              value={form.points}
              onChange={(e) => set('points', e.target.value)}
              className={INPUT}
              placeholder="-3"
            />
          </div>
          <div>
            <label className={LABEL}>Dátum</label>
            <input
              type="text"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className={INPUT}
              placeholder="18.5.2025"
            />
          </div>
        </div>

        <div>
          <label className={LABEL}>Dôvod</label>
          <input
            type="text"
            required
            value={form.reason}
            onChange={(e) => set('reason', e.target.value)}
            className={INPUT}
            placeholder="napr. neoprávnený hráč"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-yellow-400 text-slate-950 text-xs font-black uppercase tracking-widest rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Ukladám...' : 'Pridať odpočet'}
        </button>
      </form>
    </div>
  )
}
