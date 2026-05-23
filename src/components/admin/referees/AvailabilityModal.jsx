import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../services/firebase'

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT  = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition-colors bg-white'

const REASONS = [
  'Dovolenka',
  'Zranenie / choroba',
  'Pracovná povinnosť',
  'Rodinné dôvody',
  'Iné',
]

export default function AvailabilityModal({ referees, onClose, onSaved }) {
  const activeRefs = referees.filter((r) => r.active !== false)
  const [form, setForm] = useState({
    refereeId: activeRefs[0]?.id ?? '',
    fromRound: '',
    toRound:   '',
    reason:    'Dovolenka',
    note:      '',
  })
  const [saving, setSaving] = useState(false)
  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    const from = Number(form.fromRound)
    const to   = Number(form.toRound)
    if (to < from) { toast.error('Kolo do musí byť ≥ kolo od'); return }
    setSaving(true)
    try {
      const ref = referees.find((r) => r.id === form.refereeId)
      await addDoc(collection(db, 'referee_availability'), {
        refereeId:   form.refereeId,
        refereeName: ref?.name ?? '',
        fromRound:   from,
        toRound:     to,
        reason:      form.reason,
        note:        form.note.trim(),
        createdAt:   serverTimestamp(),
      })
      toast.success('Nedostupnosť zaznamenaná')
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
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Nedostupnosť</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={LABEL}>Rozhodca</label>
            <select value={form.refereeId} onChange={(e) => set('refereeId', e.target.value)} className={INPUT}>
              {activeRefs.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Od kola</label>
              <input type="number" required min="1" max="46" value={form.fromRound} onChange={(e) => set('fromRound', e.target.value)} className={INPUT} placeholder="20" />
            </div>
            <div>
              <label className={LABEL}>Do kola</label>
              <input type="number" required min="1" max="46" value={form.toRound} onChange={(e) => set('toRound', e.target.value)} className={INPUT} placeholder="22" />
            </div>
          </div>

          <div>
            <label className={LABEL}>Dôvod</label>
            <select value={form.reason} onChange={(e) => set('reason', e.target.value)} className={INPUT}>
              {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className={LABEL}>Poznámka</label>
            <textarea value={form.note} onChange={(e) => set('note', e.target.value)} rows={2} className={INPUT} placeholder="Ďalší detail..." />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors">Zrušiť</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-yellow-400 text-slate-950 text-sm font-black rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors">
              {saving ? 'Ukladám...' : 'Uložiť'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
