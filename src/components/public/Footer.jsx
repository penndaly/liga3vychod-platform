import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { Globe, Mail } from 'lucide-react'
import { db } from '../../services/firebase'

const NAV_LINKS = [
  { label: 'Výsledky',    to: '/vysledky' },
  { label: 'Tabuľka',     to: '/tabulka' },
  { label: 'Kluby',       to: '/kluby' },
  { label: 'Novinky',     to: '/novinky' },
  { label: 'Štatistiky',  to: '/statistiky' },
]

export default function Footer() {
  const [sponsors, setSponsors] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(
          query(collection(db, 'sponsors'), where('tier', 'in', ['title', 'gold']))
        )
        setSponsors(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } catch {
        // silently fail — show no sponsors
      }
    }
    load()
  }, [])

  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

          {/* Brand */}
          <div>
            <div className="mb-3">
              <span className="text-yellow-400 font-black text-sm tracking-widest uppercase">TIPOS III.</span>
              <span className="text-white font-bold text-sm tracking-wide uppercase ml-2">Liga Východ</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Officiálna stránka TIPOS III. Ligy Východ — tretia najvyššia
              futbalová súťaž na východnom Slovensku.
            </p>
            <div className="flex items-center gap-4 mt-5">
              <a href="mailto:liga3vychod@sfz.sk" className="text-slate-600 hover:text-yellow-400 transition-colors" aria-label="Email">
                <Mail size={16} />
              </a>
              <a href="https://sfz.sk" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-yellow-400 transition-colors" aria-label="SFZ">
                <Globe size={16} />
              </a>
            </div>
          </div>

          {/* Nav links */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Sekcie</h4>
            <ul className="space-y-2">
              {NAV_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-slate-500 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sponsors */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Partneri</h4>
            {sponsors.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {sponsors.map((s) => (
                  s.website ? (
                    <a
                      key={s.id}
                      href={s.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={s.name}
                      className="h-10 px-3 bg-slate-800 border border-slate-700 hover:border-slate-500 rounded flex items-center justify-center transition-colors"
                    >
                      {s.logoUrl
                        ? <img src={s.logoUrl} alt={s.name} className="h-6 object-contain" />
                        : <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{s.name}</span>
                      }
                    </a>
                  ) : (
                    <div
                      key={s.id}
                      title={s.name}
                      className="h-10 px-3 bg-slate-800 border border-slate-700 rounded flex items-center justify-center"
                    >
                      {s.logoUrl
                        ? <img src={s.logoUrl} alt={s.name} className="h-6 object-contain" />
                        : <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{s.name}</span>
                      }
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="flex gap-2">
                {['TIPOS', 'SFZ'].map((name) => (
                  <div key={name} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded text-slate-500 text-xs font-black uppercase tracking-widest">
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-700">
          <span>© 2025 TIPOS III. Liga Východ. Všetky práva vyhradené.</span>
          <span>Sezóna 2025/26</span>
        </div>
      </div>
    </footer>
  )
}
