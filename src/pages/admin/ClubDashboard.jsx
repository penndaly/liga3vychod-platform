import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Newspaper, Film, Star, ShoppingBag,
  FileText, Palette, Radio, Share2, Settings,
  ExternalLink, ChevronDown, Loader, Shield,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useClubData } from '../../hooks/useClubData'
import { CLUBS } from '../../data/placeholder'
import DashboardPanel from '../../components/admin/club/DashboardPanel'

// ── Sidebar nav definition ─────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard', label: 'Dashboard',        icon: LayoutDashboard, built: true },
  { id: 'roster',    label: 'Prvý tím',          icon: Users,           built: false },
  { id: 'news',      label: 'Novinky',            icon: Newspaper,       built: false },
  { id: 'media',     label: 'Médiá',              icon: Film,            built: false },
  { id: 'academy',   label: 'Akadémia',           icon: Star,            built: false },
  { id: 'eshop',     label: 'E-Shop',             icon: ShoppingBag,     built: false },
  { id: 'pages',     label: 'Stránky',            icon: FileText,        built: false },
  { id: 'branding',  label: 'Branding',           icon: Palette,         built: false },
  { id: 'broadcast', label: 'Live Broadcast',     icon: Radio,           built: false },
  { id: 'social',    label: 'Sociálne siete',     icon: Share2,          built: false },
  { id: 'settings',  label: 'Nastavenia klubu',   icon: Settings,        built: false },
]

function ComingSoonPanel({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-slate-700">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mb-4">
        <Shield size={24} className="text-slate-600" />
      </div>
      <p className="text-sm font-black uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xs text-slate-700">Táto sekcia bude čoskoro dostupná</p>
    </div>
  )
}

function SwitchClubMenu({ currentSlug }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-300 border border-slate-700 rounded-lg px-3 py-1.5 transition-colors"
      >
        Prepnúť klub <ChevronDown size={11} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 min-w-[220px] max-h-72 overflow-y-auto">
            {CLUBS.map((c) => (
              <button
                key={c.slug}
                onClick={() => { navigate(`/admin/club/${c.slug}`); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                  c.slug === currentSlug
                    ? 'text-yellow-400 font-black bg-yellow-400/10'
                    : 'text-slate-300 hover:bg-slate-700/60 font-bold'
                }`}
              >
                <span className="text-xs text-slate-600 w-8 shrink-0 font-mono">{c.short}</span>
                {c.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function ClubDashboard() {
  const { clubSlug } = useParams()
  const { isSuperadmin } = useAuth()
  const [activeSection, setActiveSection] = useState('dashboard')
  const data = useClubData(clubSlug)

  const { club, profile, loading, error } = data
  const logoUrl  = profile?.logoUrl ?? null
  const clubName = profile?.name ?? club?.name ?? ''
  const standing = data.standings.find((s) => s.club === clubName)
  const pubClubId = club?.id

  if (!loading && error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 text-sm font-bold">{error}</p>
          <Link to="/admin/clubs" className="mt-3 text-yellow-400 text-sm font-bold hover:underline inline-block">
            ← Späť na kluby
          </Link>
        </div>
      </div>
    )
  }

  const activeNav = NAV.find((n) => n.id === activeSection)

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">

      {/* ── Top header ──────────────────────────────────────────────────── */}
      <header className="bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-5 px-5 h-16">

          {/* Back to league admin */}
          <Link to="/admin" className="text-slate-600 hover:text-slate-400 transition-colors shrink-0">
            <Shield size={18} className="text-yellow-400" />
          </Link>

          <div className="w-px h-6 bg-slate-800 shrink-0" />

          {/* Club badge */}
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
            {loading ? (
              <Loader size={12} className="text-slate-600 animate-spin" />
            ) : logoUrl ? (
              <img src={logoUrl} alt={clubName} className="w-full h-full object-contain p-1" />
            ) : (
              <span className="text-xs font-black text-yellow-400">{club?.short}</span>
            )}
          </div>

          {/* Club name + season */}
          <div className="min-w-0">
            <p className="text-sm font-black text-white truncate leading-tight">
              {loading ? <span className="text-slate-600">Načítavam...</span> : clubName}
            </p>
            <p className="text-xs text-slate-600 font-bold">Sezóna 2025/26</p>
          </div>

          {/* Quick stats */}
          {!loading && standing && (
            <div className="hidden sm:flex items-center gap-4 ml-4">
              <div className="text-center">
                <p className="text-xs font-black text-yellow-400">#{standing.pos}</p>
                <p className="text-[10px] text-slate-600 uppercase tracking-wide">Pozícia</p>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div className="text-center">
                <p className="text-xs font-black text-green-400">{standing.finalPts}</p>
                <p className="text-[10px] text-slate-600 uppercase tracking-wide">Body</p>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div className="text-center">
                <p className="text-xs font-black text-slate-300">{data.players.length}</p>
                <p className="text-[10px] text-slate-600 uppercase tracking-wide">Hráči</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {pubClubId && (
              <a
                href={`/kluby/${pubClubId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-300 border border-slate-700 rounded-lg px-3 py-1.5 transition-colors"
              >
                <ExternalLink size={11} /> Náhľad
              </a>
            )}
            {isSuperadmin && <SwitchClubMenu currentSlug={clubSlug} />}
          </div>
        </div>
      </header>

      {/* ── Body: sidebar + content ──────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar */}
        <aside className="w-56 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col py-3 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = activeSection === id
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition-all text-left ${
                  active
                    ? 'border-l-2 border-yellow-400 bg-yellow-400/8 text-yellow-400 pl-[14px]'
                    : 'border-l-2 border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <Icon size={15} className={active ? 'text-yellow-400' : 'text-slate-600'} />
                {label}
              </button>
            )
          })}

          {/* Bottom: back to full admin */}
          <div className="mt-auto pt-4 px-4 border-t border-slate-800 mt-4">
            <Link
              to="/admin/clubs"
              className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-400 transition-colors font-bold py-2"
            >
              ← Admin ligy
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {/* Section header */}
          <div className="px-6 py-5 border-b border-slate-800/60 flex items-center gap-3">
            {activeNav && (
              <>
                <activeNav.icon size={16} className="text-yellow-400 shrink-0" />
                <h1 className="text-sm font-black uppercase tracking-widest text-slate-300">
                  {activeNav.label}
                </h1>
              </>
            )}
          </div>

          <div className="p-6">
            {activeSection === 'dashboard' ? (
              <DashboardPanel data={data} />
            ) : (
              <ComingSoonPanel label={activeNav?.label ?? ''} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
