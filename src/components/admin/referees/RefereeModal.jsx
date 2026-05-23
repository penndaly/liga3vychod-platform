import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../services/firebase'

export const GRADES = [
  { value: 'fifa',       label: 'FIFA',        cls: 'bg-blue-600 text-white' },
  { value: 'national',   label: 'Národná',     cls: 'bg-purple-100 text-purple-700' },
  { value: 'regional',   label: 'Regionálna',  cls: 'bg-slate-100 text-slate-600' },
  { value: 'district',   label: 'Oblastná',    cls: 'bg-slate-50 text-slate-400 border border-slate-200' },
]

const REGIONS = [
  'Prešovský kraj',
  'Košický kraj',
  'Iný kraj',
]

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT  = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition-colors bg-white'

export default function RefereeModal({ entry, onClose, onSaved }) {
  const isEdit = Boolean(entry?.id)
  const [form, setForm] = useState({
    name:   entry?.name   ?? '',
    grade:  entry?.grade  ?? 'regional',
    region: entry?.region ?? 'Prešovský kraj',
    phone:  entry?.phone  ?? '',
    email:  entry?.email  ?? '',
    active: entry?.active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const data = {
        name:   form.name.trim(),
        grade:  form.grade,
        region: form.region,
        phone:  form.phone.trim(),
        email:  form.email.trim(),
        active: form.active,
      }
      if (isEdit) {
        await updateDoc(doc(db, 'referees', entry.id), { ...data, updatedAt: serverTimestamp() })
        toast.success('Rozhodca aktualizovaný')
      } else {
        await addDoc(collection(db, 'referees'), { ...data, createdAt: serverTimestamp() })
        toast.success('Rozhodca pridaný')
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
            {isEdit ? 'Upraviť rozhodcu' : 'Nový rozhodca'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={LABEL}>Meno a priezvisko</label>
            <input type="text" required value={form.name} onChange={(e) => set('name', e.target.value)} className={INPUT} placeholder="Ján Kováč" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Licencia</label>
              <select value={form.grade} onChange={(e) => set('grade', e.target.value)} className={INPUT}>
                {GRADES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Kraj</label>
              <select value={form.region} onChange={(e) => set('region', e.target.value)} className={INPUT}>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL}>Telefón</label>
            <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={INPUT} placeholder="+421 900 000 000" />
          </div>
          <div>
            <label className={LABEL}>Email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={INPUT} placeholder="jan.kovac@szfz.sk" />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="w-4 h-4 accent-yellow-400" />
            <span className="text-sm font-bold text-slate-700">Aktívny rozhodca</span>
          </label>

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
