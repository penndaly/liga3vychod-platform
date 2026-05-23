import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../services/firebase'
import { CLUBS } from '../../../data/placeholder'

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT  = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition-colors bg-white'

export default function FineModal({ season, entry, onClose, onSaved }) {
  const isEdit = Boolean(entry?.id)
  const [form, setForm] = useState({
    club:       entry?.club       ?? CLUBS[0].name,
    playerName: entry?.playerName ?? '',
    reason:     entry?.reason     ?? '',
    amount:     entry?.amount     != null ? String(entry.amount) : '',
    status:     entry?.status     ?? 'unpaid',
    dueDate:    entry?.dueDate    ?? '',
    round:      entry?.round      != null ? String(entry.round) : '',
    notes:      entry?.notes      ?? '',
  })
  const [saving, setSaving] = useState(false)
  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Zadajte sumu'); return }
    setSaving(true)
    try {
      const data = {
        club:       form.club,
        playerName: form.playerName.trim(),
        reason:     form.reason.trim(),
        amount:     Number(form.amount),
        status:     form.status,
        dueDate:    form.dueDate,
        round:      form.round !== '' ? Number(form.round) : null,
        season,
        notes:      form.notes.trim(),
      }
      if (isEdit) {
        await updateDoc(doc(db, 'disciplinary_fines', entry.id), { ...data, updatedAt: serverTimestamp() })
        toast.success('Pokuta aktualizovaná')
      } else {
        await addDoc(collection(db, 'disciplinary_fines'), { ...data, createdAt: serverTimestamp() })
        toast.success('Pokuta pridaná')
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
            {isEdit ? 'Upraviť pokutu' : 'Nová pokuta'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={LABEL}>Klub</label>
            <select value={form.club} onChange={(e) => set('club', e.target.value)} className={INPUT}>
              {CLUBS.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Hráč (voliteľné)</label>
            <input type="text" value={form.playerName} onChange={(e) => set('playerName', e.target.value)} className={INPUT} placeholder="Ponechajte prázdne pre poklebu klubu" />
          </div>
          <div>
            <label className={LABEL}>Dôvod</label>
            <input type="text" required value={form.reason} onChange={(e) => set('reason', e.target.value)} className={INPUT} placeholder="Oneskorený nástup na zápas" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Suma (€)</label>
              <input type="number" required min="1" value={form.amount} onChange={(e) => set('amount', e.target.value)} className={INPUT} placeholder="50" />
            </div>
            <div>
              <label className={LABEL}>Kolo</label>
              <input type="number" min="1" max="46" value={form.round} onChange={(e) => set('round', e.target.value)} className={INPUT} placeholder="23" />
            </div>
          </div>
          <div>
            <label className={LABEL}>Termín úhrady</label>
            <input type="text" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} className={INPUT} placeholder="30.6.2025" />
          </div>
          <div>
            <label className={LABEL}>Stav</label>
            <div className="flex gap-2">
              {[{ value: 'unpaid', label: 'Nezaplatená' }, { value: 'paid', label: 'Zaplatená' }].map((s) => (
                <label key={s.value} className={`flex-1 flex items-center gap-2 border rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${form.status === s.value ? 'border-yellow-400 bg-yellow-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name="fstatus" value={s.value} checked={form.status === s.value} onChange={() => set('status', s.value)} className="accent-yellow-400" />
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
