import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../services/firebase'
import { CLUBS } from '../../../data/placeholder'

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT  = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition-colors bg-white'

function RefereeSelect({ label, value, onChange, referees, optional }) {
  return (
    <div>
      <label className={LABEL}>{label}{optional && <span className="text-slate-300 ml-1 normal-case font-normal">(voliteľné)</span>}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={INPUT}>
        {optional && <option value="">— Nevybrané —</option>}
        {referees.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>
    </div>
  )
}

export default function AssignmentModal({ season, entry, referees, onClose, onSaved }) {
  const isEdit = Boolean(entry?.id)
  const activeRefs = referees.filter((r) => r.active !== false)

  const [form, setForm] = useState({
    round:      entry?.round      != null ? String(entry.round) : '',
    home:       entry?.home       ?? (CLUBS[0]?.name ?? ''),
    away:       entry?.away       ?? (CLUBS[1]?.name ?? ''),
    date:       entry?.date       ?? '',
    mainRef:    entry?.mainRef    ?? (activeRefs[0]?.id ?? ''),
    linesman1:  entry?.linesman1  ?? '',
    linesman2:  entry?.linesman2  ?? '',
  })
  const [saving, setSaving] = useState(false)
  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }))

  function refName(id) {
    return referees.find((r) => r.id === id)?.name ?? ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.home === form.away) { toast.error('Domáci a hostia musia byť rôzne'); return }
    if (!form.mainRef) { toast.error('Vyberte hlavného rozhodcu'); return }
    setSaving(true)
    try {
      const data = {
        round:     Number(form.round),
        home:      form.home,
        away:      form.away,
        date:      form.date,
        mainRef:   form.mainRef,
        mainRefName: refName(form.mainRef),
        linesman1: form.linesman1 || null,
        linesman1Name: form.linesman1 ? refName(form.linesman1) : null,
        linesman2: form.linesman2 || null,
        linesman2Name: form.linesman2 ? refName(form.linesman2) : null,
        season,
      }
      if (isEdit) {
        await updateDoc(doc(db, 'referee_assignments', entry.id), { ...data, updatedAt: serverTimestamp() })
        toast.success('Delegovanie aktualizované')
      } else {
        await addDoc(collection(db, 'referee_assignments'), { ...data, createdAt: serverTimestamp() })
        toast.success('Delegovanie pridané')
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
            {isEdit ? 'Upraviť delegovanie' : 'Nové delegovanie'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Kolo</label>
              <input type="number" required min="1" max="46" value={form.round} onChange={(e) => set('round', e.target.value)} className={INPUT} placeholder="23" />
            </div>
            <div>
              <label className={LABEL}>Dátum</label>
              <input type="text" value={form.date} onChange={(e) => set('date', e.target.value)} className={INPUT} placeholder="25.5.2025" />
            </div>
          </div>

          <div>
            <label className={LABEL}>Domáci</label>
            <select value={form.home} onChange={(e) => set('home', e.target.value)} className={INPUT}>
              {CLUBS.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Hostia</label>
            <select value={form.away} onChange={(e) => set('away', e.target.value)} className={INPUT}>
              {CLUBS.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <RefereeSelect label="Hlavný rozhodca" value={form.mainRef} onChange={(v) => set('mainRef', v)} referees={activeRefs} optional={false} />
          <RefereeSelect label="Asistent 1" value={form.linesman1} onChange={(v) => set('linesman1', v)} referees={activeRefs} optional />
          <RefereeSelect label="Asistent 2" value={form.linesman2} onChange={(v) => set('linesman2', v)} referees={activeRefs} optional />

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
