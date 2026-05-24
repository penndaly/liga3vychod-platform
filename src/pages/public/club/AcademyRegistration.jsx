import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  collection, getDocs, addDoc, query,
  orderBy, where, serverTimestamp,
} from 'firebase/firestore'
import { CheckCircle2, GraduationCap, ChevronLeft, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { db } from '../../../services/firebase'
import { getClubBySlug } from '../../../config/clubs-config'
import Navbar from '../../../components/public/Navbar'
import Footer from '../../../components/public/Footer'

const POSITIONS = [
  { value: 'GK',  label: 'Brankár'     },
  { value: 'DEF', label: 'Obranca'     },
  { value: 'MID', label: 'Záložník / Stredopoliar' },
  { value: 'FWD', label: 'Útočník'     },
]

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT = 'w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition-colors'
const TEXTAREA = `${INPUT} resize-none`

function Section({ title, children }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-yellow-400 pb-2 border-b border-slate-800">
        {title}
      </h3>
      {children}
    </div>
  )
}

export default function AcademyRegistration() {
  const { clubSlug } = useParams()
  const staticClub   = getClubBySlug(clubSlug)
  const clubId       = staticClub ? String(staticClub.id) : null
  const clubColor    = staticClub?.color ?? '#facc15'

  const [sessions,   setSessions]   = useState([])
  const [submitted,  setSubmitted]  = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    playerName: '', dob: '', position: 'MID', experience: '',
    parentName: '', parentPhone: '', parentEmail: '', emergencyContact: '',
    medicalNotes: '', preferredTrialDate: '',
    consent: false,
  })

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!clubId) return
    async function load() {
      try {
        const snap = await getDocs(
          query(
            collection(db, 'clubs', clubId, 'trial_sessions'),
            where('date', '>=', today),
            orderBy('date', 'asc')
          )
        )
        setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } catch {
        // no sessions available — form still works without date selection
      }
    }
    load()
  }, [clubId])

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.consent) { toast.error('Musíte súhlasiť so spracovaním osobných údajov'); return }
    if (!form.playerName.trim()) { toast.error('Meno hráča je povinné'); return }
    if (!form.dob)                { toast.error('Dátum narodenia je povinný'); return }
    if (!form.parentName.trim()) { toast.error('Meno rodiča je povinné'); return }
    if (!form.parentPhone.trim()) { toast.error('Telefón rodiča je povinný'); return }
    if (!form.parentEmail.trim()) { toast.error('Email rodiča je povinný'); return }

    setSubmitting(true)
    try {
      await addDoc(collection(db, 'clubs', clubId, 'trial_applications'), {
        playerName:          form.playerName.trim(),
        dob:                 form.dob,
        position:            form.position,
        experience:          form.experience.trim(),
        parentName:          form.parentName.trim(),
        parentPhone:         form.parentPhone.trim(),
        parentEmail:         form.parentEmail.trim(),
        emergencyContact:    form.emergencyContact.trim(),
        medicalNotes:        form.medicalNotes.trim(),
        preferredTrialDate:  form.preferredTrialDate || null,
        status:              'pending',
        submittedAt:         serverTimestamp(),
      })
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      toast.error('Chyba pri odosielaní prihlášky. Skúste to znova.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!staticClub) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-slate-500 text-sm">Klub nenájdený.</p>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      {/* Hero strip */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <Link
            to={`/kluby/${staticClub.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-yellow-400 transition-colors mb-4"
          >
            <ChevronLeft size={12} /> {staticClub.name}
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: clubColor }}
            >
              <GraduationCap size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white leading-tight">
                Registrácia na skúšku
              </h1>
              <p className="text-sm font-bold mt-0.5" style={{ color: clubColor }}>
                Akadémia {staticClub.name}
              </p>
            </div>
          </div>
        </div>
        <div className="h-0.5 w-full" style={{ background: clubColor }} />
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Success state */}
        {submitted ? (
          <div className="bg-slate-900 border border-green-500/30 rounded-2xl p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-green-400" />
            </div>
            <h2 className="text-xl font-black text-white">Prihláška odoslaná!</h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
              Ďakujeme za záujem o akadémiu {staticClub.name}. Budeme vás kontaktovať na zadaný email alebo telefón.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to={`/kluby/${staticClub.id}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-slate-700 text-slate-400 text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                ← Profil klubu
              </Link>
              <button
                onClick={() => { setSubmitted(false); setForm({ playerName: '', dob: '', position: 'MID', experience: '', parentName: '', parentPhone: '', parentEmail: '', emergencyContact: '', medicalNotes: '', preferredTrialDate: '', consent: false }) }}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-yellow-400 text-slate-950 text-sm font-black rounded-xl hover:bg-yellow-300 transition-colors"
              >
                Ďalšia prihláška
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Player info */}
            <Section title="Informácie o hráčovi">
              <div>
                <label className={LABEL}>Celé meno hráča *</label>
                <input
                  type="text" required value={form.playerName}
                  onChange={(e) => set('playerName', e.target.value)}
                  className={INPUT} placeholder="Peter Novák"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Dátum narodenia *</label>
                  <input
                    type="date" required value={form.dob}
                    onChange={(e) => set('dob', e.target.value)}
                    max={today}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Preferovaná pozícia</label>
                  <select value={form.position} onChange={(e) => set('position', e.target.value)} className={INPUT}>
                    {POSITIONS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={LABEL}>Predchádzajúce skúsenosti</label>
                <textarea
                  value={form.experience}
                  onChange={(e) => set('experience', e.target.value)}
                  rows={3} className={TEXTAREA}
                  placeholder="Predchádzajúce kluby, koľko rokov hrá, úroveň súťaže..."
                />
              </div>
            </Section>

            {/* Parent contact */}
            <Section title="Kontakt rodiča / zákonného zástupcu">
              <div>
                <label className={LABEL}>Meno rodiča / zákonného zástupcu *</label>
                <input
                  type="text" required value={form.parentName}
                  onChange={(e) => set('parentName', e.target.value)}
                  className={INPUT} placeholder="Ján Novák"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Telefón *</label>
                  <input
                    type="tel" required value={form.parentPhone}
                    onChange={(e) => set('parentPhone', e.target.value)}
                    className={INPUT} placeholder="+421 900 123 456"
                  />
                </div>
                <div>
                  <label className={LABEL}>Email *</label>
                  <input
                    type="email" required value={form.parentEmail}
                    onChange={(e) => set('parentEmail', e.target.value)}
                    className={INPUT} placeholder="jan.novak@gmail.com"
                  />
                </div>
              </div>
              <div>
                <label className={LABEL}>Núdzový kontakt (voliteľné)</label>
                <input
                  type="text" value={form.emergencyContact}
                  onChange={(e) => set('emergencyContact', e.target.value)}
                  className={INPUT} placeholder="Meno a telefón pre núdzové situácie"
                />
              </div>
            </Section>

            {/* Medical */}
            <Section title="Zdravotné informácie">
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-400 leading-relaxed">
                  Uveďte všetky relevantné zdravotné informácie — alergie, chronické ochorenia, obmedzenia pohybu. Tieto informácie sú dôverné a slúžia výlučne trénerovi a zdravotníkovi.
                </p>
              </div>
              <div>
                <label className={LABEL}>Zdravotné podmienky / poznámky (voliteľné)</label>
                <textarea
                  value={form.medicalNotes}
                  onChange={(e) => set('medicalNotes', e.target.value)}
                  rows={3} className={TEXTAREA}
                  placeholder="Alergie, astma, nedávne zranenia, lieky..."
                />
              </div>
            </Section>

            {/* Trial date selection */}
            {sessions.length > 0 && (
              <Section title="Preferovaný termín skúšky">
                <p className="text-xs text-slate-500">Vyberte si termín skúšky. Pokiaľ nemôžete žiadny dátum, nechajte nevybrané — kontaktujeme vás.</p>
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <label
                      key={s.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        form.preferredTrialDate === s.id
                          ? 'border-yellow-400/50 bg-yellow-400/5'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="trialDate"
                        value={s.id}
                        checked={form.preferredTrialDate === s.id}
                        onChange={() => set('preferredTrialDate', s.id)}
                        className="mt-0.5 accent-yellow-400"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-200">
                          {s.date} o {s.time}
                          {s.teamId && s.teamId !== 'Všetky' && (
                            <span className="ml-2 text-xs font-black px-1.5 py-0.5 rounded" style={{ background: clubColor + '33', color: clubColor }}>
                              {s.teamId}
                            </span>
                          )}
                        </p>
                        {s.venue && <p className="text-xs text-slate-500 mt-0.5">{s.venue}</p>}
                        {s.notes && <p className="text-xs text-slate-600 mt-0.5">{s.notes}</p>}
                      </div>
                    </label>
                  ))}
                  <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    form.preferredTrialDate === '' ? 'border-slate-600 bg-slate-800/40' : 'border-slate-800 hover:border-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="trialDate"
                      value=""
                      checked={form.preferredTrialDate === ''}
                      onChange={() => set('preferredTrialDate', '')}
                      className="mt-0.5 accent-yellow-400"
                    />
                    <p className="text-sm text-slate-500">Neviem určiť — kontaktujte ma</p>
                  </label>
                </div>
              </Section>
            )}

            {/* Consent + submit */}
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => set('consent', e.target.checked)}
                  className="mt-0.5 accent-yellow-400 shrink-0"
                />
                <p className="text-xs text-slate-400 leading-relaxed">
                  Súhlasím so spracovaním osobných údajov mojho dieťaťa a mojich kontaktných údajov za účelom registrácie na skúšku v akadémii {staticClub.name}. Údaje nebudú zdieľané s tretími stranami.
                </p>
              </label>

              <button
                type="submit"
                disabled={submitting || !form.consent}
                className="w-full py-4 font-black text-sm uppercase tracking-widest rounded-2xl transition-colors disabled:opacity-50"
                style={{ background: clubColor, color: '#0f172a' }}
              >
                {submitting ? 'Odosielam prihlášku...' : 'Odoslať prihlášku'}
              </button>
            </div>
          </form>
        )}
      </div>

      <Footer />
    </div>
  )
}
