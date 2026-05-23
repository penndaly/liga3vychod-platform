import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Newspaper, Film, Star, ShoppingBag,
  FileText, Palette, Radio, Share2, Settings,
  ExternalLink, ChevronDown, Loader, Shield,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useClubData } from '../../hooks/useClubData'
import { CLUBS_2025_26, getClubBySlug } from '../../config/clubs-config'
import DashboardPanel from '../../components/admin/club/DashboardPanel'

const NAV = [
  { id: 'dashboard', label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'roster',    label: 'Prvý tím',        icon: Users           },
  { id: 'news',      label: 'Novinky',          icon: Newspaper       },
  { id: 'media',     label: 'Médiá',            icon: Film            },
  { id: 'academy',   label: 'Akadémia',         icon: Star            },
  { id: 'eshop',     label: 'E-Shop',           icon: ShoppingBag     },
  { id: 'pages',     label: 'Stránky',          icon: FileText        },
  { id: 'branding',  label: 'Branding',         icon: Palette         },
  { id: 'broadcast', label: 'Live Broadcast',   icon: Radio           },
  { id: 'social',    label: 'Sociálne siete',   icon: Share2          },
  { id: 'settings',  label: 'Nastavenia klubu', icon: Settings        },
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

function ClubBadge({ club, logoUrl, loading }) {
  const color = club?.color ?? '#475569'
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden shrink-0 border-2"
      style={{ background: color, borderColor: color }}
    >
      {loading ? (
        <Loader size={12} className="text-white animate-spin" />
      ) : logoUrl ? (
        <img src={logoUrl} alt={club?.name} className="w-full h-full object-contain p-0.5" />
      ) : (
        <span className="text-[10px] font-black text-white leading-none">{club?.short}</span>
      )}
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
          <div className="absolute right-0 top-full mt-1 z-20 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 min-w-[240px] max-h-72 overflow-y-auto">
            {CLUBS_2025_26.map((c) => (
              <button
                key={c.slug}
                onClick={() => { navigate(`/admin/clubs/${c.slug}`); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3 ${
                  c.slug === currentSlug
                    ? 'font-black bg-white/8'
                    : 'text-slate-300 hover:bg-slate-700/60 font-bold'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ background: c.color }}
                />
                <span className="text-xs text-slate-500 w-8 shrink-0 font-mono">{c.short}</span>
                <span className={c.slug === currentSlug ? 'text-white' : ''}>{c.name}</span>
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

  // Merge static color from config with runtime data
  const configClub = getClubBySlug(clubSlug)
  const clubColor  = configClub?.color ?? '#475569'
  const logoUrl    = profile?.logoUrl ?? null
  const clubName   = profile?.name ?? club?.name ?? ''
  const standing   = data.standings.find((s) => s.club === clubName)
  const pubClubId  = club?.id

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
        <div className="flex items-center gap-4 px-5 h-16">

          {/* Back to league admin */}
          <Link to="/admin" className="shrink-0 text-slate-600 hover:text-yellow-400 transition-colors">
            <Shield size={18} />
          </Link>

          <div className="w-px h-6 bg-slate-800 shrink-0" />

          {/* Club badge */}
          <ClubBadge
            club={configClub}
            logoUrl={logoUrl}
            loading={loading}
          />

          {/* Club name + season */}
          <div className="min-w-0">
            <p className="text-sm font-black text-white truncate leading-tight">
              {loading ? <span className="text-slate-600">Načítavam…</span> : clubName}
            </p>
            <p className="text-xs font-bold" style={{ color: clubColor }}>
              Sezóna 2025/26
            </p>
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

        {/* Club color accent line */}
        <div className="h-0.5 w-full" style={{ background: clubColor }} />
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
                    ? 'border-l-2 bg-white/5 text-white pl-[14px]'
                    : 'border-l-2 border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
                style={active ? { borderLeftColor: clubColor } : {}}
              >
                <Icon
                  size={15}
                  style={active ? { color: clubColor } : {}}
                  className={active ? '' : 'text-slate-600'}
                />
                {label}
              </button>
            )
          })}

          <div className="mt-auto pt-4 px-4 border-t border-slate-800">
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
          <div className="px-6 py-5 border-b border-slate-800/60 flex items-center gap-3">
            {activeNav && (
              <>
                <activeNav.icon size={16} className="shrink-0" style={{ color: clubColor }} />
                <h1 className="text-sm font-black uppercase tracking-widest text-slate-300">
                  {activeNav.label}
                </h1>
              </>
            )}
          </div>

          <div className="p-6">
            {activeSection === 'dashboard' ? (
              <DashboardPanel data={data} clubColor={clubColor} />
            ) : (
              <ComingSoonPanel label={activeNav?.label ?? ''} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
