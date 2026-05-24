import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  collection, getDocs, getDoc, doc, addDoc, query,
  where, orderBy, serverTimestamp,
} from 'firebase/firestore'
import {
  ChevronLeft, ShoppingBag, Star, Package,
  X, ChevronLeft as ChevLeft, ChevronRight as ChevRight,
  Phone, Mail, MapPin, Truck, CheckCircle2, Loader,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { db } from '../../services/firebase'
import { CLUBS_2025_26 } from '../../config/clubs-config'
import { totalStock, stockStatus } from '../../hooks/useProducts'
import Navbar from '../../components/public/Navbar'
import Footer from '../../components/public/Footer'

// ── Helpers ───────────────────────────────────────────────────────────

const CAT_LABEL = {
  dresy: 'Dresy', doplnky: 'Doplnky', listky: 'Lístky',
  clenstvo: 'Členstvo', ine: 'Iné',
}
const CAT_COLORS = {
  dresy:    'bg-blue-500/20   text-blue-400   border border-blue-500/25',
  doplnky:  'bg-purple-500/20 text-purple-400 border border-purple-500/25',
  listky:   'bg-orange-500/20 text-orange-400 border border-orange-500/25',
  clenstvo: 'bg-green-500/20  text-green-400  border border-green-500/25',
  ine:      'bg-slate-700     text-slate-400  border border-slate-600',
}
const STOCK_LABEL = {
  ok:  { label: 'Skladom',    cls: 'text-green-400'  },
  low: { label: 'Málo kusov', cls: 'text-yellow-400' },
  out: { label: 'Vypredané',  cls: 'text-red-400'    },
}

// ── Image gallery ─────────────────────────────────────────────────────

function Gallery({ images }) {
  const [idx, setIdx] = useState(0)
  const imgs = images?.length ? images : []
  if (!imgs.length) {
    return (
      <div className="aspect-square bg-slate-800 rounded-2xl flex items-center justify-center">
        <Package size={48} className="text-slate-600" />
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <div className="relative aspect-square bg-slate-800 rounded-2xl overflow-hidden">
        <img src={imgs[idx]} alt="" className="w-full h-full object-cover" />
        {imgs.length > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => (i - 1 + imgs.length) % imgs.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-900/80 rounded-full flex items-center justify-center text-white hover:bg-slate-800 transition-colors"
            >
              <ChevLeft size={16} />
            </button>
            <button
              onClick={() => setIdx((i) => (i + 1) % imgs.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-900/80 rounded-full flex items-center justify-center text-white hover:bg-slate-800 transition-colors"
            >
              <ChevRight size={16} />
            </button>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {imgs.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/30'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {imgs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {imgs.map((url, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-colors ${i === idx ? 'border-yellow-400' : 'border-transparent opacity-60 hover:opacity-100'}`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Order form ─────────────────────────────────────────────────────────

function OrderForm({ product, selectedSize, clubId, shopCfg, onDone }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', size: selectedSize ?? '', quantity: '1', message: '',
  })
  const [saving, setSaving] = useState(false)
  const [done,   setDone]   = useState(false)

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const sizes = product.sizes?.length ? product.sizes : []
  const hasSizes = sizes.length > 0

  const I = 'w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition-colors'
  const L = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) { toast.error('Vyplňte meno a email'); return }
    setSaving(true)
    try {
      await addDoc(collection(db, 'clubs', clubId, 'orders'), {
        productId:   product.id,
        productName: product.name,
        price:       product.price,
        size:        form.size || null,
        quantity:    Number(form.quantity) || 1,
        customerName:  form.name.trim(),
        customerEmail: form.email.trim(),
        customerPhone: form.phone.trim(),
        message:     form.message.trim(),
        status:      'pending',
        createdAt:   serverTimestamp(),
      })
      setDone(true)
    } catch {
      toast.error('Chyba pri odosielaní. Skúste znova.')
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
          <CheckCircle2 size={28} className="text-green-400" />
        </div>
        <h3 className="text-lg font-black text-white">Objednávka odoslaná!</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Budeme vás kontaktovať na <span className="text-white font-bold">{form.email}</span>.
          {shopCfg?.contactEmail && (
            <> Môžete nás tiež kontaktovať na <a href={`mailto:${shopCfg.contactEmail}`} className="text-yellow-400 hover:underline">{shopCfg.contactEmail}</a>.</>
          )}
        </p>
        <button onClick={onDone} className="px-6 py-2.5 bg-slate-800 text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors">
          Zatvoriť
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-xs font-black uppercase tracking-widest text-slate-400 pb-2 border-b border-slate-800">
        Záujemca o: <span className="text-slate-200">{product.name}</span>
      </p>

      {hasSizes && (
        <div>
          <label className={L}>Veľkosť *</label>
          <div className="flex gap-2 flex-wrap">
            {sizes.map((s) => {
              const inStock = !product.stock || typeof product.stock === 'number'
                ? true
                : (Number(product.stock[s] ?? 0) > 0)
              return (
                <button key={s} type="button" onClick={() => inStock && set('size', s)}
                  disabled={!inStock}
                  className={`text-xs font-black px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                    form.size === s
                      ? 'bg-yellow-400 text-slate-950 border-yellow-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={L}>Meno a priezvisko *</label>
          <input type="text" required value={form.name} onChange={(e) => set('name', e.target.value)} className={I} placeholder="Ján Novák" />
        </div>
        <div>
          <label className={L}>Počet kusov</label>
          <input type="number" min="1" max="10" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} className={I} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={L}>Email *</label>
          <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} className={I} placeholder="jan@gmail.com" />
        </div>
        <div>
          <label className={L}>Telefón</label>
          <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={I} placeholder="+421 900 ..." />
        </div>
      </div>

      <div>
        <label className={L}>Poznámka (voliteľné)</label>
        <textarea rows={2} value={form.message} onChange={(e) => set('message', e.target.value)} className={`${I} resize-none`} placeholder="Spôsob doručenia, špeciálne požiadavky..." />
      </div>

      {shopCfg?.shippingInfo && (
        <div className="flex items-start gap-2 bg-slate-800/60 rounded-xl px-4 py-3">
          <Truck size={13} className="text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400">{shopCfg.shippingInfo}</p>
        </div>
      )}

      <button type="submit" disabled={saving || (hasSizes && !form.size)}
        className="w-full py-3 font-black text-sm uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50 bg-yellow-400 text-slate-950 hover:bg-yellow-300"
      >
        {saving ? 'Odosielam...' : 'Odoslať záujem o produkt'}
      </button>
      <p className="text-[10px] text-slate-600 text-center">
        Táto objednávka nie je záväzná — budeme vás kontaktovať na potvrdenie.
      </p>
    </form>
  )
}

// ── Product detail modal ──────────────────────────────────────────────

function ProductModal({ product, clubId, shopCfg, onClose }) {
  const [ordering, setOrdering] = useState(false)
  const [selSize,  setSelSize]  = useState(null)

  const total  = totalStock(product.stock)
  const status = stockStatus(total)
  const stockInfo = STOCK_LABEL[status]
  const imgs   = product.images?.length ? product.images : product.imageUrl ? [product.imageUrl] : []
  const sizes  = product.sizes?.length ? product.sizes : []
  const catKey = (product.category ?? '').toLowerCase()

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[95vh] overflow-y-auto">

        {/* Close bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 rounded-t-3xl sm:rounded-t-2xl z-10">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${CAT_COLORS[catKey] ?? CAT_COLORS.ine}`}>
            {CAT_LABEL[catKey] ?? product.category}
          </span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {ordering ? (
            <OrderForm
              product={product}
              selectedSize={selSize}
              clubId={clubId}
              shopCfg={shopCfg}
              onDone={onClose}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Gallery */}
              <Gallery images={imgs} />

              {/* Info */}
              <div className="space-y-4">
                {product.featured && (
                  <div className="flex items-center gap-1.5">
                    <Star size={12} fill="currentColor" className="text-yellow-400" />
                    <span className="text-xs font-bold text-yellow-400">Odporúčaný produkt</span>
                  </div>
                )}

                <div>
                  <h2 className="text-xl font-black text-white leading-tight">{product.name}</h2>
                  {product.name_en && <p className="text-sm text-slate-500 mt-0.5">{product.name_en}</p>}
                </div>

                <p className="text-2xl font-black text-white">
                  {Number(product.price || 0).toFixed(2)} <span className="text-base text-slate-400">EUR</span>
                </p>

                <p className={`text-sm font-bold ${stockInfo.cls}`}>{stockInfo.label}</p>

                {product.description && (
                  <p className="text-sm text-slate-400 leading-relaxed">{product.description}</p>
                )}

                {/* Size selector */}
                {sizes.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Veľkosť</p>
                    <div className="flex gap-2 flex-wrap">
                      {sizes.map((s) => {
                        const qty = product.stock && typeof product.stock === 'object'
                          ? Number(product.stock[s] ?? 0)
                          : null
                        const inStock = qty === null || qty > 0
                        return (
                          <button key={s} type="button"
                            onClick={() => inStock && setSelSize(s)}
                            disabled={!inStock}
                            className={`text-sm font-black px-4 py-2 rounded-xl border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                              selSize === s
                                ? 'bg-yellow-400 text-slate-950 border-yellow-400'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            {s}
                            {qty !== null && qty <= 5 && qty > 0 && (
                              <span className="ml-1 text-[9px] text-yellow-500">{qty}ks</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setOrdering(true)}
                  disabled={status === 'out' || (sizes.length > 0 && !selSize)}
                  className="w-full py-3.5 font-black text-sm uppercase tracking-widest rounded-xl transition-colors disabled:opacity-40 bg-yellow-400 text-slate-950 hover:bg-yellow-300"
                >
                  {status === 'out' ? 'Vypredané' : sizes.length > 0 && !selSize ? 'Vyberte veľkosť' : 'Mám záujem'}
                </button>

                {sizes.length > 0 && !selSize && status !== 'out' && (
                  <p className="text-xs text-slate-600 text-center">Vyberte veľkosť pre pokračovanie</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Product grid card ─────────────────────────────────────────────────

function ShopCard({ product, accentColor, onClick }) {
  const total  = totalStock(product.stock)
  const status = stockStatus(total)
  const img    = product.images?.[0] ?? product.imageUrl ?? null
  const catKey = (product.category ?? '').toLowerCase()

  return (
    <button
      onClick={onClick}
      disabled={status === 'out'}
      className="group text-left bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 disabled:opacity-60"
    >
      {/* Image */}
      <div className="relative aspect-square bg-slate-800 overflow-hidden">
        {img ? (
          <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={36} className="text-slate-600" />
          </div>
        )}
        {product.featured && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow">
            <Star size={11} fill="currentColor" className="text-slate-950" />
          </div>
        )}
        {status === 'out' && (
          <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
            <span className="text-xs font-black text-red-400 bg-slate-900/90 px-3 py-1.5 rounded-full border border-red-500/30">Vypredané</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-black text-slate-100 leading-tight flex-1 min-w-0 line-clamp-2">{product.name}</p>
          <p className="text-sm font-black text-white shrink-0 tabular-nums">{Number(product.price || 0).toFixed(2)} €</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${CAT_COLORS[catKey] ?? CAT_COLORS.ine}`}>
            {CAT_LABEL[catKey] ?? product.category}
          </span>
          {status !== 'out' && (
            <span className={`text-[10px] font-bold ${STOCK_LABEL[status].cls}`}>
              {status === 'low' ? `Iba ${total} ks` : 'Skladom'}
            </span>
          )}
        </div>

        {product.sizes?.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {product.sizes.slice(0, 6).map((s) => (
              <span key={s} className="text-[9px] font-bold text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────

export default function ClubShop() {
  const { clubId }   = useParams()
  const staticClub   = CLUBS_2025_26.find((c) => c.id === Number(clubId))
  const accentColor  = staticClub?.color ?? '#facc15'

  const [profile,    setProfile]    = useState(null)
  const [shopCfg,    setShopCfg]    = useState(null)
  const [products,   setProducts]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [category,   setCategory]   = useState(null)
  const [detail,     setDetail]     = useState(null) // product | null

  useEffect(() => {
    if (!staticClub) { setLoading(false); return }
    const id = String(staticClub.id)

    async function load() {
      try {
        const [profileSnap, cfgSnap, productsSnap] = await Promise.all([
          getDoc(doc(db, 'clubs', id)),
          getDoc(doc(db, 'clubs', id, 'shop_config', 'settings')),
          getDocs(collection(db, 'clubs', id, 'products')),
        ])
        setProfile(profileSnap.exists() ? profileSnap.data() : null)
        setShopCfg(cfgSnap.exists() ? cfgSnap.data() : null)
        const all = productsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setProducts(
          all
            .filter((p) => p.active !== false)
            .sort((a, b) => {
              if (a.featured && !b.featured) return -1
              if (!a.featured && b.featured) return 1
              return 0
            })
        )
      } catch {
        // silently show empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [clubId])

  const clubName = profile?.name ?? staticClub?.name ?? ''
  const logoUrl  = profile?.logoUrl ?? null
  const shopName = shopCfg?.shopName || `${clubName} — Official Store`

  // Derive available categories from products
  const usedCategories = [...new Set(products.map((p) => (p.category ?? '').toLowerCase()).filter(Boolean))]

  const filtered = products.filter((p) =>
    !category || (p.category ?? '').toLowerCase() === category
  )

  const featured = filtered.filter((p) => p.featured)
  const regular  = filtered.filter((p) => !p.featured)

  if (!staticClub) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-slate-500 text-sm">Klub nenájdený.</p>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      {/* Hero */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link to={`/kluby/${clubId}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-yellow-400 transition-colors mb-5"
          >
            <ChevronLeft size={12} /> {clubName}
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-700 shrink-0"
              style={{ background: logoUrl ? '#1e293b' : accentColor + '22' }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt={clubName} className="w-full h-full object-contain p-1" />
              ) : (
                <ShoppingBag size={22} style={{ color: accentColor }} />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black text-white leading-tight">{shopName}</h1>
              <p className="text-sm font-bold mt-0.5" style={{ color: accentColor }}>
                {!loading && `${products.length} produktov`}
              </p>
            </div>
          </div>

          {/* Shop contact strip */}
          {shopCfg?.contactEmail && (
            <div className="flex flex-wrap gap-4 mt-5">
              {shopCfg.contactEmail && (
                <a href={`mailto:${shopCfg.contactEmail}`}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <Mail size={11} /> {shopCfg.contactEmail}
                </a>
              )}
              {shopCfg.shippingInfo && (
                <span className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Truck size={11} /> {shopCfg.shippingInfo}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="h-0.5 w-full" style={{ background: accentColor }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Shop inactive notice */}
        {!loading && shopCfg?.active === false && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <ShoppingBag size={32} className="mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">
              E-shop je momentálne nedostupný
            </p>
            <p className="text-xs text-slate-600">Skúste to neskôr alebo kontaktujte klub priamo.</p>
          </div>
        )}

        {/* Category filter */}
        {!loading && products.length > 0 && shopCfg?.active !== false && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setCategory(null)}
              className={`text-xs font-bold px-4 py-2 rounded-xl border transition-colors shrink-0 ${
                !category
                  ? 'border-yellow-400/50 text-white'
                  : 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'
              }`}
              style={!category ? { background: accentColor + '20', borderColor: accentColor + '60', color: accentColor } : {}}
            >
              Všetky ({products.length})
            </button>
            {usedCategories.map((cat) => {
              const cnt = products.filter((p) => (p.category ?? '').toLowerCase() === cat).length
              return (
                <button key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-xs font-bold px-4 py-2 rounded-xl border transition-colors shrink-0 ${
                    category === cat
                      ? ''
                      : 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                  }`}
                  style={category === cat ? { background: accentColor + '20', borderColor: accentColor + '60', color: accentColor } : {}}
                >
                  {CAT_LABEL[cat] ?? cat} ({cnt})
                </button>
              )
            })}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader size={24} className="animate-spin text-slate-600" />
          </div>
        ) : products.length === 0 || shopCfg?.active === false ? null : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-600">
            <Package size={32} className="mb-3 opacity-40" />
            <p className="text-sm font-bold">Žiadne produkty v tejto kategórii</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Featured row */}
            {featured.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-4 flex items-center gap-1.5">
                  <Star size={10} fill="currentColor" /> Odporúčané
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {featured.map((p) => (
                    <ShopCard key={p.id} product={p} accentColor={accentColor} onClick={() => setDetail(p)} />
                  ))}
                </div>
              </div>
            )}

            {/* Regular grid */}
            {regular.length > 0 && (
              <div>
                {featured.length > 0 && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-4">Ostatné produkty</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {regular.map((p) => (
                    <ShopCard key={p.id} product={p} accentColor={accentColor} onClick={() => setDetail(p)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty shop */}
        {!loading && products.length === 0 && shopCfg?.active !== false && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-700">
            <ShoppingBag size={40} className="mb-4 opacity-30" />
            <p className="text-sm font-black uppercase tracking-widest mb-1">Žiadne produkty</p>
            <p className="text-xs">E-shop bude čoskoro naplnený produktmi.</p>
          </div>
        )}
      </div>

      <Footer />

      {/* Product detail modal */}
      {detail && (
        <ProductModal
          product={detail}
          clubId={String(staticClub.id)}
          shopCfg={shopCfg}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  )
}
