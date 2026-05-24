import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { Save, Loader, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Constants ─────────────────────────────────────────────────────────────
const DEFAULTS = {
  platform:        'youtube',
  resolution:      '1080p',
  bitrate:         'auto',
  frameRate:       '30',
  audioQuality:    '128',
  privacy:         'public',
  autoArchive:     true,
  chatEnabled:     true,
  streamIngestUrl: '',
  streamKey:       '',
  youtubeApiKey:   '',
}

const PLATFORMS = [
  { value: 'youtube',  label: 'YouTube Live',  ingestUrl: 'rtmp://a.rtmp.youtube.com/live2' },
  { value: 'facebook', label: 'Facebook Live',  ingestUrl: 'rtmps://live-api-s.facebook.com:443/rtmp/' },
  { value: 'twitch',   label: 'Twitch',          ingestUrl: 'rtmp://live.twitch.tv/app/' },
  { value: 'rtmp',     label: 'Custom RTMP',     ingestUrl: '' },
]

const RESOLUTIONS  = ['720p', '1080p', '4K']
const BITRATES     = [
  { value: 'auto',  label: 'Auto'       },
  { value: '2500',  label: '2 500 kbps' },
  { value: '5000',  label: '5 000 kbps' },
  { value: '8000',  label: '8 000 kbps' },
]
const FRAME_RATES  = [{ value: '30', label: '30 fps' }, { value: '60', label: '60 fps' }]
const AUDIO_OPTS   = [
  { value: '128', label: '128 kbps' },
  { value: '192', label: '192 kbps' },
  { value: '320', label: '320 kbps' },
]
const PRIVACY_OPTS = [
  { value: 'public',   label: 'Verejný'  },
  { value: 'unlisted', label: 'Unlisted' },
  { value: 'private',  label: 'Súkromný' },
]

// ── Small reusables ───────────────────────────────────────────────────────
const L = 'block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5'
const I = 'w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-yellow-400 transition-colors'

function Toggle({ label, desc, value, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-slate-800/60 last:border-0">
      <div>
        <p className="text-sm font-bold text-slate-300 leading-tight">{label}</p>
        {desc && <p className="text-[11px] text-slate-600 mt-0.5">{desc}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative shrink-0 w-10 h-6 rounded-full transition-colors mt-0.5 ${
          value ? 'bg-green-500' : 'bg-slate-700'
        }`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          value ? 'translate-x-4' : 'translate-x-0.5'
        }`} />
      </button>
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className={L}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={I}>
        {options.map(({ value: v, label: l }) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function StreamSettings({ clubId, clubColor }) {
  const [form,    setForm]    = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    if (!clubId) return
    getDoc(doc(db, 'clubs', clubId, 'broadcast', 'settings'))
      .then((snap) => {
        if (snap.exists()) setForm((prev) => ({ ...prev, ...snap.data() }))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [clubId])

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  // Auto-fill ingest URL when platform changes
  function handlePlatformChange(val) {
    const platform = PLATFORMS.find((p) => p.value === val)
    set('platform', val)
    if (platform?.ingestUrl) set('streamIngestUrl', platform.ingestUrl)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'clubs', clubId, 'broadcast', 'settings'),
        { ...form, updatedAt: serverTimestamp() },
        { merge: true }
      )
      toast.success('Nastavenia uložené')
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader size={18} className="animate-spin text-slate-600" />
    </div>
  )

  const activePlatform = PLATFORMS.find((p) => p.value === form.platform)

  return (
    <form onSubmit={handleSave} className="space-y-5 max-w-xl">

      {/* ── Platform ── */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <p className={L}>Platforma</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PLATFORMS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handlePlatformChange(value)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                form.platform === value
                  ? 'border-0 text-slate-950'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
              style={form.platform === value ? { background: clubColor } : {}}
            >
              {label}
            </button>
          ))}
        </div>

        {/* YouTube API integration note */}
        {form.platform === 'youtube' && (
          <div className="p-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`${L} mb-0.5`}>YouTube Data API v3</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Voliteľné — umožňuje automatické vytváranie live broadcasts priamo z tohto panelu.
                  Kľúč získate na Google Cloud Console.
                </p>
              </div>
              <a
                href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-yellow-400 hover:text-yellow-300"
              >
                <ExternalLink size={13} />
              </a>
            </div>
            <div>
              <label className={L}>YouTube API kľúč</label>
              <input
                type="password"
                value={form.youtubeApiKey ?? ''}
                onChange={(e) => set('youtubeApiKey', e.target.value)}
                placeholder="AIzaSy..."
                className={I}
                autoComplete="off"
              />
            </div>
          </div>
        )}
      </section>

      {/* ── OBS connection ── */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <p className={L}>Pripojenie pre OBS</p>
        <div>
          <label className={L}>Server URL (RTMP ingest)</label>
          <input
            type="url"
            value={form.streamIngestUrl}
            onChange={(e) => set('streamIngestUrl', e.target.value)}
            placeholder={activePlatform?.ingestUrl || 'rtmp://...'}
            className={I}
          />
          {activePlatform?.ingestUrl && form.streamIngestUrl !== activePlatform.ingestUrl && (
            <button
              type="button"
              onClick={() => set('streamIngestUrl', activePlatform.ingestUrl)}
              className="mt-1 text-[10px] text-yellow-400/70 hover:text-yellow-400 transition-colors font-bold"
            >
              Použiť predvolený URL pre {activePlatform.label}
            </button>
          )}
        </div>
        <div>
          <label className={L}>Stream Key</label>
          <input
            type="password"
            value={form.streamKey}
            onChange={(e) => set('streamKey', e.target.value)}
            placeholder="Váš stream key z platformy..."
            className={I}
            autoComplete="new-password"
          />
          <p className="mt-1 text-[10px] text-slate-600">
            Nájdete ho v nastaveniach live streamu na {activePlatform?.label ?? 'platforme'}.
          </p>
        </div>
      </section>

      {/* ── Quality ── */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <p className={L}>Kvalita videa</p>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Rozlíšenie"
            value={form.resolution}
            onChange={(v) => set('resolution', v)}
            options={RESOLUTIONS.map((r) => ({ value: r, label: r }))}
          />
          <Select
            label="Bitrate"
            value={form.bitrate}
            onChange={(v) => set('bitrate', v)}
            options={BITRATES}
          />
          <Select
            label="Frame rate"
            value={form.frameRate}
            onChange={(v) => set('frameRate', v)}
            options={FRAME_RATES}
          />
          <Select
            label="Kvalita zvuku"
            value={form.audioQuality}
            onChange={(v) => set('audioQuality', v)}
            options={AUDIO_OPTS}
          />
        </div>

        {/* Quality recommendation */}
        {form.resolution === '4K' && (
          <p className="text-[11px] text-yellow-500/70 bg-yellow-400/5 border border-yellow-400/15 rounded-lg px-3 py-2">
            4K vyžaduje min. 20 000 kbps upload. Odporúčaný bitrate: 8 000 kbps pre 1080p.
          </p>
        )}
      </section>

      {/* ── Privacy & archiving ── */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <p className={L}>Súkromie & Archív</p>
        <Select
          label="Viditeľnosť prenosu"
          value={form.privacy}
          onChange={(v) => set('privacy', v)}
          options={PRIVACY_OPTS}
        />
        <div className="border border-slate-800 rounded-xl px-2">
          <Toggle
            label="Auto-archív"
            desc="Záznam sa automaticky uloží po skončení prenosu"
            value={form.autoArchive}
            onChange={(v) => set('autoArchive', v)}
          />
          <Toggle
            label="Chat"
            desc="Povolí divácky chat počas živého prenosu"
            value={form.chatEnabled}
            onChange={(v) => set('chatEnabled', v)}
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 text-xs font-black uppercase tracking-wide px-5 py-3 rounded-xl transition-colors disabled:opacity-50"
        style={{ background: clubColor, color: '#0f172a' }}
      >
        {saving ? <Loader size={13} className="animate-spin" /> : <Save size={13} />}
        {saving ? 'Ukladám...' : 'Uložiť nastavenia'}
      </button>
    </form>
  )
}
