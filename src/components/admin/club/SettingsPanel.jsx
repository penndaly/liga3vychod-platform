import { useState } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { Save } from 'lucide-react'
import { db } from '../../../services/firebase'
import LogoUploader from '../clubs/LogoUploader'

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5'
const INPUT  = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-slate-500 transition-colors placeholder:text-slate-600'

function Field({ label, children }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      {children}
    </div>
  )
}

export default function SettingsPanel({ data, clubColor = '#facc15' }) {
  const { club, profile } = data
  const clubId = club?.id

  const [form, setForm] = useState({
    name:    profile?.name    ?? club?.name    ?? '',
    short:   profile?.short   ?? club?.short   ?? '',
    city:    profile?.city    ?? '',
    founded: profile?.founded != null ? String(profile.founded) : '',
    ground:  profile?.ground  ?? '',
    colours: profile?.colours ?? '',
    website: profile?.website ?? '',
    email:   profile?.email   ?? '',
  })
  const [logoUrl, setLogoUrl] = useState(profile?.logoUrl ?? null)
  const [saving, setSaving] = useState(false)

  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!clubId) return
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
      toast.success('Nastavenia uložené')
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

      {/* Logo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Logo klubu</h3>
        {/* LogoUploader is light-themed internally — wrap with a neutral bg */}
        <div className="bg-slate-800/50 rounded-xl p-4 inline-block">
          <LogoUploader
            clubId={String(clubId)}
            clubShort={club?.short ?? '?'}
            currentUrl={logoUrl}
            onUploaded={setLogoUrl}
          />
        </div>
      </div>

      {/* Profile fields */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Informácie o klube</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Názov klubu">
            <input type="text" required value={form.name}
              onChange={(e) => set('name', e.target.value)} className={INPUT} />
          </Field>
          <Field label="Skratka (3–4 znaky)">
            <input type="text" maxLength={4} value={form.short}
              onChange={(e) => set('short', e.target.value.toUpperCase())} className={INPUT} />
          </Field>
          <Field label="Mesto">
            <input type="text" value={form.city}
              onChange={(e) => set('city', e.target.value)} className={INPUT} placeholder="Humenné" />
          </Field>
          <Field label="Rok založenia">
            <input type="number" min="1800" max="2030" value={form.founded}
              onChange={(e) => set('founded', e.target.value)} className={INPUT} placeholder="1921" />
          </Field>
          <Field label="Domáci štadión">
            <input type="text" value={form.ground}
              onChange={(e) => set('ground', e.target.value)} className={INPUT} placeholder="Mestský štadión" />
          </Field>
          <Field label="Farby klubu">
            <input type="text" value={form.colours}
              onChange={(e) => set('colours', e.target.value)} className={INPUT} placeholder="Modrá / Biela" />
          </Field>
          <Field label="Webstránka">
            <input type="url" value={form.website}
              onChange={(e) => set('website', e.target.value)} className={INPUT} placeholder="https://fkhumenne.sk" />
          </Field>
          <Field label="Kontaktný email">
            <input type="email" value={form.email}
              onChange={(e) => set('email', e.target.value)} className={INPUT} placeholder="info@fkhumenne.sk" />
          </Field>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 text-sm font-black uppercase tracking-wide px-6 py-2.5 rounded-xl disabled:opacity-50 transition-colors"
        style={{ background: clubColor, color: '#0f172a' }}
      >
        <Save size={14} />
        {saving ? 'Ukladám...' : 'Uložiť nastavenia'}
      </button>
    </form>
  )
}
