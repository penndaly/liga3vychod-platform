import { useRef, useState } from 'react'
import { Upload, Loader } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../../services/firebase'

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT  = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition-colors bg-white'

export default function LeagueSection({ initialData }) {
  const [form, setForm] = useState({
    name:      initialData?.name      ?? 'TIPOS III. Liga Východ',
    shortName: initialData?.shortName ?? 'III. Liga Východ',
    email:     initialData?.email     ?? '',
    website:   initialData?.website   ?? '',
    facebook:  initialData?.facebook  ?? '',
    instagram: initialData?.instagram ?? '',
    youtube:   initialData?.youtube   ?? '',
  })
  const [logoUrl,   setLogoUrl]   = useState(initialData?.logoUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const inputRef = useRef(null)
  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }))

  async function handleLogo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Vyberte obrázok'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Max 2 MB'); return }
    setUploading(true)
    try {
      const storageRef = ref(storage, 'settings/league_logo')
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      setLogoUrl(url)
      toast.success('Logo nahraté')
    } catch {
      toast.error('Chyba pri nahrávaní loga')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(doc(db, 'settings', 'league'), {
        name:      form.name.trim(),
        shortName: form.shortName.trim(),
        email:     form.email.trim(),
        website:   form.website.trim(),
        facebook:  form.facebook.trim(),
        instagram: form.instagram.trim(),
        youtube:   form.youtube.trim(),
        logoUrl:   logoUrl ?? null,
        updatedAt: serverTimestamp(),
      })
      toast.success('Nastavenia ligy uložené')
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-5">
        {/* Logo */}
        <div>
          <p className={LABEL}>Logo ligy</p>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 hover:border-yellow-400 flex items-center justify-center overflow-hidden transition-colors focus:outline-none shrink-0">
              {uploading
                ? <Loader size={18} className="text-slate-400 animate-spin" />
                : logoUrl
                ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1.5" />
                : <span className="text-xs font-black text-slate-400">LOGO</span>}
            </button>
            <div>
              <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
                className="flex items-center gap-2 border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors">
                <Upload size={13} /> {logoUrl ? 'Zmeniť logo' : 'Nahrať logo'}
              </button>
              <p className="text-xs text-slate-400 mt-1.5">PNG alebo SVG · max 2 MB</p>
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={LABEL}>Plný názov ligy</label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Krátky názov</label>
            <input type="text" value={form.shortName} onChange={(e) => set('shortName', e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Kontaktný email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={INPUT} placeholder="liga@szfz.sk" />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}>Webstránka</label>
            <input type="url" value={form.website} onChange={(e) => set('website', e.target.value)} className={INPUT} placeholder="https://futbalnet.sk" />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5 space-y-3">
          <p className={LABEL}>Sociálne siete</p>
          {[
            { f: 'facebook',  ph: 'https://facebook.com/liga3vychod' },
            { f: 'instagram', ph: 'https://instagram.com/liga3vychod' },
            { f: 'youtube',   ph: 'https://youtube.com/@liga3vychod' },
          ].map(({ f, ph }) => (
            <div key={f} className="flex items-center gap-3">
              <span className="w-20 text-xs font-bold text-slate-400 uppercase tracking-widest capitalize shrink-0">{f}</span>
              <input type="url" value={form[f]} onChange={(e) => set(f, e.target.value)} className={INPUT} placeholder={ph} />
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={saving}
        className="bg-yellow-400 text-slate-950 px-6 py-2.5 rounded-lg text-sm font-black uppercase tracking-widest hover:bg-yellow-300 disabled:opacity-50 transition-colors">
        {saving ? 'Ukladám...' : 'Uložiť identitu'}
      </button>
    </form>
  )
}
