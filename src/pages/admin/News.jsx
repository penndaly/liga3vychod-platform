import { useState, useEffect, useMemo } from 'react'
import { Newspaper, Plus, Search, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { db } from '../../services/firebase'
import AdminLayout from '../../components/admin/AdminLayout'
import ArticleModal, { CATEGORIES } from '../../components/admin/news/ArticleModal'

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]))

function CategoryBadge({ value }) {
  const cat = CATEGORY_MAP[value]
  if (!cat) return <span className="text-xs text-slate-400">{value}</span>
  return <span className={`text-xs font-bold px-2 py-0.5 rounded ${cat.cls}`}>{cat.label}</span>
}

function StatusBadge({ status }) {
  return status === 'published'
    ? <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">Publikovaný</span>
    : <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">Koncept</span>
}

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

const STATUS_TABS = [
  { value: 'all',       label: 'Všetky' },
  { value: 'published', label: 'Publikované' },
  { value: 'draft',     label: 'Koncepty' },
]

export default function News() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'new' | article object

  const [statusTab, setStatusTab] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    try {
      const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setArticles(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch {
      // createdAt index may not exist yet — fallback without ordering
      try {
        const snap = await getDocs(collection(db, 'news'))
        setArticles(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } catch {
        toast.error('Chyba pri načítaní článkov')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(article) {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Odstrániť článok "${article.title}"?`)) return
    try {
      await deleteDoc(doc(db, 'news', article.id))
      toast.success('Článok odstránený')
      setArticles((prev) => prev.filter((a) => a.id !== article.id))
    } catch {
      toast.error('Chyba pri odstraňovaní')
    }
  }

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (statusTab !== 'all' && a.status !== statusTab) return false
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false
      if (search && !a.title?.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [articles, statusTab, categoryFilter, search])

  const publishedCount = articles.filter((a) => a.status === 'published').length
  const draftCount = articles.filter((a) => a.status === 'draft').length

  const TAB_CLS = (active) =>
    `px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
      active
        ? 'border-yellow-400 text-slate-900'
        : 'border-transparent text-slate-400 hover:text-slate-700'
    }`

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900">Novinky</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {articles.length} článkov · {publishedCount} publikovaných · {draftCount} konceptov
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-bold hover:bg-white transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Obnoviť</span>
            </button>
            <button
              onClick={() => setModal('new')}
              className="flex items-center gap-2 bg-yellow-400 text-slate-950 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-yellow-300 transition-colors"
            >
              <Plus size={15} /> Nový článok
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-xl border border-slate-100">
          {/* Status tabs */}
          <div className="flex border-b border-slate-100 px-4">
            {STATUS_TABS.map((t) => (
              <button key={t.value} onClick={() => setStatusTab(t.value)} className={TAB_CLS(statusTab === t.value)}>
                {t.label}
                {t.value === 'published' && publishedCount > 0 && (
                  <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">{publishedCount}</span>
                )}
                {t.value === 'draft' && draftCount > 0 && (
                  <span className="ml-1.5 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{draftCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* Search + category */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Hľadať článok..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-yellow-400 transition-colors"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-yellow-400 transition-colors bg-white font-bold"
            >
              <option value="all">Všetky kategórie</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-px px-4 pb-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300">
              <Newspaper size={36} className="mb-2" />
              <p className="text-sm font-bold">Žiadne články</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map((article) => (
                <div key={article.id} className="flex items-start gap-4 px-4 py-4 hover:bg-slate-50 transition-colors group">
                  {/* Cover thumbnail */}
                  <div className="w-16 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                    {article.coverUrl ? (
                      <img src={article.coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Newspaper size={16} className="text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate leading-snug">{article.title}</p>
                    {article.excerpt && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{article.excerpt}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <CategoryBadge value={article.category} />
                      <StatusBadge status={article.status} />
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{article.club}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{formatDate(article.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => setModal(article)}
                      className="text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(article)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <ArticleModal
          article={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </AdminLayout>
  )
}
