import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../services/firebase'

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT  = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition-colors bg-white'

const TIEBREAKERS = [
  { id: 'gd',  label: 'Rozdiel gólov (GD)' },
  { id: 'gf',  label: 'Strelené góly (GF)' },
  { id: 'h2h', label: 'Vzájomné zápasy' },
  { id: 'abc', label: 'Abecedne' },
]

function NumField({ label, value, onChange, min = 0, max = 99, hint }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <input type="number" min={min} max={max} value={value}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        className={INPUT} />
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

export default function RulesSection({ initialData }) {
  const [form, setForm] = useState({
    pointsWin:       initialData?.pointsWin       ?? 3,
    pointsDraw:      initialData?.pointsDraw      ?? 1,
    pointsLoss:      initialData?.pointsLoss      ?? 0,
    teamsCount:      initialData?.teamsCount      ?? 14,
    promotionSpots:  initialData?.promotionSpots  ?? 2,
    playoffSpots:    initialData?.playoffSpots     ?? 1,
    relegationSpots: initialData?.relegationSpots ?? 2,
    tiebreakers:     initialData?.tiebreakers     ?? ['gd', 'gf', 'h2h', 'abc'],
  })
  const [saving, setSaving] = useState(false)
  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }))

  function toggleTiebreaker(id) {
    setForm((p) => {
      const current = p.tiebreakers ?? []
      return {
        ...p,
        tiebreakers: current.includes(id)
          ? current.filter((t) => t !== id)
          : [...current, id],
      }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(doc(db, 'settings', 'rules'), {
        pointsWin:       Number(form.pointsWin),
        pointsDraw:      Number(form.pointsDraw),
        pointsLoss:      Number(form.pointsLoss),
        teamsCount:      Number(form.teamsCount),
        promotionSpots:  Number(form.promotionSpots),
        playoffSpots:    Number(form.playoffSpots),
        relegationSpots: Number(form.relegationSpots),
        tiebreakers:     form.tiebreakers,
        updatedAt:       serverTimestamp(),
      })
      toast.success('Pravidlá uložené')
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  const total = Number(form.promotionSpots) + Number(form.playoffSpots) + Number(form.relegationSpots)
  const safe  = total <= Number(form.teamsCount)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Points */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Bodovanie</p>
        <div className="grid grid-cols-3 gap-4">
          <NumField label="Body za výhru" value={form.pointsWin} onChange={(v) => set('pointsWin', v)} min={0} max={10} />
          <NumField label="Body za remízu" value={form.pointsDraw} onChange={(v) => set('pointsDraw', v)} min={0} max={10} />
          <NumField label="Body za prehru" value={form.pointsLoss} onChange={(v) => set('pointsLoss', v)} min={0} max={10} />
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500 bg-slate-50 rounded-lg px-4 py-2.5">
          <span>Výsledok:</span>
          <span className="font-black text-slate-900">V = {form.pointsWin}b</span>
          <span className="text-slate-300">·</span>
          <span className="font-black text-slate-900">R = {form.pointsDraw}b</span>
          <span className="text-slate-300">·</span>
          <span className="font-black text-slate-900">P = {form.pointsLoss}b</span>
        </div>
      </div>

      {/* Zones */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Tabuľkové zóny</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <NumField label="Počet tímov" value={form.teamsCount} onChange={(v) => set('teamsCount', v)} min={4} max={24} />
          <NumField label="Postup" value={form.promotionSpots} onChange={(v) => set('promotionSpots', v)} min={0} max={8}
            hint="Priamy postup (zelená)" />
          <NumField label="Baráž" value={form.playoffSpots} onChange={(v) => set('playoffSpots', v)} min={0} max={4}
            hint="Playoff (jantárová)" />
          <NumField label="Zostup" value={form.relegationSpots} onChange={(v) => set('relegationSpots', v)} min={0} max={8}
            hint="Priamy zostup (červená)" />
        </div>

        {/* Zone preview */}
        <div className="space-y-1">
          {Array.from({ length: Math.min(Number(form.teamsCount) || 14, 14) }, (_, i) => i + 1).map((pos) => {
            const promo = pos <= Number(form.promotionSpots)
            const playoff = pos > Number(form.teamsCount) - Number(form.playoffSpots) - Number(form.relegationSpots)
              && pos <= Number(form.teamsCount) - Number(form.relegationSpots)
            const relg = pos > Number(form.teamsCount) - Number(form.relegationSpots)
            return (
              <div key={pos} className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold border-l-2 ${
                promo   ? 'border-green-500 bg-green-50 text-green-700'   :
                relg    ? 'border-red-500 bg-red-50 text-red-700'         :
                playoff ? 'border-yellow-400 bg-yellow-50 text-yellow-700' :
                'border-slate-200 bg-slate-50 text-slate-400'
              }`}>
                <span className="w-4 text-right">{pos}.</span>
                <span>{promo ? 'Postup' : relg ? 'Zostup' : playoff ? 'Baráž' : '—'}</span>
              </div>
            )
          })}
        </div>

        {!safe && (
          <p className="text-xs text-red-500 font-bold">
            Počet miest ({total}) presahuje počet tímov ({form.teamsCount})
          </p>
        )}
      </div>

      {/* Tiebreakers */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-3">
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Rozhodujúce kritériá (pri zhode bodov)</p>
        <div className="space-y-2">
          {TIEBREAKERS.map((t) => (
            <label key={t.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg px-3 py-2 transition-colors">
              <input type="checkbox" checked={(form.tiebreakers ?? []).includes(t.id)}
                onChange={() => toggleTiebreaker(t.id)} className="w-4 h-4 accent-yellow-400" />
              <span className="text-sm font-bold text-slate-700">{t.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button type="submit" disabled={saving || !safe}
        className="bg-yellow-400 text-slate-950 px-6 py-2.5 rounded-lg text-sm font-black uppercase tracking-widest hover:bg-yellow-300 disabled:opacity-50 transition-colors">
        {saving ? 'Ukladám...' : 'Uložiť pravidlá'}
      </button>
    </form>
  )
}
