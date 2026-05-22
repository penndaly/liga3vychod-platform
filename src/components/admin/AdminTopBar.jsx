import { Link } from 'react-router-dom'
import { LogOut, ExternalLink } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function AdminTopBar() {
  const { user, logout } = useAuth()

  return (
    <header className="h-16 bg-slate-900 border-b-4 border-yellow-400 flex items-center justify-between px-6 shrink-0 z-50">
      <Link to="/admin" className="flex items-center gap-1.5">
        <span className="text-yellow-400 font-black text-sm tracking-widest uppercase">TIPOS III.</span>
        <span className="text-white font-bold text-sm tracking-wide uppercase">Liga Východ</span>
        <span className="ml-3 text-slate-600 text-xs font-medium uppercase tracking-wider">Admin</span>
      </Link>

      <div className="flex items-center gap-4">
        <Link
          to="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ExternalLink size={12} />
          Verejná stránka
        </Link>
        <div className="hidden sm:block h-4 w-px bg-slate-700" />
        <span className="text-slate-400 text-xs hidden sm:block">{user?.email}</span>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Odhlásiť</span>
        </button>
      </div>
    </header>
  )
}
