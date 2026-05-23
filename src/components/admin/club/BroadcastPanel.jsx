import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { Radio, ExternalLink, Save, Loader } from 'lucide-react'
import { db } from '../../../services/firebase'

const INPUT = 'w-full bg-slate-800 border border-slate-700 focus:border-yellow-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors'
const LABEL = 'block text-xs font-black uppercase tracking-widest text-slate-500 mb-2'

const PLATFORMS = [
  { key: 'youtube',  label: 'YouTube Live',  placeholder: 'https://youtube.com/watch?v=...' },
  { key: 'facebook', label: 'Facebook Live', placeholder: 'https://facebook.com/...' },
  { key: 'twitch',   label: 'Twitch',        placeholder: 'https://twitch.tv/...' },
]

export default function BroadcastPanel({ data, clubColor = '#facc15' }) {
  const clubId = data.club?.id

  const [form,    setForm]    = useState({ isLive: false, youtube: '', facebook: '', twitch: '', notes: '' })
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    if (!clubId) return
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'clubs', String(clubId)))
        const bc = snap.data()?.broadcast ?? {}
        setForm({
          isLive:   bc.isLive   ?? false,
          youtube:  bc.youtube  ?? '',
          facebook: bc.facebook ?? '',
          twitch:   bc.twitch   ?? '',
          notes:    bc.notes    ?? '',
        })
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [clubId])

  async function handleSave() {
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'clubs', String(clubId)),
        { broadcast: { ...form, updatedAt: serverTimestamp() } },
        { merge: true }
      )
      toast.success('Broadcast nastavenia uložené')
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  const set = (f, v) => setForm((prev) => ({ ...prev, [f]: v }))
  const activePlatformUrl = form.youtube || form.facebook || form.twitch

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size={20} className="animate-spin text-slate-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-xl">

      {/* Live status toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-white mb-1">Stav vysielania</p>
          <p className="text-xs text-slate-500">
            {form.isLive ? 'Live badge sa zobrazí na webe' : 'Klub nie je momentálne live'}
          </p>
        </div>
        <button
          onClick={() => set('isLive', !form.isLive)}
          className={`relative w-14 h-7 rounded-full transition-colors shrink-0 ${form.isLive ? 'bg-red-500' : 'bg-slate-700'}`}
        >
          <span
            className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${form.isLive ? 'translate-x-7' : 'translate-x-0.5'}`}
          />
        </button>
      </div>

      {form.isLive && activePlatformUrl && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <Radio size={14} className="text-red-400 animate-pulse" />
          <span className="text-sm font-bold text-red-400">Živé vysielanie je aktívne</span>
          <a href={activePlatformUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-red-400 hover:text-red-300">
            <ExternalLink size={14} />
          </a>
        </div>
      )}

      {/* Platform URLs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Stream URL</p>
        {PLATFORMS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className={LABEL}>{label}</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                className={INPUT}
              />
              {form[key] && (
                <a
                  href={form[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-11 bg-slate-800 border border-slate-700 rounded-xl text-slate-500 hover:text-slate-300 shrink-0 transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <label className={LABEL}>Poznámky pre divákov</label>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
          placeholder="Napr. komentár, čas začiatku, súper..."
          className={`${INPUT} resize-none`}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 text-xs font-black uppercase tracking-wide px-5 py-3 rounded-xl transition-colors disabled:opacity-50"
        style={{ background: clubColor, color: '#0f172a' }}
      >
        {saving ? <Loader size={13} className="animate-spin" /> : <Save size={13} />}
        {saving ? 'Ukladám...' : 'Uložiť nastavenia'}
      </button>
    </div>
  )
}
