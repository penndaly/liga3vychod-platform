import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../services/firebase'
import { CLUBS } from '../../../data/placeholder'

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT  = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition-colors bg-white'

const NUM = (v, set) => (
  <input
    type="number"
    min="0"
    max="999"
    value={v}
    onChange={(e) => set(e.target.value === '' ? '' : Number(e.target.value))}
    className={INPUT}
  />
)

export default function PlayerStatModal({ season, entry, onClose, onSaved }) {
  const isEdit = Boolean(entry?.id)
  const [form, setForm] = useState({
    name:        entry?.name        ?? '',
    club:        entry?.club        ?? CLUBS[0].name,
    goals:       entry?.goals       ?? 0,
    assists:     entry?.assists     ?? 0,
    yellowCards: entry?.yellowCards ?? 0,
    redCards:    entry?.redCards    ?? 0,
  })
  const [saving, setSaving] = useState(false)

  const set = (f, v) => setForm((prev) => ({ ...prev, [f]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Zadajte meno'); return }
    setSaving(true)
    try {
      const data = {
        name:        form.name.trim(),
        club:        form.club,
        season,
        goals:       Number(form.goals)       || 0,
        assists:     Number(form.assists)      || 0,
        yellowCards: Number(form.yellowCards)  || 0,
        redCards:    Number(form.redCards)     || 0,
      }
      if (isEdit) {
        await updateDoc(doc(db, 'player_stats', entry.id), { ...data, updatedAt: serverTimestamp() })
        toast.success('Záznam aktualizovaný')
      } else {
        await addDoc(collection(db, 'player_stats'), { ...data, createdAt: serverTimestamp() })
        toast.success('Hráč pridaný')
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
            {isEdit ? 'Upraviť hráča' : 'Pridať hráča'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={LABEL}>Meno a priezvisko</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Góly</label>
              {NUM(form.goals, (v) => set('goals', v))}
            </div>
            <div>
              <label className={LABEL}>Asistencie</label>
              {NUM(form.assists, (v) => set('assists', v))}
            </div>
            <div>
              <label className={LABEL}>ŽK</label>
              {NUM(form.yellowCards, (v) => set('yellowCards', v))}
            </div>
            <div>
              <label className={LABEL}>ČK</label>
              {NUM(form.redCards, (v) => set('redCards', v))}
            </div>
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
