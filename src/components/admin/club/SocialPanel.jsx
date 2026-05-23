import { useState } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { Save, ExternalLink } from 'lucide-react'
import { db } from '../../../services/firebase'

const PLATFORMS = [
  {
    key:         'facebook',
    label:       'Facebook',
    placeholder: 'https://facebook.com/fkhumenne',
    icon:        'f',
    color:       '#1877f2',
  },
  {
    key:         'instagram',
    label:       'Instagram',
    placeholder: 'https://instagram.com/fkhumenne',
    icon:        '◎',
    color:       '#e1306c',
  },
  {
    key:         'twitter',
    label:       'X / Twitter',
    placeholder: 'https://x.com/fkhumenne',
    icon:        '𝕏',
    color:       '#000000',
  },
  {
    key:         'youtube',
    label:       'YouTube',
    placeholder: 'https://youtube.com/@fkhumenne',
    icon:        '▶',
    color:       '#ff0000',
  },
  {
    key:         'tiktok',
    label:       'TikTok',
    placeholder: 'https://tiktok.com/@fkhumenne',
    icon:        '♪',
    color:       '#010101',
  },
]

const INPUT = 'flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-slate-500 transition-colors placeholder:text-slate-600'

export default function SocialPanel({ data, clubColor = '#facc15' }) {
  const { club, profile } = data
  const clubId = club?.id
  const saved  = profile?.social ?? {}

  const [links, setLinks] = useState({
    facebook:  saved.facebook  ?? '',
    instagram: saved.instagram ?? '',
    twitter:   saved.twitter   ?? '',
    youtube:   saved.youtube   ?? '',
    tiktok:    saved.tiktok    ?? '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setLinks((p) => ({ ...p, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!clubId) return
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'clubs', String(clubId)),
        { social: links, updatedAt: serverTimestamp() },
        { merge: true }
      )
      toast.success('Sociálne siete uložené')
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  const filled = Object.values(links).filter(Boolean).length

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Sociálne siete</h3>
          <span className="text-xs text-slate-600 font-bold">{filled} / {PLATFORMS.length} vyplnených</span>
        </div>

        {PLATFORMS.map(({ key, label, placeholder, icon, color }) => {
          const val = links[key]
          return (
            <div key={key} className="flex items-center gap-3">
              {/* Platform icon */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                style={{ background: color }}
              >
                {icon}
              </div>

              {/* Input */}
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="url"
                  value={val}
                  onChange={(e) => set(key, e.target.value)}
                  className={INPUT}
                  placeholder={placeholder}
                />
                {val && (
                  <a
                    href={val}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 hover:text-slate-300 transition-colors shrink-0"
                    title={`Otvoriť ${label}`}
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 text-sm font-black uppercase tracking-wide px-6 py-2.5 rounded-xl disabled:opacity-50 transition-colors"
        style={{ background: clubColor, color: '#0f172a' }}
      >
        <Save size={14} />
        {saving ? 'Ukladám...' : 'Uložiť'}
      </button>
    </form>
  )
}
