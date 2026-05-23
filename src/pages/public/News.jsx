import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { Newspaper, Search, ChevronRight } from 'lucide-react'
import { db } from '../../services/firebase'
import Navbar from '../../components/public/Navbar'
import Footer from '../../components/public/Footer'

const CATEGORIES = [
  { value: 'výsledky',      label: 'Výsledky',      cls: 'bg-green-500/20 text-green-400' },
  { value: 'program',       label: 'Program',        cls: 'bg-blue-500/20 text-blue-400' },
  { value: 'správy',        label: 'Správy',         cls: 'bg-slate-700 text-slate-300' },
  { value: 'prestup',       label: 'Prestup',        cls: 'bg-purple-500/20 text-purple-400' },
  { value: 'disciplinárne', label: 'Disciplinárne',  cls: 'bg-red-500/20 text-red-400' },
  { value: 'rozhovor',      label: 'Rozhovor',       cls: 'bg-yellow-400/20 text-yellow-400' },
]
const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]))

function formatDate(ts) {
  if (!ts) return ''
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return ''
  }
}

function ArticleCard({ article, featured = false }) {
  const cat = CAT_MAP[article.category]
  return (
    <Link
      to={`/novinky/${article.slug}`}
      className={`group bg-slate-900 border border-slate-800 hover:border-yellow-400/40 rounded-2xl overflow-hidden transition-all flex flex-col ${
        featured ? 'md:flex-row md:col-span-2' : ''
      }`}
    >
      {/* Cover */}
      {article.coverUrl ? (
        <div className={`overflow-hidden shrink-0 ${featured ? 'md:w-72 h-48 md:h-auto' : 'h-44'}`}>
          <img
            src={article.coverUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className={`shrink-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center ${featured ? 'md:w-72 h-48 md:h-auto' : 'h-44'}`}>
          <Newspaper size={28} className="text-slate-700" />
        </div>
      )}

      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {cat && (
            <span className={`text-xs font-black uppercase px-2 py-0.5 rounded ${cat.cls}`}>
              {cat.label}
            </span>
          )}
          {article.club && article.club !== 'Liga' && (
            <span className="text-xs text-slate-600 font-bold">{article.club}</span>
          )}
          <span className="text-xs text-slate-600 ml-auto">{formatDate(article.publishedAt)}</span>
        </div>

        <div className="flex-1">
          <h2 className={`font-black text-white group-hover:text-yellow-400 transition-colors leading-snug ${featured ? 'text-xl' : 'text-base'}`}>
            {article.title}
          </h2>
          {article.excerpt && (
            <p className="text-slate-400 text-sm mt-2 leading-relaxed line-clamp-3">{article.excerpt}</p>
          )}
        </div>

        <div className="flex items-center gap-1 text-green-500 text-xs font-bold uppercase tracking-wide">
          Čítať viac <ChevronRight size={12} />
        </div>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-44 bg-slate-800" />
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-slate-800 rounded" />
          <div className="h-5 w-20 bg-slate-800 rounded ml-auto" />
        </div>
        <div className="h-5 w-full bg-slate-800 rounded" />
        <div className="h-4 w-4/5 bg-slate-800 rounded" />
        <div className="h-4 w-3/5 bg-slate-800 rounded" />
      </div>
    </div>
  )
}

export default function NewsPage() {
  const [articles,  setArticles]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [activecat, setActiveCat] = useState('all')

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(
          query(collection(db, 'news'), where('active', '==', true), orderBy('publishedAt', 'desc'))
        )
        setArticles(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } catch {
        // silently fall back to empty
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = articles
    if (activecat !== 'all') list = list.filter((a) => a.category === activecat)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((a) =>
        a.title?.toLowerCase().includes(q) || a.excerpt?.toLowerCase().includes(q)
      )
    }
    return list
  }, [articles, activecat, search])

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      {/* Hero strip */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 mb-1">
            <Newspaper size={13} className="text-yellow-400" />
            <span className="text-xs font-black uppercase tracking-widest text-yellow-400">Novinky</span>
          </div>
          <h1 className="text-3xl font-black text-white">Správy z ligy</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hľadať..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-yellow-400 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition-colors"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveCat('all')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                activecat === 'all'
                  ? 'bg-yellow-400 text-slate-950'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-600'
              }`}
            >
              Všetky
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setActiveCat(c.value)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                  activecat === c.value
                    ? 'bg-yellow-400 text-slate-950'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-600">
            <Newspaper size={36} className="mb-3 opacity-30" />
            <p className="text-sm font-bold">Žiadne články</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((article, i) => (
              <ArticleCard key={article.id} article={article} featured={i === 0 && filtered.length > 1} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
