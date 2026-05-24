/**
 * LiveBroadcast.jsx
 *
 * Standalone club page at /admin/clubs/:clubSlug/prenos
 * Three tabs: Prenos (stream controls) | Overlay (graphics editor) | Nastavenia (stream settings)
 * Follows the same pattern as Academy.jsx and EShop.jsx.
 */

import { useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { Radio, Layers, Settings, Shield, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { getClubBySlug, getClubByName } from '../../../config/clubs-config'
import { useStreamStatus } from '../../../hooks/useStreamStatus'
import StreamControls from '../../../components/admin/StreamControls'
import OverlayEditor  from '../../../components/admin/OverlayEditor'
import StreamSettings from '../../../components/admin/StreamSettings'

const TABS = [
  { id: 'controls', label: 'Prenos',      icon: Radio   },
  { id: 'overlay',  label: 'Overlay',     icon: Layers  },
  { id: 'settings', label: 'Nastavenia',  icon: Settings },
]

export default function LiveBroadcast() {
  const { clubSlug } = useParams()
  const { isSuperadmin, userData, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('controls')

  // ── Access guard (same pattern as EShop.jsx) ──────────────────────────
  if (authLoading) return null

  const configClub = getClubBySlug(clubSlug)
  const clubColor  = configClub?.color ?? '#475569'
  const clubId     = configClub ? String(configClub.id) : null

  const userClubs = userData?.clubs ?? []
  const hasAccess = isSuperadmin || (configClub && userClubs.includes(configClub.name))

  if (!hasAccess) {
    const myClubName = userData?.clubs?.[0]
    const mySlug = myClubName ? getClubByName(myClubName)?.slug : null
    return <Navigate to={mySlug ? `/admin/clubs/${mySlug}` : '/admin/unauthorized'} replace />
  }
  // ─────────────────────────────────────────────────────────────────────

  if (!clubId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 text-sm font-bold">Klub nenájdený</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4 px-5 h-14">

          {/* Breadcrumb */}
          <Link
            to={`/admin/clubs/${clubSlug}`}
            className="flex items-center gap-1.5 text-slate-500 hover:text-yellow-400 transition-colors text-xs font-bold shrink-0"
          >
            <ArrowLeft size={13} />
            {configClub?.name ?? clubSlug}
          </Link>

          <div className="w-px h-5 bg-slate-800 shrink-0" />

          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: clubColor }}
          >
            <Radio size={13} className="text-white" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-black text-white leading-tight">Živý prenos</p>
            <p className="text-[11px] font-bold" style={{ color: clubColor }}>
              {configClub?.name ?? clubSlug}
            </p>
          </div>

          {/* Live badge (shown when stream is active) */}
          <LiveBadge clubId={clubId} />
        </div>

        {/* Club color accent line */}
        <div className="h-0.5 w-full" style={{ background: clubColor }} />
      </header>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <nav className="bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center px-5 gap-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                  active
                    ? 'text-white border-current'
                    : 'text-slate-600 border-transparent hover:text-slate-400'
                }`}
                style={active ? { borderBottomColor: clubColor, color: clubColor } : {}}
              >
                <Icon size={12} />
                {label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'controls' && (
          <div className="p-6 max-w-2xl">
            <StreamControls clubId={clubId} clubColor={clubColor} />
          </div>
        )}

        {/* Overlay editor uses its own full-width layout */}
        {activeTab === 'overlay' && (
          <OverlayEditor clubId={clubId} clubColor={clubColor} />
        )}

        {activeTab === 'settings' && (
          <div className="p-6">
            <StreamSettings clubId={clubId} clubColor={clubColor} />
          </div>
        )}
      </main>
    </div>
  )
}

// ── Inline live badge (reads stream status for the header) ───────────────
function LiveBadge({ clubId }) {
  const { isLive, loading } = useStreamStatus(clubId)
  if (loading || !isLive) return null
  return (
    <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
      </span>
      <span className="text-[11px] font-black tracking-[0.2em] text-red-400 uppercase">Live</span>
    </div>
  )
}
