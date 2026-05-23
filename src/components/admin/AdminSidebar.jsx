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
} from 'lucide-react'

const NAV = [
  { label: 'Dashboard',              icon: LayoutDashboard, to: '/admin',              exact: true },
  { label: 'Zápasy & Výsledky',      icon: Calendar,        to: '/admin/fixtures' },
  { label: 'Import zápasov',         icon: Upload,          to: '/admin/import'   },
  { label: 'Live Match Centre',      icon: Radio,           to: '/admin/zapasy/live' },
  { label: 'Tabuľka',                icon: Trophy,          to: '/admin/standings' },
  { label: 'Kluby',                  icon: Shield,          to: '/admin/clubs' },
  { label: 'Novinky',                icon: Newspaper,       to: '/admin/news' },
  { label: 'Médiá',                  icon: Image,           to: '/admin/media' },
  { label: 'Používatelia',           icon: Users,           to: '/admin/users' },
  { label: 'Branding',               icon: Palette,         to: '/admin/branding' },
  { label: 'Sponzori',               icon: Star,            to: '/admin/sponsors' },
  { label: 'Ocenenia & Štatistiky',  icon: Target,          to: '/admin/awards' },
  { label: 'Disciplinárne',          icon: AlertTriangle,   to: '/admin/disciplinary' },
  { label: 'Rozhodcovia',            icon: UserCheck,       to: '/admin/referees' },
  { label: 'Nastavenia',             icon: Settings,        to: '/admin/settings' },
]

export default function AdminSidebar() {
  const location = useLocation()

  function isActive(item) {
    return item.exact
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to)
  }

  return (
    <aside className="w-60 shrink-0 overflow-y-auto bg-slate-100 p-3">
      <div className="bg-white rounded-2xl shadow-sm p-3">
        <nav className="space-y-0.5">
          {NAV.map((item) => {
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
