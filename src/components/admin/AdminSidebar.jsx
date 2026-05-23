import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  Radio,
  Upload,
  Trophy,
  Shield,
  Newspaper,
  Image,
  Users,
  Palette,
  Star,
  Target,
  AlertTriangle,
  UserCheck,
  Settings,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { CLUBS_2025_26 } from '../../config/clubs-config'

const NAV = [
  { label: 'Dashboard',             icon: LayoutDashboard, to: '/admin',               exact: true },
  { label: 'Zápasy & Výsledky',     icon: Calendar,        to: '/admin/fixtures',       superadminOnly: true },
  { label: 'Import zápasov',        icon: Upload,          to: '/admin/import',         superadminOnly: true },
  { label: 'Live Match Centre',     icon: Radio,           to: '/admin/zapasy/live' },
  { label: 'Tabuľka',               icon: Trophy,          to: '/admin/standings' },
  { label: 'Kluby',                 icon: Shield,          to: '/admin/clubs',          superadminOnly: true },
  { label: 'Novinky',               icon: Newspaper,       to: '/admin/news',           superadminOnly: true },
  { label: 'Médiá',                 icon: Image,           to: '/admin/media',          superadminOnly: true },
  { label: 'Používatelia',          icon: Users,           to: '/admin/users',          superadminOnly: true },
  { label: 'Branding',              icon: Palette,         to: '/admin/branding',       superadminOnly: true },
  { label: 'Sponzori',              icon: Star,            to: '/admin/sponsors',       superadminOnly: true },
  { label: 'Ocenenia & Štatistiky', icon: Target,          to: '/admin/awards' },
  { label: 'Disciplinárne',         icon: AlertTriangle,   to: '/admin/disciplinary',   superadminOnly: true },
  { label: 'Rozhodcovia',           icon: UserCheck,       to: '/admin/referees',       superadminOnly: true },
  { label: 'Nastavenia',            icon: Settings,        to: '/admin/settings',       superadminOnly: true },
]

export default function AdminSidebar() {
  const location = useLocation()
  const { userData } = useAuth()

  const isSuperadmin = userData?.role === 'SUPERADMIN'

  // For club admins: find the slug of their first assigned club
  const myClubSlug = !isSuperadmin && userData?.clubs?.length
    ? CLUBS_2025_26.find((c) => c.name === userData.clubs[0])?.slug ?? null
    : null

  const visibleNav = NAV.filter((item) => isSuperadmin || !item.superadminOnly)

  function isActive(item) {
    return item.exact
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to)
  }

  return (
    <aside className="w-60 shrink-0 overflow-y-auto bg-slate-100 p-3">
      <div className="bg-white rounded-2xl shadow-sm p-3">
        <nav className="space-y-0.5">
          {visibleNav.map((item) => {
            const active = isActive(item)
            const Icon = item.icon
            return (
              <div key={item.to} className="relative">
                {active && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-green-600 rounded-r" />
                )}
                <Link
                  to={item.to}
                  className={`flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-slate-50 text-green-700 font-bold'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium'
                  }`}
                >
                  <Icon
                    size={15}
                    className={active ? 'text-green-600' : 'text-slate-400'}
                  />
                  {item.label}
                </Link>
              </div>
            )
          })}
        </nav>

        {/* Club admin: shortcut to own club dashboard */}
        {myClubSlug && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 mb-1.5">
              Môj klub
            </p>
            <Link
              to={`/admin/clubs/${myClubSlug}`}
              className="flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
            >
              <ExternalLink size={15} className="text-slate-400" />
              {userData.clubs[0]}
            </Link>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-100 px-4">
          <p className="text-xs text-slate-400 font-medium mb-1.5">Sezóna 2025/26</p>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: '48%' }} />
          </div>
          <p className="text-xs text-slate-400 mt-1">22 / 46 kôl</p>
        </div>
      </div>
    </aside>
  )
}
