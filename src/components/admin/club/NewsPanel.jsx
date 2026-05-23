import { useState, useEffect, useCallback, useMemo } from 'react'
import { collection, getDocs, deleteDoc, doc, orderBy, query, where } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { Plus, Newspaper, Pencil, Trash2, Search, Loader } from 'lucide-react'
import { db } from '../../../services/firebase'
import ArticleModal, { CATEGORIES } from '../news/ArticleModal'

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]))

const STATUS_TABS = [
  { value: 'all',       label: 'Všetky' },
  { value: 'published', label: 'Publikované' },
  { value: 'draft',     label: 'Koncepty' },
]

function DarkCategoryBadge({ value }) {
  const cat = CATEGORY_MAP[value]
  if (!cat) return <span className="text-xs text-slate-500">{value}</span>
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-700/60 text-slate-300">
      {cat.label}
    </span>
  )
}

function StatusDot({ status }) {
  return status === 'published'
    ? <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
    : <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
}

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

export default function NewsPanel({ data, clubColor = '#facc15' }) {
  const clubName = data.club?.name
  const [articles, setArticles] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null) // null | 'new' | article object
  const [tab,      setTab]      = useState('all')
  const [search,   setSearch]   = useState('')

  const load = useCallback(async () => {
    if (!clubName) return
    setLoading(true)
    try {
      const q = query(
        collection(db, 'news'),
        where('club', '==', clubName),
        orderBy('createdAt', 'desc'),
      )
      const snap = await getDocs(q).catch(async () => {
        // fallback if index missing
        const s2 = await getDocs(query(collection(db, 'news'), where('club', '==', clubName)))
        return s2
      })
      setArticles(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch {
      toast.error('Chyba pri načítaní noviniek')
    } finally {
      setLoading(false)
    }
  }, [clubName])

  useEffect(() => { load() }, [load])

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

  const filtered = useMemo(() => articles.filter((a) => {
    if (tab !== 'all' && a.status !== tab) return false
    if (search && !a.title?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [articles, tab, search])

  const publishedCount = articles.filter((a) => a.status === 'published').length
  const draftCount     = articles.filter((a) => a.status === 'draft').length

  return (
    <>
      <div className="space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 font-bold">
            {loading ? '…' : `${articles.length} článkov · ${publishedCount} publikovaných`}
          </p>
          <button
            onClick={() => setModal('new')}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-wide px-4 py-2 rounded-xl transition-colors"
            style={{ background: clubColor, color: '#0f172a' }}
          >
            <Plus size={13} /> Nový článok
          </button>
        </div>

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Status tabs */}
          <div className="flex border-b border-slate-800 px-4">
            {STATUS_TABS.map((t) => {
              const active = tab === t.value
              return (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors ${
                    active
                      ? 'border-yellow-400 text-white'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                  style={active ? { borderBottomColor: clubColor } : {}}
                >
                  {t.label}
                  {t.value === 'published' && publishedCount > 0 && (
                    <span className="ml-1.5 text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold">{publishedCount}</span>
                  )}
                  {t.value === 'draft' && draftCount > 0 && (
                    <span className="ml-1.5 text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded font-bold">{draftCount}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-slate-800">
            <div className="relative max-w-xs">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                placeholder="Hľadať článok..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-slate-500 transition-colors"
              />
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader size={20} className="animate-spin text-slate-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-700">
              <Newspaper size={28} className="mb-3" />
              <p className="text-sm font-black uppercase tracking-widest mb-1">Žiadne články</p>
              <p className="text-xs">Vytvorte prvý článok pre váš klub</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {filtered.map((article) => (
                <div key={article.id} className="flex items-start gap-4 px-4 py-4 hover:bg-slate-800/30 transition-colors group">
                  {/* Thumbnail */}
                  <div className="w-14 h-10 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700/60">
                    {article.coverUrl ? (
                      <img src={article.coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Newspaper size={13} className="text-slate-700" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <StatusDot status={article.status} />
                      <p className="text-sm font-bold text-slate-200 truncate">{article.title}</p>
                    </div>
                    {article.excerpt && (
                      <p className="text-xs text-slate-500 line-clamp-1 mb-1">{article.excerpt}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <DarkCategoryBadge value={article.category} />
                      <span className="text-xs text-slate-600">{formatDate(article.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => setModal(article)}
                      className="text-slate-600 hover:text-slate-300 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(article)}
                      className="text-slate-600 hover:text-red-400 transition-colors"
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
          article={modal === 'new' ? { club: clubName } : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </>
  )
}
