/**
 * ClipMarker.jsx
 *
 * Clip-marking UI for creating highlight reels during (or after) a live stream.
 * Clips are stored at clubs/{clubId}/clips/{clipId} with a streamId field.
 *
 * During a live stream the timestamp is derived from the running elapsed counter.
 * Outside a live stream a manual seconds input lets editors mark historical clips.
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import {
  collection, addDoc, onSnapshot, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy, where,
} from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { db } from '../../services/firebase'
import { useStreamStatus } from '../../hooks/useStreamStatus'
import {
  CircleDot, Square, Zap, AlertTriangle, Plus, Edit2, Trash2,
  Download, Clock, CheckCircle2, X, Loader, Film,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Clip type definitions ──────────────────────────────────────────────────
const CLIP_TYPES = [
  {
    type: 'goal',   label: 'Gól',     icon: CircleDot,
    color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.35)',
    timelineDot: '#22c55e',
  },
  {
    type: 'card',   label: 'Karta',   icon: Square,
    color: '#facc15', bg: 'rgba(250,204,21,0.12)', border: 'rgba(250,204,21,0.35)',
    timelineDot: '#facc15',
  },
  {
    type: 'chance', label: 'Šanca',   icon: Zap,
    color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.35)',
    timelineDot: '#38bdf8',
  },
  {
    type: 'foul',   label: 'Faul',    icon: AlertTriangle,
    color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)',
    timelineDot: '#f97316',
  },
  {
    type: 'custom', label: 'Vlastný', icon: Plus,
    color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.35)',
    timelineDot: '#a78bfa',
  },
]

const typeMap = Object.fromEntries(CLIP_TYPES.map((t) => [t.type, t]))

// ── Helpers ────────────────────────────────────────────────────────────────
function formatTime(secs) {
  if (!secs || secs < 0) return '0:00'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

// ── Timeline ───────────────────────────────────────────────────────────────
function Timeline({ clips, elapsed, isLive }) {
  const duration = Math.max(elapsed, 1)
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Časová os
        </span>
        <span className="text-[11px] font-mono text-slate-400 tabular-nums">
          {formatTime(elapsed)}
          {isLive && (
            <span className="ml-2 text-red-400 font-black text-[10px] uppercase tracking-wider">● Live</span>
          )}
        </span>
      </div>

      {/* Track */}
      <div className="relative h-8 bg-slate-800 rounded-full overflow-visible">
        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{
            width: isLive ? '100%' : `${Math.min((elapsed / duration) * 100, 100)}%`,
            background: 'linear-gradient(to right, rgba(99,102,241,0.3), rgba(99,102,241,0.15))',
          }}
        />

        {/* Clip markers */}
        {clips.map((clip) => {
          const pct = Math.min((clip.timestamp / duration) * 100, 99.5)
          const cfg = typeMap[clip.type] ?? typeMap.custom
          return (
            <div
              key={clip.id}
              title={`${clip.label} — ${formatTime(clip.timestamp)}`}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-slate-900 cursor-pointer hover:scale-150 transition-transform z-10"
              style={{ left: `${pct}%`, background: cfg.timelineDot }}
            />
          )
        })}

        {/* Live playhead pin */}
        {isLive && (
          <div className="absolute right-0 top-0 h-full w-0.5 bg-red-500">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500" />
          </div>
        )}
      </div>

      {/* Legend */}
      {clips.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {CLIP_TYPES.filter((t) => clips.some((c) => c.type === t.type)).map((t) => (
            <span key={t.type} className="flex items-center gap-1 text-[10px] font-bold" style={{ color: t.color }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: t.color }} />
              {clips.filter((c) => c.type === t.type).length}× {t.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Quick mark bar ─────────────────────────────────────────────────────────
function QuickMarks({ onMark, disabled }) {
  const [showCustom, setShowCustom] = useState(false)
  const [customLabel, setCustomLabel] = useState('')
  const inputRef = useRef(null)

  function handleCustomSubmit(e) {
    e.preventDefault()
    const label = customLabel.trim()
    if (!label) return
    onMark('custom', label)
    setCustomLabel('')
    setShowCustom(false)
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
        Rýchle označenie
      </p>
      <div className="flex flex-wrap gap-2">
        {CLIP_TYPES.slice(0, 4).map(({ type, label, icon: Icon, color, bg, border }) => (
          <button
            key={type}
            onClick={() => onMark(type, label)}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-black border transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
            style={{ color, background: bg, borderColor: border }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}

        {/* Custom mark */}
        {showCustom ? (
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-1">
            <input
              ref={inputRef}
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="Popis momentu…"
              autoFocus
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-400 w-40"
            />
            <button
              type="submit"
              disabled={!customLabel.trim() || disabled}
              className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-400/30 text-purple-400 hover:bg-purple-500/25 disabled:opacity-40 transition-colors"
            >
              <CheckCircle2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => { setShowCustom(false); setCustomLabel('') }}
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={14} />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowCustom(true)}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-black border transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
            style={{ color: '#a78bfa', background: 'rgba(167,139,250,0.12)', borderColor: 'rgba(167,139,250,0.35)' }}
          >
            <Plus size={15} />
            Vlastný
          </button>
        )}
      </div>
    </div>
  )
}

// ── Clip row ───────────────────────────────────────────────────────────────
function ClipRow({ clip, onDelete, onLabelChange }) {
  const [editing, setEditing] = useState(false)
  const [label,   setLabel]   = useState(clip.label)
  const [saving,  setSaving]  = useState(false)
  const cfg = typeMap[clip.type] ?? typeMap.custom

  async function saveLabel() {
    if (!label.trim() || label === clip.label) { setEditing(false); return }
    setSaving(true)
    try {
      await onLabelChange(clip.id, label.trim())
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors group"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      {/* Type icon */}
      <cfg.icon size={14} style={{ color: cfg.color, flexShrink: 0 }} />

      {/* Label — editable */}
      {editing ? (
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') saveLabel(); if (e.key === 'Escape') { setEditing(false); setLabel(clip.label) } }}
          autoFocus
          className="flex-1 bg-transparent border-b border-slate-600 text-xs text-white focus:outline-none focus:border-slate-400 min-w-0"
        />
      ) : (
        <span className="flex-1 text-xs font-bold text-slate-200 truncate min-w-0">
          {clip.label}
        </span>
      )}

      {/* Timestamp */}
      <span className="text-[11px] font-mono font-bold shrink-0" style={{ color: cfg.color }}>
        {formatTime(clip.timestamp)}
      </span>

      {/* Duration badge */}
      <span className="text-[10px] text-slate-600 shrink-0 hidden group-hover:inline">
        {clip.duration ?? 30}s
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {editing ? (
          <>
            <button
              onClick={saveLabel}
              disabled={saving}
              className="p-1.5 rounded-lg text-green-400 hover:bg-green-400/10 transition-colors"
            >
              {saving ? <Loader size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
            </button>
            <button
              onClick={() => { setEditing(false); setLabel(clip.label) }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={11} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Edit2 size={11} />
            </button>
            <button
              onClick={() => onDelete(clip.id)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={11} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ClipMarker({ clubId, clubColor }) {
  const { isLive, startedAt, loading: statusLoading } = useStreamStatus(clubId)

  // Elapsed ticker
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef(null)
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

  // Derive a stable streamId from startedAt (seconds-precision is sufficient)
  const streamId = startedAt
    ? (startedAt.seconds ?? Math.floor((startedAt.toDate?.()?.getTime() || 0) / 1000))
    : null

  // Manual timestamp input (used when not live)
  const [manualSecs, setManualSecs] = useState(0)
  const currentTimestamp = isLive ? elapsed : manualSecs

  // Clips from Firestore
  const [clips,    setClips]    = useState([])
  const [loadingC, setLoadingC] = useState(true)

  useEffect(() => {
    if (!clubId) return
    setLoadingC(true)
    const q = streamId
      ? query(
          collection(db, 'clubs', clubId, 'clips'),
          where('streamId', '==', String(streamId)),
          orderBy('timestamp', 'asc'),
        )
      : query(
          collection(db, 'clubs', clubId, 'clips'),
          orderBy('timestamp', 'asc'),
        )
    const unsub = onSnapshot(q, (snap) => {
      setClips(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoadingC(false)
    }, () => setLoadingC(false))
    return unsub
  }, [clubId, streamId])

  // Exporting state
  const [exporting, setExporting] = useState(false)

  // ── Mark a clip ──────────────────────────────────────────────────────────
  async function markClip(type, label) {
    if (!clubId) return
    const clip = {
      streamId: streamId ? String(streamId) : 'manual',
      type,
      label,
      timestamp:  currentTimestamp,
      duration:   30,
      createdAt:  serverTimestamp(),
    }
    try {
      await addDoc(collection(db, 'clubs', clubId, 'clips'), clip)
      toast.success(`✓ ${label} — ${formatTime(currentTimestamp)}`, { duration: 2000 })
    } catch {
      toast.error('Chyba pri označovaní clipu')
    }
  }

  // ── Delete a clip ────────────────────────────────────────────────────────
  async function deleteClip(clipId) {
    try {
      await deleteDoc(doc(db, 'clubs', clubId, 'clips', clipId))
      toast.success('Clip odstránený')
    } catch {
      toast.error('Chyba pri odstraňovaní')
    }
  }

  // ── Rename a clip ────────────────────────────────────────────────────────
  async function renameClip(clipId, newLabel) {
    await updateDoc(doc(db, 'clubs', clubId, 'clips', clipId), { label: newLabel })
  }

  // ── Export highlights ────────────────────────────────────────────────────
  async function exportHighlights() {
    if (clips.length === 0) return
    setExporting(true)
    try {
      const clipTimestamps = clips.map((c) => ({
        start:     Math.max(0, c.timestamp - 10),   // 10 s before
        end:       c.timestamp + 20,                 // 20 s after
        label:     c.label,
        type:      c.type,
      }))
      const fn = httpsCallable(getFunctions(), 'generateHighlightsVideo')
      const result = await fn({ streamId: String(streamId ?? 'manual'), clips: clipTimestamps, clubId })
      if (result.data?.success) {
        toast.success('Zostrihy sa generujú. Dostanete notifikáciu keď budú hotové.', { duration: 5000 })
      } else {
        toast.error(result.data?.error ?? 'Neznáma chyba')
      }
    } catch (err) {
      toast.error(`Export zlyhal: ${err.message}`)
    } finally {
      setExporting(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-2xl">

      {/* ── Status bar ── */}
      {!isLive && !statusLoading && (
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl">
          <Film size={14} className="text-slate-600 shrink-0" />
          <p className="text-xs text-slate-500 font-bold">
            Stream nie je aktívny — manuálne označenie momentov
          </p>
          <div className="ml-auto flex items-center gap-2">
            <Clock size={12} className="text-slate-600" />
            <input
              type="number"
              value={manualSecs}
              min={0}
              onChange={(e) => setManualSecs(Math.max(0, Number(e.target.value)))}
              className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono text-right focus:outline-none focus:border-yellow-400 transition-colors"
            />
            <span className="text-[10px] text-slate-600 font-bold">sek</span>
            <span className="text-[11px] font-mono text-slate-400">{formatTime(manualSecs)}</span>
          </div>
        </div>
      )}

      {/* ── Timeline ── */}
      <Timeline clips={clips} elapsed={currentTimestamp} isLive={isLive} />

      {/* ── Quick marks ── */}
      <QuickMarks onMark={markClip} disabled={statusLoading} />

      {/* ── Clips list ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Označené momenty
            {clips.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-md text-slate-950 text-[9px]"
                style={{ background: clubColor }}>
                {clips.length}
              </span>
            )}
          </p>
          {clips.length > 0 && (
            <span className="text-[10px] text-slate-600">
              ~{clips.length * 30}s zostrihu
            </span>
          )}
        </div>

        {loadingC ? (
          <div className="flex items-center justify-center py-8">
            <Loader size={16} className="animate-spin text-slate-600" />
          </div>
        ) : clips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 bg-slate-900/40 border border-slate-800/40 rounded-2xl text-slate-700">
            <Film size={22} className="mb-2" />
            <p className="text-xs font-bold">Zatiaľ žiadne označené momenty</p>
            <p className="text-[11px] mt-1">Použite tlačidlá vyššie na označenie kľúčových momentov</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {[...clips].reverse().map((clip) => (
              <ClipRow
                key={clip.id}
                clip={clip}
                onDelete={deleteClip}
                onLabelChange={renameClip}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Export button ── */}
      <button
        onClick={exportHighlights}
        disabled={clips.length === 0 || exporting}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-sm font-black border-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
        style={{
          background:   clips.length > 0 ? clubColor : 'transparent',
          borderColor:  clips.length > 0 ? clubColor : 'rgba(100,116,139,0.4)',
          color:        clips.length > 0 ? '#0f172a' : '#475569',
          boxShadow:    clips.length > 0 ? `0 8px 24px ${clubColor}33` : 'none',
        }}
      >
        {exporting
          ? <><Loader size={16} className="animate-spin" /> Generujem zostrihy…</>
          : <><Download size={16} /> Exportovať zostrihy ({clips.length})</>
        }
      </button>
    </div>
  )
}
