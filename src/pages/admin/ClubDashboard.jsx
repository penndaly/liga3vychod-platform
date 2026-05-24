import { useState } from 'react'
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { getClubBySlug, getClubByName } from '../../config/clubs-config'
import {
  LayoutDashboard, Users, Newspaper, Film, Star, ShoppingBag,
  FileText, Palette, Radio, Share2, Settings,
  ExternalLink, Loader, Shield, Lock,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useClubData } from '../../hooks/useClubData'
import ClubSwitcher from '../../components/admin/ClubSwitcher'
import DashboardPanel from '../../components/admin/club/DashboardPanel'
import RosterPanel    from '../../components/admin/club/RosterPanel'
import NewsPanel      from '../../components/admin/club/NewsPanel'
import MediaPanel     from '../../components/admin/club/MediaPanel'
import SettingsPanel   from '../../components/admin/club/SettingsPanel'
import BrandingPanel   from '../../components/admin/club/BrandingPanel'
import SocialPanel     from '../../components/admin/club/SocialPanel'
import AcademyPanel    from '../../components/admin/club/AcademyPanel'
import BroadcastPanel  from '../../components/admin/club/BroadcastPanel'
import EShopPanel      from '../../components/admin/club/EShopPanel'
import PagesPanel      from '../../components/admin/club/PagesPanel'

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


export default function ClubDashboard() {
  const { clubSlug } = useParams()
  const { isSuperadmin, userData, loading: authLoading } = useAuth()
  const navigate = useNavigate()
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

  // ── Access guard ─────────────────────────────────────────────────────
  // Wait for auth to resolve before checking. Show nothing to avoid flicker.
  if (authLoading) return null

  // Superadmin has unrestricted access. Club admins may only enter clubs
  // listed in their userData.clubs array (stored as full club names).
  const userClubs = userData?.clubs ?? []
  const hasAccess = isSuperadmin || (configClub && userClubs.includes(configClub.name))

  if (!hasAccess) {
    const myClubName = userData?.clubs?.[0]
    const mySlug = myClubName ? getClubByName(myClubName)?.slug : null
    return <Navigate to={mySlug ? `/admin/clubs/${mySlug}` : '/admin/unauthorized'} replace />
  }
  // ─────────────────────────────────────────────────────────────────────

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
            {isSuperadmin && <ClubSwitcher currentSlug={clubSlug} />}
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
            const isAcademy = id === 'academy'
            const btnCls = `flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition-all text-left w-full ${
              active
                ? 'border-l-2 bg-white/5 text-white pl-[14px]'
                : 'border-l-2 border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            }`
            const btnStyle = active ? { borderLeftColor: clubColor } : {}
            const icon = (
              <Icon
                size={15}
                style={active ? { color: clubColor } : {}}
                className={active ? '' : 'text-slate-600'}
              />
            )
            const routeNav = isAcademy ? `/admin/clubs/${clubSlug}/akademia`
              : id === 'eshop'      ? `/admin/clubs/${clubSlug}/eshop`
              : id === 'broadcast'  ? `/admin/clubs/${clubSlug}/prenos`
              : null
            if (routeNav) {
              return (
                <button
                  key={id}
                  onClick={() => navigate(routeNav)}
                  className={btnCls}
                  style={btnStyle}
                >
                  {icon}{label}
                </button>
              )
            }
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={btnCls}
                style={btnStyle}
              >
                {icon}{label}
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
            ) : activeSection === 'roster' ? (
              <RosterPanel data={data} clubColor={clubColor} />
            ) : activeSection === 'news' ? (
              <NewsPanel data={data} clubColor={clubColor} />
            ) : activeSection === 'media' ? (
              <MediaPanel data={data} clubColor={clubColor} />
            ) : activeSection === 'academy' ? (
              <AcademyPanel data={data} clubColor={clubColor} />
            ) : activeSection === 'broadcast' ? (
              <BroadcastPanel data={data} clubColor={clubColor} />
            ) : activeSection === 'branding' ? (
              <BrandingPanel data={data} clubSlug={clubSlug} clubColor={clubColor} />
            ) : activeSection === 'social' ? (
              <SocialPanel data={data} clubColor={clubColor} />
            ) : activeSection === 'settings' ? (
              <SettingsPanel data={data} clubColor={clubColor} />
            ) : activeSection === 'eshop' ? (
              <EShopPanel data={data} clubColor={clubColor} />
            ) : activeSection === 'pages' ? (
              <PagesPanel data={data} clubColor={clubColor} />
            ) : (
              <ComingSoonPanel label={activeNav?.label ?? ''} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
