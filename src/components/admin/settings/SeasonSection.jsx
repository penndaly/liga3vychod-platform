import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../services/firebase'

const SEASONS = ['2025/26', '2024/25', '2023/24', '2026/27']

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT  = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition-colors bg-white'

export default function SeasonSection({ initialData }) {
  const [form, setForm] = useState({
    competitionName:  initialData?.competitionName  ?? 'TIPOS III. Liga Východ',
    currentSeason:    initialData?.currentSeason    ?? '2025/26',
    activeRound:      initialData?.activeRound      != null ? String(initialData.activeRound) : '22',
    totalRounds:      initialData?.totalRounds      != null ? String(initialData.totalRounds) : '46',
    seasonStart:      initialData?.seasonStart      ?? '',
    seasonEnd:        initialData?.seasonEnd        ?? '',
    winterBreakStart: initialData?.winterBreakStart ?? '',
    winterBreakEnd:   initialData?.winterBreakEnd   ?? '',
  })
  const [saving, setSaving] = useState(false)
  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(doc(db, 'settings', 'season'), {
        competitionName:  form.competitionName.trim(),
        currentSeason:    form.currentSeason,
        activeRound:      Number(form.activeRound)  || 1,
        totalRounds:      Number(form.totalRounds)  || 46,
        seasonStart:      form.seasonStart.trim(),
        seasonEnd:        form.seasonEnd.trim(),
        winterBreakStart: form.winterBreakStart.trim(),
        winterBreakEnd:   form.winterBreakEnd.trim(),
        updatedAt:        serverTimestamp(),
      })
      toast.success('Nastavenia sezóny uložené')
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  const progress = form.activeRound && form.totalRounds
    ? Math.round((Number(form.activeRound) / Number(form.totalRounds)) * 100)
    : 0

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-5">
        <div>
          <label className={LABEL}>Názov súťaže</label>
          <input type="text" value={form.competitionName} onChange={(e) => set('competitionName', e.target.value)} className={INPUT} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Aktuálna sezóna</label>
            <select value={form.currentSeason} onChange={(e) => set('currentSeason', e.target.value)} className={INPUT}>
              {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Aktuálne kolo</label>
            <input type="number" min="1" value={form.activeRound} onChange={(e) => set('activeRound', e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Celkový počet kôl</label>
            <input type="number" min="1" value={form.totalRounds} onChange={(e) => set('totalRounds', e.target.value)} className={INPUT} />
          </div>
        </div>

        {/* Progress bar */}
        {form.activeRound && form.totalRounds && (
          <div>
            <div className="flex justify-between text-xs text-slate-400 font-bold mb-1.5">
              <span>Priebeh sezóny</span>
              <span>{form.activeRound} / {form.totalRounds} kôl ({progress}%)</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="border-t border-slate-100 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Začiatok sezóny</label>
            <input type="text" value={form.seasonStart} onChange={(e) => set('seasonStart', e.target.value)} className={INPUT} placeholder="2.8.2025" />
          </div>
          <div>
            <label className={LABEL}>Koniec sezóny</label>
            <input type="text" value={form.seasonEnd} onChange={(e) => set('seasonEnd', e.target.value)} className={INPUT} placeholder="14.6.2026" />
          </div>
          <div>
            <label className={LABEL}>Zimná pauza od</label>
            <input type="text" value={form.winterBreakStart} onChange={(e) => set('winterBreakStart', e.target.value)} className={INPUT} placeholder="1.12.2025" />
          </div>
          <div>
            <label className={LABEL}>Zimná pauza do</label>
            <input type="text" value={form.winterBreakEnd} onChange={(e) => set('winterBreakEnd', e.target.value)} className={INPUT} placeholder="28.2.2026" />
          </div>
        </div>
      </div>

      <button type="submit" disabled={saving}
        className="bg-yellow-400 text-slate-950 px-6 py-2.5 rounded-lg text-sm font-black uppercase tracking-widest hover:bg-yellow-300 disabled:opacity-50 transition-colors">
        {saving ? 'Ukladám...' : 'Uložiť sezónu'}
      </button>
    </form>
  )
}
