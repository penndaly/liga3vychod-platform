import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'

const NAV_LINKS = [
  { label: 'Výsledky',    to: '/vysledky' },
  { label: 'Tabuľka',    to: '/tabulka' },
  { label: 'Kluby',      to: '/kluby' },
  { label: 'Novinky',    to: '/novinky' },
  { label: 'Štatistiky', to: '/statistiky' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-1.5">
            <span className="text-yellow-400 font-black text-base tracking-widest uppercase">TIPOS III.</span>
            <span className="text-white font-bold text-base tracking-wide uppercase">Liga Východ</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-slate-400 hover:text-yellow-400 text-xs font-bold uppercase tracking-widest transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/admin"
              className="ml-2 px-4 py-1.5 border border-green-600 text-green-500 hover:bg-green-600 hover:text-white text-xs font-bold uppercase tracking-widest rounded transition-colors"
            >
              Admin
            </Link>
          </div>

          <button
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="block py-2 text-slate-400 hover:text-yellow-400 text-xs font-bold uppercase tracking-widest transition-colors"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
