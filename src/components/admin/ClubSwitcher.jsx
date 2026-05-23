import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { CLUBS_2025_26 } from '../../config/clubs-config'

export default function ClubSwitcher({ currentSlug }) {
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
                <span className="w-4 h-4 rounded-full shrink-0" style={{ background: c.color }} />
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
