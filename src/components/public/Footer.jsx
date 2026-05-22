import { Globe, Mail, ExternalLink } from 'lucide-react'

const SECTIONS = ['Výsledky', 'Tabuľka', 'Kluby', 'Novinky', 'Štatistiky']

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="mb-3">
              <span className="text-yellow-400 font-black text-sm tracking-widest uppercase">
                TIPOS III.
              </span>
              <span className="text-white font-bold text-sm tracking-wide uppercase ml-2">
                Liga Východ
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Officiálna stránka TIPOS III. Ligy Východ — tretia najvyššia
              futbalová súťaž na východnom Slovensku.
            </p>
          </div>

          {/* Nav links */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
              Sekcie
            </h4>
            <ul className="space-y-2">
              {SECTIONS.map((label) => (
                <li key={label}>
                  <a
                    href="#"
                    className="text-sm text-slate-500 hover:text-white transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Sponsors + social */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
              Partneri
            </h4>
            <div className="flex items-center gap-2 mb-6">
              {['TIPOS', 'SFZ'].map((sponsor) => (
                <div
                  key={sponsor}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded text-slate-500 text-xs font-black uppercase tracking-widest"
                >
                  {sponsor}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4">
              {[Globe, Mail, ExternalLink].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="text-slate-600 hover:text-yellow-400 transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
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
