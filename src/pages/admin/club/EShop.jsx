import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import {
  Shield, ShoppingBag, Plus, Package, Loader,
  Star, Search, Settings2, ClipboardList,
} from 'lucide-react'
import {
  doc, getDoc, setDoc, serverTimestamp,
  collection, onSnapshot, query, orderBy,
} from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { db } from '../../../services/firebase'
import { useAuth } from '../../../hooks/useAuth'
import { getClubBySlug, getClubByName } from '../../../config/clubs-config'
import { useProducts } from '../../../hooks/useProducts'
import ProductCard from '../../../components/admin/ProductCard'
import ProductForm from '../../../components/admin/ProductForm'

const CATEGORIES = [
  { value: null,       label: 'Všetky' },
  { value: 'dresy',   label: 'Dresy'   },
  { value: 'doplnky', label: 'Doplnky' },
  { value: 'listky',  label: 'Lístky'  },
  { value: 'clenstvo',label: 'Členstvo'},
  { value: 'ine',     label: 'Iné'     },
]

// ── Shop Settings panel ────────────────────────────────────────────────
function ShopSettings({ clubId, clubColor }) {
  const [cfg,    setCfg]    = useState({ shopName: '', contactEmail: '', shippingInfo: '', active: true })
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!clubId) return
    getDoc(doc(db, 'clubs', clubId, 'shop_config', 'settings'))
      .then((snap) => { if (snap.exists()) setCfg((p) => ({ ...p, ...snap.data() })); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [clubId])

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(doc(db, 'clubs', clubId, 'shop_config', 'settings'), {
        ...cfg, updatedAt: serverTimestamp(),
      }, { merge: true })
      toast.success('Nastavenia uložené')
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  const set = (k, v) => setCfg((p) => ({ ...p, [k]: v }))
  const L = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
  const I = 'w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition-colors'

  if (!loaded) return <div className="flex items-center justify-center py-20"><Loader size={18} className="animate-spin text-slate-600" /></div>

  return (
    <form onSubmit={save} className="max-w-lg space-y-5">
      <div>
        <label className={L}>Názov e-shopu</label>
        <input type="text" value={cfg.shopName} onChange={(e) => set('shopName', e.target.value)} className={I} placeholder="Official Club Store" />
      </div>
      <div>
        <label className={L}>Kontaktný email pre objednávky</label>
        <input type="email" value={cfg.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} className={I} placeholder="shop@klub.sk" />
      </div>
      <div>
        <label className={L}>Informácie o doručení / vyzdvihnutí</label>
        <textarea rows={3} value={cfg.shippingInfo} onChange={(e) => set('shippingInfo', e.target.value)} className={`${I} resize-none`} placeholder="Osobný odber na štadióne, doručenie Slovenskou poštou..." />
      </div>
      <div className="flex items-center justify-between bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
        <span className="text-sm text-slate-300 font-bold">E-shop aktívny (viditeľný verejnosti)</span>
        <button
          type="button"
          onClick={() => set('active', !cfg.active)}
          className={`w-10 h-6 rounded-full transition-colors relative ${cfg.active ? 'bg-green-500' : 'bg-slate-700'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${cfg.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>
      <button type="submit" disabled={saving} className="px-6 py-2.5 bg-yellow-400 text-slate-950 text-sm font-black rounded-xl hover:bg-yellow-300 disabled:opacity-50 transition-colors">
        {saving ? 'Ukladám...' : 'Uložiť nastavenia'}
      </button>
    </form>
  )
}

// ── Orders placeholder panel ────────────────────────────────────────────
function OrdersPanel({ clubId, clubColor }) {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clubId) return
    const unsub = onSnapshot(
      query(collection(db, 'clubs', clubId, 'orders'), orderBy('createdAt', 'desc')),
      (snap) => { setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false) },
      () => setLoading(false)
    )
    return unsub
  }, [clubId])

  const STATUS_CFG = {
    pending:   { label: 'Čaká', cls: 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30' },
    paid:      { label: 'Zaplatená', cls: 'bg-green-500/20 text-green-400 border border-green-500/30' },
    shipped:   { label: 'Odoslaná', cls: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
    completed: { label: 'Dokončená', cls: 'bg-slate-600 text-slate-300 border border-slate-500' },
    cancelled: { label: 'Zrušená', cls: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader size={20} className="animate-spin text-slate-600" /></div>

  if (orders.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center py-24 text-slate-700">
        <ClipboardList size={32} className="mb-3" />
        <p className="text-sm font-black uppercase tracking-widest mb-1">Žiadne objednávky</p>
        <p className="text-xs text-slate-600">Objednávky sa zobrazia tu po integrácii platobnej brány</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-xs text-slate-600 font-bold uppercase tracking-widest">
            <th className="text-left px-5 py-3">Objednávka</th>
            <th className="text-left px-3 py-3">Zákazník</th>
            <th className="text-right px-3 py-3">Suma</th>
            <th className="text-left px-4 py-3">Stav</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const s = STATUS_CFG[o.status] ?? STATUS_CFG.pending
            return (
              <tr key={o.id} className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors">
                <td className="px-5 py-3 font-bold text-slate-300 text-xs font-mono">{o.id.slice(0, 8).toUpperCase()}</td>
                <td className="px-3 py-3 text-slate-400 text-xs">{o.customerName ?? o.email ?? '—'}</td>
                <td className="px-3 py-3 text-right font-black text-slate-200">{o.total?.toFixed(2) ?? '—'} €</td>
                <td className="px-4 py-3"><span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Products panel ──────────────────────────────────────────────────────
function ProductsPanel({ clubSlug, clubColor }) {
  const { products, loading, deleteProduct, toggleActive, duplicateProduct } = useProducts(clubSlug)
  const [category, setCategory] = useState(null)
  const [search,   setSearch]   = useState('')
  const [modal,    setModal]    = useState(null) // null | 'add' | product

  const filtered = products.filter((p) => {
    const matchCat  = !category || (p.category ?? '').toLowerCase() === category
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const featured = filtered.filter((p) => p.featured)
  const rest     = filtered.filter((p) => !p.featured)

  return (
    <>
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            <input
              type="text"
              placeholder="Hľadať produkt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map(({ value, label }) => (
              <button
                key={label}
                onClick={() => setCategory(value)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                  category === value
                    ? 'text-slate-950'
                    : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                style={category === value ? { background: clubColor } : {}}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setModal('add')}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-wide px-4 py-2 rounded-xl transition-colors shrink-0 ml-auto"
            style={{ background: clubColor, color: '#0f172a' }}
          >
            <Plus size={13} /> Pridať produkt
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader size={24} className="animate-spin text-slate-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center py-24 text-slate-700">
            <ShoppingBag size={32} className="mb-3" />
            <p className="text-sm font-black uppercase tracking-widest mb-1">
              {products.length === 0 ? 'Žiadne produkty' : 'Žiadne výsledky'}
            </p>
            <p className="text-xs">{products.length === 0 ? 'Pridajte prvý produkt pomocou tlačidla vyššie' : 'Skúste iný filter alebo vyhľadávanie'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {featured.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-3 flex items-center gap-1.5">
                  <Star size={10} fill="currentColor" /> Odporúčané produkty
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featured.map((p) => (
                    <ProductCard key={p.id} product={p}
                      onEdit={() => setModal(p)}
                      onDelete={deleteProduct}
                      onDuplicate={duplicateProduct}
                      onToggleActive={toggleActive}
                    />
                  ))}
                </div>
              </div>
            )}
            {rest.length > 0 && (
              <div>
                {featured.length > 0 && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3">Ostatné produkty</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rest.map((p) => (
                    <ProductCard key={p.id} product={p}
                      onEdit={() => setModal(p)}
                      onDelete={deleteProduct}
                      onDuplicate={duplicateProduct}
                      onToggleActive={toggleActive}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {modal && (
        <ProductForm
          clubSlug={clubSlug}
          product={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => setModal(null)}
        />
      )}
    </>
  )
}

// ── Main page ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'products', label: 'Produkty',    icon: Package },
  { id: 'orders',   label: 'Objednávky',  icon: ClipboardList },
  { id: 'settings', label: 'Nastavenia',  icon: Settings2 },
]

export default function EShop() {
  const { clubSlug } = useParams()
  const { isSuperadmin, userData, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('products')

  const configClub = getClubBySlug(clubSlug)
  const clubColor  = configClub?.color ?? '#facc15'
  const clubId     = configClub ? String(configClub.id) : null

  if (authLoading) return null

  const userClubs = userData?.clubs ?? []
  const hasAccess = isSuperadmin || (configClub && userClubs.includes(configClub.name))

  if (!hasAccess) {
    const mySlug = getClubByName(userData?.clubs?.[0])?.slug
    return <Navigate to={mySlug ? `/admin/clubs/${mySlug}` : '/admin/unauthorized'} replace />
  }

  if (!configClub) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Klub nenájdený.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3 px-5 h-14">
          <Link to={`/admin/clubs/${clubSlug}`} className="text-slate-600 hover:text-yellow-400 transition-colors shrink-0">
            <Shield size={16} />
          </Link>
          <div className="w-px h-5 bg-slate-800 shrink-0" />
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: clubColor }}>
            <span className="text-[9px] font-black text-white leading-none">{configClub.short}</span>
          </div>
          <Link to={`/admin/clubs/${clubSlug}`} className="text-sm font-bold text-slate-400 hover:text-slate-200 transition-colors truncate">
            {configClub.name}
          </Link>
          <span className="text-slate-700">/</span>
          <div className="flex items-center gap-1.5">
            <ShoppingBag size={13} style={{ color: clubColor }} />
            <span className="text-sm font-black text-white">E-Shop</span>
          </div>
        </div>
        <div className="h-0.5 w-full" style={{ background: clubColor }} />
      </header>

      {/* Tabs */}
      <div className="bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex px-5 overflow-x-auto scrollbar-none">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all shrink-0 ${
                activeTab === id ? 'text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
              style={activeTab === id ? { borderBottomColor: clubColor } : { borderColor: 'transparent' }}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {activeTab === 'products' && <ProductsPanel clubSlug={clubSlug} clubColor={clubColor} />}
        {activeTab === 'orders'   && <OrdersPanel   clubId={clubId}     clubColor={clubColor} />}
        {activeTab === 'settings' && <ShopSettings  clubId={clubId}     clubColor={clubColor} />}
      </main>
    </div>
  )
}
