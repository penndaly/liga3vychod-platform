import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  collection, addDoc, doc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../services/firebase'
import { getClubBySlug } from '../../config/clubs-config'
import { TEAM_DEFS, calcAge } from '../../hooks/useAcademyTeams'

const POSITIONS = [
  { value: 'GK',  label: 'Brankár'  },
  { value: 'DEF', label: 'Obranca'  },
  { value: 'MID', label: 'Záložník' },
  { value: 'FWD', label: 'Útočník'  },
]

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition-colors'

function Field({ label, children }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      {children}
    </div>
  )
}

const EMPTY = {
  name: '', position: 'MID', jerseyNumber: '',
  dateOfBirth: '', height: '', weight: '',
  parentName: '', parentPhone: '', parentEmail: '',
  previousClub: '', photo: '',
}

export default function AddAcademyPlayer({ clubSlug, teamId, player, onClose, onSaved }) {
  const isEdit = Boolean(player?.id)
  const staticClub = getClubBySlug(clubSlug)
  const clubId = staticClub ? String(staticClub.id) : null

  const [form, setForm] = useState(isEdit ? {
    name:         player.name         ?? '',
    position:     player.position     ?? 'MID',
    jerseyNumber: player.jerseyNumber != null ? String(player.jerseyNumber) : '',
    dateOfBirth:  player.dateOfBirth  ?? '',
    height:       player.height       != null ? String(player.height) : '',
    weight:       player.weight       != null ? String(player.weight) : '',
    parentName:   player.parentName   ?? '',
    parentPhone:  player.parentPhone  ?? '',
    parentEmail:  player.parentEmail  ?? '',
    previousClub: player.previousClub ?? '',
    photo:        player.photo        ?? '',
  } : { ...EMPTY })

  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const age = calcAge(form.dateOfBirth)
  const teamDef = TEAM_DEFS.find((t) => t.id === teamId)
  const ageWarning = age !== null && teamDef && (age < teamDef.minAge || age > teamDef.maxAge)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim())       { toast.error('Meno je povinné');             return }
    if (!form.dateOfBirth)       { toast.error('Dátum narodenia je povinný'); return }
    if (!form.parentName.trim()) { toast.error('Kontakt na rodiča je povinný'); return }

    setSaving(true)
    try {
      const data = {
        name:         form.name.trim(),
        position:     form.position,
        jerseyNumber: form.jerseyNumber !== '' ? Number(form.jerseyNumber) : null,
        dateOfBirth:  form.dateOfBirth,
        height:       form.height !== ''  ? Number(form.height)  : null,
        weight:       form.weight !== ''  ? Number(form.weight)  : null,
        parentName:   form.parentName.trim(),
        parentPhone:  form.parentPhone.trim(),
        parentEmail:  form.parentEmail.trim(),
        previousClub: form.previousClub.trim(),
        photo:        form.photo.trim(),
      }

      if (isEdit) {
        await updateDoc(
          doc(db, 'clubs', clubId, 'academy', teamId, 'players', player.id),
          { ...data, updatedAt: serverTimestamp() }
        )
        toast.success('Hráč aktualizovaný')
      } else {
        await addDoc(
          collection(db, 'clubs', clubId, 'academy', teamId, 'players'),
          { ...data, createdAt: serverTimestamp() }
        )
        toast.success(`Hráč pridaný do ${teamId}`)
      }
      onSaved()
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-100">
              {isEdit ? 'Upraviť hráča' : `Pridať hráča — ${teamId}`}
            </h2>
            {teamDef && (
              <p className="text-xs text-slate-500 mt-0.5">{teamDef.sublabel} · vek {teamDef.minAge}–{teamDef.maxAge} rokov</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Age warning */}
          {ageWarning && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
              <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400">
                Hráč má {age} rokov — mimo vekovej skupiny {teamDef.label} ({teamDef.minAge}–{teamDef.maxAge} r.)
              </p>
            </div>
          )}

          {/* Name + Position */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Field label="Meno a priezvisko *">
                <input
                  type="text" required value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className={INPUT} placeholder="Ján Novák"
                />
              </Field>
            </div>
            <Field label="Pozícia">
              <select value={form.position} onChange={(e) => set('position', e.target.value)} className={INPUT}>
                {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
            <Field label="Číslo dresu">
              <input
                type="number" min="1" max="99" value={form.jerseyNumber}
                onChange={(e) => set('jerseyNumber', e.target.value)}
                className={INPUT} placeholder="10"
              />
            </Field>
          </div>

          {/* DOB + physical */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1">
              <Field label={`Dátum nar. *${age !== null ? ` (${age} r.)` : ''}`}>
                <input
                  type="date" required value={form.dateOfBirth}
                  onChange={(e) => set('dateOfBirth', e.target.value)}
                  className={INPUT}
                />
              </Field>
            </div>
            <Field label="Výška (cm)">
              <input
                type="number" min="100" max="220" value={form.height}
                onChange={(e) => set('height', e.target.value)}
                className={INPUT} placeholder="165"
              />
            </Field>
            <Field label="Váha (kg)">
              <input
                type="number" min="20" max="120" value={form.weight}
                onChange={(e) => set('weight', e.target.value)}
                className={INPUT} placeholder="55"
              />
            </Field>
          </div>

          {/* Parent contact */}
          <div className="space-y-3 pt-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rodič / zákonný zástupca</p>
            <Field label="Meno rodiča *">
              <input
                type="text" required value={form.parentName}
                onChange={(e) => set('parentName', e.target.value)}
                className={INPUT} placeholder="Ján Novák"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefón">
                <input
                  type="tel" value={form.parentPhone}
                  onChange={(e) => set('parentPhone', e.target.value)}
                  className={INPUT} placeholder="+421 900 123 456"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email" value={form.parentEmail}
                  onChange={(e) => set('parentEmail', e.target.value)}
                  className={INPUT} placeholder="jan@gmail.com"
                />
              </Field>
            </div>
          </div>

          {/* Optional fields */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Field label="Predošlý klub">
              <input
                type="text" value={form.previousClub}
                onChange={(e) => set('previousClub', e.target.value)}
                className={INPUT} placeholder="FK Snina U13"
              />
            </Field>
            <Field label="URL fotografie">
              <input
                type="url" value={form.photo}
                onChange={(e) => set('photo', e.target.value)}
                className={INPUT} placeholder="https://..."
              />
            </Field>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-700 text-slate-400 text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Zrušiť
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-yellow-400 text-slate-950 text-sm font-black rounded-xl hover:bg-yellow-300 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Ukladám...' : 'Uložiť'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
