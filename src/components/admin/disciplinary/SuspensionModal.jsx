import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../services/firebase'
import { CLUBS } from '../../../data/placeholder'

export const SUSPENSION_REASONS = [
  { value: 'red_card',           label: 'Červená karta' },
  { value: 'cumulative_yellows', label: 'Kumulácia žltých kariet' },
  { value: 'violent_conduct',    label: 'Hrubé správanie' },
  { value: 'referee_assault',    label: 'Napadnutie rozhodcu' },
  { value: 'doping',             label: 'Dopingový nález' },
  { value: 'other',              label: 'Iné' },
]

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT  = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition-colors bg-white'

export default function SuspensionModal({ season, entry, onClose, onSaved }) {
  const isEdit = Boolean(entry?.id)
  const [form, setForm] = useState({
    playerName: entry?.playerName ?? '',
    club:       entry?.club       ?? CLUBS[0].name,
    reason:     entry?.reason     ?? 'red_card',
    fromRound:  entry?.fromRound  != null ? String(entry.fromRound) : '',
    toRound:    entry?.toRound    != null ? String(entry.toRound)   : '',
    status:     entry?.status     ?? 'active',
    notes:      entry?.notes      ?? '',
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
      const data = {
        playerName:    form.playerName.trim(),
        club:          form.club,
        reason:        form.reason,
        fromRound:     from,
        toRound:       to,
        matchesBanned: to - from + 1,
        status:        form.status,
        season,
        notes:         form.notes.trim(),
      }
      if (isEdit) {
        await updateDoc(doc(db, 'disciplinary_suspensions', entry.id), { ...data, updatedAt: serverTimestamp() })
        toast.success('Suspenzia aktualizovaná')
      } else {
        await addDoc(collection(db, 'disciplinary_suspensions'), { ...data, createdAt: serverTimestamp() })
        toast.success('Suspenzia pridaná')
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
            {isEdit ? 'Upraviť suspenziu' : 'Nová suspenzia'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={LABEL}>Meno hráča</label>
            <input type="text" required value={form.playerName} onChange={(e) => set('playerName', e.target.value)} className={INPUT} placeholder="Ján Novák" />
          </div>
          <div>
            <label className={LABEL}>Klub</label>
            <select value={form.club} onChange={(e) => set('club', e.target.value)} className={INPUT}>
              {CLUBS.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Dôvod</label>
            <select value={form.reason} onChange={(e) => set('reason', e.target.value)} className={INPUT}>
              {SUSPENSION_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Od kola</label>
              <input type="number" required min="1" max="46" value={form.fromRound} onChange={(e) => set('fromRound', e.target.value)} className={INPUT} placeholder="23" />
            </div>
            <div>
              <label className={LABEL}>Do kola</label>
              <input type="number" required min="1" max="46" value={form.toRound} onChange={(e) => set('toRound', e.target.value)} className={INPUT} placeholder="24" />
            </div>
          </div>
          <div>
            <label className={LABEL}>Stav</label>
            <div className="flex gap-2">
              {[{ value: 'active', label: 'Aktívna' }, { value: 'served', label: 'Odsedená' }].map((s) => (
                <label key={s.value} className={`flex-1 flex items-center gap-2 border rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${form.status === s.value ? 'border-yellow-400 bg-yellow-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name="status" value={s.value} checked={form.status === s.value} onChange={() => set('status', s.value)} className="accent-yellow-400" />
                  <span className="text-sm font-bold text-slate-900">{s.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className={LABEL}>Poznámka</label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className={INPUT} placeholder="Ďalšie detaily..." />
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
