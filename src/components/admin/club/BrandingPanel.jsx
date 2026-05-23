import { useState } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { Save, Palette } from 'lucide-react'
import { db } from '../../../services/firebase'
import { getClubBySlug } from '../../../config/clubs-config'

// Preset swatches for quick picking
const PRESETS = [
  '#1d4ed8', '#dc2626', '#ea580c', '#16a34a', '#7c3aed',
  '#b91c1c', '#0369a1', '#1e3a8a', '#d97706', '#15803d',
  '#be123c', '#2563eb', '#9f1239', '#6366f1', '#0f172a',
  '#facc15', '#f97316', '#14b8a6', '#8b5cf6', '#ec4899',
]

function ColorSwatch({ hex, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(hex)}
      className="w-8 h-8 rounded-lg transition-all border-2 shrink-0"
      style={{
        background:   hex,
        borderColor:  selected ? '#fff' : 'transparent',
        boxShadow:    selected ? `0 0 0 2px ${hex}` : 'none',
        transform:    selected ? 'scale(1.15)' : 'scale(1)',
      }}
      title={hex}
    />
  )
}

function PreviewBadge({ color, short }) {
  return (
    <div className="flex items-center gap-3 bg-slate-800/60 rounded-xl p-4">
      {/* Circle badge */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
        style={{ background: color }}
      >
        {short}
      </div>

      {/* Accent line */}
      <div className="flex-1 space-y-1.5">
        <div className="h-2 rounded-full" style={{ background: color, width: '60%' }} />
        <div className="h-1.5 bg-slate-700 rounded-full w-full" />
        <div className="h-1.5 bg-slate-700/50 rounded-full" style={{ width: '40%' }} />
      </div>

      {/* Active nav item preview */}
      <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-1.5 border-l-2" style={{ borderLeftColor: color }}>
        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
        <div className="h-2 bg-slate-700 rounded w-12" />
      </div>
    </div>
  )
}

export default function BrandingPanel({ data, clubSlug, clubColor: initialColor = '#facc15' }) {
  const { club, profile } = data
  const clubId    = club?.id
  const configClub = getClubBySlug(clubSlug ?? '')

  const [color, setColor]   = useState(profile?.primaryColor ?? initialColor)
  const [custom, setCustom] = useState(profile?.primaryColor ?? initialColor)
  const [saving, setSaving] = useState(false)

  function pick(hex) {
    setColor(hex)
    setCustom(hex)
  }

  async function handleSave() {
    if (!clubId) return
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'clubs', String(clubId)),
        { primaryColor: color, updatedAt: serverTimestamp() },
        { merge: true }
      )
      toast.success('Farba uložená')
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 max-w-xl">

      {/* Current color + preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Palette size={14} style={{ color }} />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Primárna farba klubu</h3>
        </div>

        <PreviewBadge color={color} short={configClub?.short ?? club?.short ?? '?'} />

        <p className="text-xs text-slate-600">
          Farba sa používa na odznaky, akcenty a aktívne prvky v portáli klubu.
        </p>
      </div>

      {/* Swatches */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Výber farby</h3>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((hex) => (
            <ColorSwatch key={hex} hex={hex} selected={color === hex} onClick={pick} />
          ))}
        </div>

        {/* Custom hex / color picker */}
        <div className="flex items-center gap-3 pt-1">
          <input
            type="color"
            value={custom}
            onChange={(e) => { setCustom(e.target.value); setColor(e.target.value) }}
            className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-slate-700 p-0.5"
            title="Vlastná farba"
          />
          <div className="flex-1">
            <input
              type="text"
              value={custom}
              maxLength={7}
              onChange={(e) => {
                const v = e.target.value
                setCustom(v)
                if (/^#[0-9a-fA-F]{6}$/.test(v)) setColor(v)
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-300 focus:outline-none focus:border-slate-500 transition-colors"
              placeholder="#1d4ed8"
            />
          </div>
          <div
            className="w-10 h-10 rounded-lg shrink-0 border border-slate-700"
            style={{ background: color }}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 text-sm font-black uppercase tracking-wide px-6 py-2.5 rounded-xl disabled:opacity-50 transition-colors"
        style={{ background: color, color: '#0f172a' }}
      >
        <Save size={14} />
        {saving ? 'Ukladám...' : 'Uložiť farbu'}
      </button>
    </div>
  )
}
