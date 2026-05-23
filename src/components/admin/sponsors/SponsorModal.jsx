import { useRef, useState } from 'react'
import { X, Upload, Loader } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../../services/firebase'

export const TIERS = [
  { value: 'title',   label: 'Titulný sponzor', cls: 'bg-yellow-400 text-slate-950' },
  { value: 'gold',    label: 'Gold',            cls: 'bg-amber-100 text-amber-700' },
  { value: 'silver',  label: 'Silver',          cls: 'bg-slate-100 text-slate-600' },
  { value: 'partner', label: 'Partner',         cls: 'bg-blue-100 text-blue-700' },
]

const SECTIONS = [
  { id: 'homepage',  label: 'Domovská stránka' },
  { id: 'fixtures',  label: 'Zápasy' },
  { id: 'standings', label: 'Tabuľka' },
]

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT  = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition-colors bg-white'

export default function SponsorModal({ entry, onClose, onSaved }) {
  const isEdit = Boolean(entry?.id)
  const [docId]  = useState(() => isEdit ? entry.id : doc(collection(db, 'sponsors')).id)
  const [form, setForm] = useState({
    name:     entry?.name     ?? '',
    website:  entry?.website  ?? '',
    tier:     entry?.tier     ?? 'partner',
    order:    entry?.order    != null ? String(entry.order) : '10',
    active:   entry?.active   ?? true,
    sections: entry?.sections ?? ['homepage'],
  })
  const [logoUrl,   setLogoUrl]   = useState(entry?.logoUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const inputRef = useRef(null)
  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }))

  function toggleSection(id) {
    setForm((p) => ({
      ...p,
      sections: p.sections.includes(id) ? p.sections.filter((s) => s !== id) : [...p.sections, id],
    }))
  }

  async function handleLogo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Vyberte obrázok'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Max 2 MB'); return }
    setUploading(true)
    try {
      const storageRef = ref(storage, `sponsors/${docId}/logo`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      setLogoUrl(url)
      toast.success('Logo nahraté')
    } catch {
      toast.error('Chyba pri nahrávaní')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'sponsors', docId),
        {
          name:     form.name.trim(),
          website:  form.website.trim(),
          tier:     form.tier,
          order:    Number(form.order) || 10,
          active:   form.active,
          sections: form.sections,
          logoUrl:  logoUrl ?? null,
          updatedAt: serverTimestamp(),
          ...(isEdit ? {} : { createdAt: serverTimestamp() }),
        },
        { merge: true }
      )
      toast.success(isEdit ? 'Sponzor aktualizovaný' : 'Sponzor pridaný')
      onSaved()
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
            {isEdit ? 'Upraviť sponzora' : 'Nový sponzor'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Logo */}
          <div>
            <p className={LABEL}>Logo</p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
                className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 hover:border-yellow-400 flex items-center justify-center overflow-hidden transition-colors shrink-0">
                {uploading ? <Loader size={16} className="text-slate-400 animate-spin" />
                  : logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-contain p-1" />
                  : <span className="text-xs font-black text-slate-300">LOGO</span>}
              </button>
              <div>
                <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors">
                  <Upload size={12} /> {logoUrl ? 'Zmeniť' : 'Nahrať logo'}
                </button>
                <p className="text-xs text-slate-400 mt-1">PNG / SVG · max 2 MB</p>
              </div>
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            </div>
          </div>

          <div>
            <label className={LABEL}>Názov sponzora</label>
            <input type="text" required value={form.name} onChange={(e) => set('name', e.target.value)} className={INPUT} placeholder="TIPOS a.s." />
          </div>
          <div>
            <label className={LABEL}>Webstránka</label>
            <input type="url" value={form.website} onChange={(e) => set('website', e.target.value)} className={INPUT} placeholder="https://tipos.sk" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Tier</label>
              <select value={form.tier} onChange={(e) => set('tier', e.target.value)} className={INPUT}>
                {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Poradie</label>
              <input type="number" min="1" value={form.order} onChange={(e) => set('order', e.target.value)} className={INPUT} />
            </div>
          </div>

          {/* Sections */}
          <div>
            <p className={LABEL}>Zobrazovať na</p>
            <div className="space-y-1.5">
              {SECTIONS.map((s) => (
                <label key={s.id} className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors">
                  <input type="checkbox" checked={form.sections.includes(s.id)} onChange={() => toggleSection(s.id)} className="w-4 h-4 accent-yellow-400" />
                  <span className="text-sm font-bold text-slate-700">{s.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Active */}
          <label className="flex items-center gap-3 cursor-pointer border border-slate-200 rounded-lg px-4 py-3 hover:bg-slate-50 transition-colors">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="w-4 h-4 accent-yellow-400" />
            <div>
              <p className="text-sm font-bold text-slate-900">Aktívny sponzor</p>
              <p className="text-xs text-slate-400">Zobrazuje sa na verejnom webe</p>
            </div>
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
