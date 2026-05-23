import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { collection, getDocs, query, where, limit } from 'firebase/firestore'
import { ChevronLeft, Calendar, Tag, Loader } from 'lucide-react'
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

export default function ArticlePage() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(
          query(collection(db, 'news'), where('slug', '==', slug), where('active', '==', true), limit(1))
        )
        if (snap.empty) { setNotFound(true); return }
        setArticle({ id: snap.docs[0].id, ...snap.docs[0].data() })
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  const cat = article ? CAT_MAP[article.category] : null

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Back */}
        <Link to="/novinky" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-yellow-400 transition-colors mb-8">
          <ChevronLeft size={14} /> Všetky novinky
        </Link>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader size={24} className="text-slate-600 animate-spin" />
          </div>
        ) : notFound || !article ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-600">
            <p className="text-sm font-bold">Článok nenájdený.</p>
            <Link to="/novinky" className="mt-3 text-yellow-400 text-sm font-bold hover:underline">← Späť na novinky</Link>
          </div>
        ) : (
          <article className="space-y-6">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3">
              {cat && (
                <span className={`inline-flex items-center gap-1.5 text-xs font-black uppercase px-2.5 py-1 rounded-lg ${cat.cls}`}>
                  <Tag size={10} />
                  {cat.label}
                </span>
              )}
              {article.club && article.club !== 'Liga' && (
                <span className="text-xs font-bold text-slate-500">{article.club}</span>
              )}
              {article.publishedAt && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                  <Calendar size={10} />
                  {formatDate(article.publishedAt)}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">{article.title}</h1>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-lg text-slate-400 leading-relaxed border-l-2 border-yellow-400/40 pl-4">
                {article.excerpt}
              </p>
            )}

            {/* Cover */}
            {article.coverUrl && (
              <div className="rounded-2xl overflow-hidden border border-slate-800">
                <img src={article.coverUrl} alt={article.title} className="w-full object-cover max-h-[480px]" />
              </div>
            )}

            {/* Body */}
            {article.content ? (
              <div
                className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-slate-400 prose-a:text-yellow-400 prose-strong:text-white prose-li:text-slate-400"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            ) : (
              <p className="text-slate-500 text-sm italic">Obsah článku nie je k dispozícii.</p>
            )}

            {/* Footer separator */}
            <div className="border-t border-slate-800 pt-6">
              <Link to="/novinky"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-yellow-400 transition-colors">
                <ChevronLeft size={13} /> Ďalšie novinky
              </Link>
            </div>
          </article>
        )}
      </div>

      <Footer />
    </div>
  )
}
