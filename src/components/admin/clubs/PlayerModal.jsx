import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../services/firebase'

export const POSITIONS = [
  { value: 'GK',  label: 'Brankár',  cls: 'bg-yellow-100 text-yellow-800' },
  { value: 'DEF', label: 'Obranca',  cls: 'bg-blue-100 text-blue-800' },
  { value: 'MID', label: 'Záložník', cls: 'bg-green-100 text-green-800' },
  { value: 'FWD', label: 'Útočník',  cls: 'bg-red-100 text-red-800' },
]

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT  = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition-colors bg-white'

export default function PlayerModal({ clubId, player, onClose, onSaved, subcollection = 'players' }) {
  const isEdit = Boolean(player?.id)
  const [form, setForm] = useState({
    name:     player?.name     ?? '',
    position: player?.position ?? 'MID',
    number:   player?.number != null ? String(player.number) : '',
    dob:      player?.dob      ?? '',
  })
  const [saving, setSaving] = useState(false)

  const set = (f, v) => setForm((prev) => ({ ...prev, [f]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const data = {
        name:     form.name,
        position: form.position,
        number:   form.number !== '' ? Number(form.number) : null,
        dob:      form.dob,
      }
      if (isEdit) {
        await updateDoc(doc(db, 'clubs', String(clubId), subcollection, player.id), {
          ...data, updatedAt: serverTimestamp(),
        })
        toast.success('Hráč aktualizovaný')
      } else {
        await addDoc(collection(db, 'clubs', String(clubId), subcollection), {
          ...data, createdAt: serverTimestamp(),
        })
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
            <input type="text" required value={form.name} onChange={(e) => set('name', e.target.value)} className={INPUT} placeholder="Ján Novák" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Pozícia</label>
              <select value={form.position} onChange={(e) => set('position', e.target.value)} className={INPUT}>
                {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Číslo dresu</label>
              <input type="number" min="1" max="99" value={form.number} onChange={(e) => set('number', e.target.value)} className={INPUT} placeholder="10" />
            </div>
          </div>
          <div>
            <label className={LABEL}>Dátum narodenia</label>
            <input type="text" value={form.dob} onChange={(e) => set('dob', e.target.value)} className={INPUT} placeholder="15.3.1995" />
          </div>
          <div className="flex gap-3 pt-2">
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
