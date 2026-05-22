import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../services/firebase'
import LogoUploader from './LogoUploader'

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT  = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition-colors bg-white'

export default function ClubProfileForm({ clubId, club, initialData, onSaved }) {
  const [form, setForm] = useState({
    name:    initialData?.name    ?? club.name,
    short:   initialData?.short   ?? club.short,
    founded: initialData?.founded ?? '',
    ground:  initialData?.ground  ?? '',
    city:    initialData?.city    ?? '',
    colours: initialData?.colours ?? '',
    website: initialData?.website ?? '',
    email:   initialData?.email   ?? '',
  })
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl ?? null)
  const [saving, setSaving] = useState(false)

  const set = (f, v) => setForm((prev) => ({ ...prev, [f]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'clubs', String(clubId)),
        {
          ...form,
          founded:   form.founded ? Number(form.founded) : null,
          logoUrl:   logoUrl ?? null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      toast.success('Profil uložený')
      onSaved()
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-6">
        <div>
          <p className={LABEL}>Logo klubu</p>
          <LogoUploader
            clubId={clubId}
            clubShort={club.short}
            currentUrl={logoUrl}
            onUploaded={setLogoUrl}
          />
        </div>

        <div className="border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Názov klubu</label>
            <input type="text" required value={form.name} onChange={(e) => set('name', e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Skratka</label>
            <input type="text" maxLength={4} value={form.short} onChange={(e) => set('short', e.target.value.toUpperCase())} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Mesto</label>
            <input type="text" value={form.city} onChange={(e) => set('city', e.target.value)} className={INPUT} placeholder="Bardejov" />
          </div>
          <div>
            <label className={LABEL}>Rok založenia</label>
            <input type="number" min="1800" max="2030" value={form.founded} onChange={(e) => set('founded', e.target.value)} className={INPUT} placeholder="1920" />
          </div>
          <div>
            <label className={LABEL}>Domáci štadión</label>
            <input type="text" value={form.ground} onChange={(e) => set('ground', e.target.value)} className={INPUT} placeholder="MŠK Štadión" />
          </div>
          <div>
            <label className={LABEL}>Farby klubu</label>
            <input type="text" value={form.colours} onChange={(e) => set('colours', e.target.value)} className={INPUT} placeholder="Modrá / Biela" />
          </div>
          <div>
            <label className={LABEL}>Webstránka</label>
            <input type="url" value={form.website} onChange={(e) => set('website', e.target.value)} className={INPUT} placeholder="https://fkbardejov.sk" />
          </div>
          <div>
            <label className={LABEL}>Kontaktný email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={INPUT} placeholder="info@fkbardejov.sk" />
          </div>
        </div>
      </div>

      <button
        type="submit" disabled={saving}
        className="bg-yellow-400 text-slate-950 px-6 py-2.5 rounded-lg text-sm font-black uppercase tracking-widest hover:bg-yellow-300 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Ukladám...' : 'Uložiť profil'}
      </button>
    </form>
  )
}
