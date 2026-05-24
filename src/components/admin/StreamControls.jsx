import { useState, useEffect, useRef } from 'react'
import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useStreamStatus } from '../../hooks/useStreamStatus'
import {
  Play, Pause, Square, Eye, Copy, Check,
  Clock, WifiOff, Wifi, ChevronDown,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDuration(secs) {
  if (!secs || secs < 0) return '00:00:00'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

function CopyField({ label, value, secret }) {
  const [show,   setShow]   = useState(false)
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1.5">{label}</p>
      <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2.5">
        <code className="flex-1 font-mono text-[11px] text-slate-300 truncate min-w-0">
          {secret && !show ? '••••••••••••••••••••••' : (value || '—')}
        </code>
        {secret && (
          <button
            onClick={() => setShow((s) => !s)}
            className="shrink-0 text-[10px] text-slate-600 hover:text-slate-400 font-bold transition-colors"
          >
            {show ? 'Skryť' : 'Zobraziť'}
          </button>
        )}
        <button
          onClick={copy}
          title="Kopírovať"
          className="shrink-0 p-1 text-slate-500 hover:text-yellow-400 transition-colors"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
        </button>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function StreamControls({ clubId, clubColor, selectedMatchId }) {
  const { isLive, isPaused, viewers, startedAt, loading } = useStreamStatus(clubId)
  const [elapsed,   setElapsed]   = useState(0)
  const [saving,    setSaving]    = useState(false)
  const [matchOpts, setMatchOpts] = useState([])
  const [matchSel,  setMatchSel]  = useState(selectedMatchId ?? '')
  const [streamUrl, setStreamUrl] = useState('')
  const [streamKey, setStreamKey] = useState('')
  const intervalRef = useRef(null)

  // ── Load settings for URL / key display ──────────────────────────────────
  useEffect(() => {
    if (!clubId) return
    getDoc(doc(db, 'clubs', clubId, 'broadcast', 'settings'))
      .then((snap) => {
        if (snap.exists()) {
          setStreamUrl(snap.data().streamIngestUrl ?? '')
          setStreamKey(snap.data().streamKey ?? '')
        }
      })
      .catch(() => {})
  }, [clubId])

  // ── Ticking duration counter ──────────────────────────────────────────────
  useEffect(() => {
    clearInterval(intervalRef.current)
    if (isLive && startedAt) {
      const base = startedAt.toDate ? startedAt.toDate() : new Date(startedAt)
      intervalRef.current = setInterval(() => {
        setElapsed(Math.max(0, Math.floor((Date.now() - base.getTime()) / 1000)))
      }, 1000)
    } else {
      setElapsed(0)
    }
    return () => clearInterval(intervalRef.current)
  }, [isLive, startedAt])

  // ── Stream document ref ───────────────────────────────────────────────────
  const streamRef = clubId ? doc(db, 'clubs', clubId, 'broadcast', 'stream') : null

  async function handleStartStream() {
    if (!streamRef) return
    setSaving(true)
    try {
      await setDoc(streamRef, {
        status:       'live',
        startedAt:    serverTimestamp(),
        currentMatch: matchSel || null,
        viewerCount:  0,
        streamUrl,
        streamKey,
        updatedAt:    serverTimestamp(),
      }, { merge: true })
      toast.success('Prenos spustený')
    } catch {
      toast.error('Chyba pri spúšťaní prenosu')
    } finally {
      setSaving(false)
    }
  }

  async function handlePause() {
    if (!streamRef) return
    setSaving(true)
    try {
      await updateDoc(streamRef, {
        status:    isPaused ? 'live' : 'paused',
        updatedAt: serverTimestamp(),
      })
      toast.success(isPaused ? 'Prenos obnovený' : 'Prenos pozastavený')
    } catch {
      toast.error('Chyba')
    } finally {
      setSaving(false)
    }
  }

  async function handleEndStream() {
    if (!streamRef) return
    // eslint-disable-next-line no-alert
    if (!window.confirm('Naozaj chcete ukončiť živý prenos?')) return
    setSaving(true)
    try {
      await updateDoc(streamRef, {
        status:    'offline',
        endedAt:   serverTimestamp(),
        duration:  elapsed,
        updatedAt: serverTimestamp(),
      })
      toast.success('Prenos ukončený')
    } catch {
      toast.error('Chyba pri ukončovaní prenosu')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-5 h-5 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5">

      {/* ── Status badge ── */}
      <div className="flex flex-col items-center justify-center py-12 bg-slate-900 border border-slate-800 rounded-2xl gap-5">
        {isLive ? (
          <>
            {/* Pulsing LIVE badge */}
            <div className="flex items-center gap-3 px-7 py-4 rounded-2xl bg-red-500/10 border border-red-500/25">
              <span className="relative flex h-3.5 w-3.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-red-500" />
              </span>
              <span className="text-2xl font-black tracking-[0.25em] text-red-400 leading-none">
                ŽIVÝ PRENOS
              </span>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1.5 text-sm text-slate-400">
                <Eye size={14} />
                <span className="font-bold text-slate-200">{viewers}</span>
                <span className="text-slate-600 text-xs">divákov</span>
              </div>
              <div className="w-px h-5 bg-slate-800" />
              <div className="flex items-center gap-1.5 text-sm text-slate-400">
                <Clock size={14} />
                <span className="font-mono font-bold text-slate-200 tabular-nums">
                  {formatDuration(elapsed)}
                </span>
              </div>
              {isPaused && (
                <>
                  <div className="w-px h-5 bg-slate-800" />
                  <span className="text-xs font-black text-yellow-400 uppercase tracking-widest">
                    Pozastavený
                  </span>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-600">
            <WifiOff size={28} className="text-slate-700" />
            <span className="text-base font-black tracking-[0.2em] uppercase">Offline</span>
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {isLive ? (
          <>
            <button
              onClick={handlePause}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-yellow-400 text-slate-950 text-sm font-black disabled:opacity-50 hover:bg-yellow-300 transition-colors"
            >
              {isPaused
                ? <><Play size={15} fill="currentColor" /> Obnoviť</>
                : <><Pause size={15} fill="currentColor" /> Pauza</>
              }
            </button>
            <button
              onClick={handleEndStream}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-black disabled:opacity-50 hover:bg-red-500/25 transition-colors"
            >
              <Square size={15} fill="currentColor" /> Ukončiť prenos
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            {/* Match selector */}
            <div className="w-full relative">
              <select
                value={matchSel}
                onChange={(e) => setMatchSel(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-yellow-400 transition-colors appearance-none pr-8"
              >
                <option value="">— Vybrať zápas (voliteľné) —</option>
                {matchOpts.map((m) => (
                  <option key={m.id} value={m.id}>{m.home} vs {m.away}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            </div>
            <button
              onClick={handleStartStream}
              disabled={saving}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-white text-base font-black disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg"
              style={{ background: '#22c55e', boxShadow: '0 8px 24px rgba(34,197,94,.25)' }}
            >
              <Wifi size={18} /> Spustiť prenos
            </button>
          </div>
        )}
      </div>

      {/* ── OBS connection info ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            OBS / Streaming softvér
          </p>
          <a
            href="/admin"
            className="text-[10px] font-bold text-slate-600 hover:text-yellow-400 transition-colors"
            onClick={(e) => { e.preventDefault(); window.open('https://obsproject.com', '_blank') }}
          >
            Stiahnuť OBS →
          </a>
        </div>
        <CopyField label="Server URL" value={streamUrl || 'rtmp://— nakonfigurujte v Nastaveniach —'} />
        <CopyField label="Stream Key" value={streamKey || '— nakonfigurujte v Nastaveniach —'} secret />

        {(!streamUrl || !streamKey) && (
          <p className="text-[11px] text-yellow-500/70 bg-yellow-400/5 border border-yellow-400/15 rounded-lg px-3 py-2">
            Zadajte Server URL a Stream Key v záložke <strong>Nastavenia</strong>.
          </p>
        )}
      </div>
    </div>
  )
}
