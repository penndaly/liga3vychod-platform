import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { Newspaper, ArrowRight } from 'lucide-react'
import { db } from '../../services/firebase'

const CAT_STYLE = {
  'výsledky':      'bg-green-500/20 text-green-400',
  'program':       'bg-blue-500/20 text-blue-400',
  'správy':        'bg-slate-700 text-slate-300',
  'prestup':       'bg-purple-500/20 text-purple-400',
  'disciplinárne': 'bg-red-500/20 text-red-400',
  'rozhovor':      'bg-yellow-400/20 text-yellow-400',
}

const CAT_LABEL = {
  'výsledky': 'Výsledky', 'program': 'Program', 'správy': 'Správy',
  'prestup': 'Prestup', 'disciplinárne': 'Disciplinárne', 'rozhovor': 'Rozhovor',
}

function formatDate(ts) {
  if (!ts) return ''
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' })
  } catch { return '' }
}

function SkeletonCard() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded overflow-hidden animate-pulse">
      <div className="h-1 bg-slate-700" />
      <div className="p-5 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-16 bg-slate-700 rounded" />
          <div className="h-4 w-12 bg-slate-700 rounded" />
        </div>
        <div className="h-4 w-full bg-slate-700 rounded" />
        <div className="h-4 w-4/5 bg-slate-700 rounded" />
        <div className="h-3 w-3/5 bg-slate-700 rounded" />
      </div>
    </div>
  )
}

export default function NewsSection() {
  const [articles, setArticles] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(
          query(collection(db, 'news'), where('status', '==', 'published'), orderBy('publishedAt', 'desc'), limit(3))
        ).catch(() =>
          getDocs(query(collection(db, 'news'), where('status', '==', 'published'), limit(3)))
        )
        setArticles(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } catch {
        // silently fail — section stays empty
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Newspaper size={14} className="text-yellow-400" />
          <h2 className="text-xs font-black uppercase tracking-widest text-yellow-400">Novinky</h2>
        </div>
        <Link to="/novinky" className="text-xs text-slate-600 hover:text-slate-300 uppercase tracking-wide transition-colors">
          Všetky →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : articles.length === 0
            ? (
              <div className="md:col-span-3 flex items-center justify-center py-12 text-slate-600 text-xs font-bold uppercase tracking-wide">
                Žiadne novinky
              </div>
            )
            : articles.map((article) => (
              <Link
                key={article.id}
                to={`/novinky/${article.slug}`}
                className="bg-slate-800 border border-slate-700 hover:border-yellow-400/50 rounded overflow-hidden transition-colors group"
              >
                <div className="h-1 bg-gradient-to-r from-yellow-400 to-green-600" />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${CAT_STYLE[article.category] ?? 'bg-slate-700 text-slate-400'}`}>
                      {CAT_LABEL[article.category] ?? article.category}
                    </span>
                    <span className="text-slate-600 text-xs">{formatDate(article.publishedAt)}</span>
                  </div>
                  <h3 className="text-white font-bold mb-2 leading-snug group-hover:text-yellow-400 transition-colors">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">{article.excerpt}</p>
                  )}
                  <div className="mt-4 flex items-center gap-1 text-green-500 text-xs font-bold uppercase tracking-wide">
                    Čítať viac <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            ))
        }
      </div>
    </section>
  )
}
