import { Newspaper, ArrowRight } from 'lucide-react'
import { NEWS } from '../../data/placeholder'

const CATEGORY_STYLE = {
  Výsledky: 'bg-green-600/20 text-green-400',
  Program:  'bg-blue-600/20 text-blue-400',
  Liga:     'bg-yellow-400/20 text-yellow-400',
}

export default function NewsSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Newspaper size={14} className="text-yellow-400" />
          <h2 className="text-xs font-black uppercase tracking-widest text-yellow-400">
            Novinky
          </h2>
        </div>
        <a
          href="/novinky"
          className="text-xs text-slate-600 hover:text-slate-300 uppercase tracking-wide transition-colors"
        >
          Všetky →
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {NEWS.map((article) => (
          <article
            key={article.id}
            className="bg-slate-800 border border-slate-700 hover:border-yellow-400/50 rounded overflow-hidden transition-colors group cursor-pointer"
          >
            <div className="h-1 bg-gradient-to-r from-yellow-400 to-green-600" />
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                    CATEGORY_STYLE[article.category] ?? 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {article.category}
                </span>
                <span className="text-slate-600 text-xs">{article.date}</span>
              </div>
              <h3 className="text-white font-bold mb-2 leading-snug group-hover:text-yellow-400 transition-colors">
                {article.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">{article.excerpt}</p>
              <div className="mt-4 flex items-center gap-1 text-green-500 text-xs font-bold uppercase tracking-wide">
                Čítať viac <ArrowRight size={12} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
