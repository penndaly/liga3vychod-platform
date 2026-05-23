import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../services/firebase'
import { CLUBS } from '../../../data/placeholder'

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT  = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition-colors bg-white'

export default function DecisionModal({ season, entry, onClose, onSaved }) {
  const isEdit = Boolean(entry?.id)
  const [form, setForm] = useState({
    title:      entry?.title      ?? '',
    club:       entry?.club       ?? CLUBS[0].name,
    playerName: entry?.playerName ?? '',
    decision:   entry?.decision   ?? '',
    date:       entry?.date       ?? '',
    round:      entry?.round      != null ? String(entry.round) : '',
  })
  const [saving, setSaving] = useState(false)
  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const data = {
        title:      form.title.trim(),
        club:       form.club,
        playerName: form.playerName.trim(),
        decision:   form.decision.trim(),
        date:       form.date,
        round:      form.round !== '' ? Number(form.round) : null,
        season,
      }
      if (isEdit) {
        await updateDoc(doc(db, 'disciplinary_decisions', entry.id), { ...data, updatedAt: serverTimestamp() })
        toast.success('Rozhodnutie aktualizované')
      } else {
        await addDoc(collection(db, 'disciplinary_decisions'), { ...data, createdAt: serverTimestamp() })
        toast.success('Rozhodnutie pridané')
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
            {isEdit ? 'Upraviť rozhodnutie' : 'Nové rozhodnutie'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={LABEL}>Nadpis rozhodnutia</label>
            <input type="text" required value={form.title} onChange={(e) => set('title', e.target.value)} className={INPUT} placeholder="Disciplinárne konanie — FK Bardejov" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Klub</label>
              <select value={form.club} onChange={(e) => set('club', e.target.value)} className={INPUT}>
                {CLUBS.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Kolo</label>
              <input type="number" min="1" max="46" value={form.round} onChange={(e) => set('round', e.target.value)} className={INPUT} placeholder="22" />
            </div>
          </div>
          <div>
            <label className={LABEL}>Hráč (voliteľné)</label>
            <input type="text" value={form.playerName} onChange={(e) => set('playerName', e.target.value)} className={INPUT} placeholder="Ján Novák" />
          </div>
          <div>
            <label className={LABEL}>Dátum rozhodnutia</label>
            <input type="text" value={form.date} onChange={(e) => set('date', e.target.value)} className={INPUT} placeholder="20.5.2025" />
          </div>
          <div>
            <label className={LABEL}>Text rozhodnutia</label>
            <textarea
              required
              value={form.decision}
              onChange={(e) => set('decision', e.target.value)}
              rows={5}
              className={INPUT}
              placeholder="Disciplinárna komisia rozhodla..."
            />
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
