import { useState, useEffect, useCallback } from 'react'
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp,
} from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { Plus, Pencil, Trash2, ShoppingBag, Package, X } from 'lucide-react'
import { db } from '../../../services/firebase'

const CATEGORIES = ['Dres', 'Tréning', 'Doplnky', 'Ostatné']

const EMPTY_FORM = { name: '', category: 'Dres', price: '', stock: '', description: '', imageUrl: '' }

function StockBadge({ stock }) {
  const n = Number(stock)
  const cls = n === 0
    ? 'bg-red-500/15 text-red-400 border border-red-500/25'
    : n <= 5
      ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25'
      : 'bg-green-500/15 text-green-400 border border-green-500/25'
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded ${cls}`}>
      {n === 0 ? 'Vypredané' : `${n} ks`}
    </span>
  )
}

function ProductModal({ product, clubColor, onClose, onSaved }) {
  const [form, setForm] = useState(product ?? EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Zadaj názov produktu'); return }
    if (form.price === '' || isNaN(Number(form.price))) { toast.error('Zadaj platnú cenu'); return }
    if (form.stock === '' || isNaN(Number(form.stock))) { toast.error('Zadaj počet na sklade'); return }

    setSaving(true)
    try {
      await onSaved({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      })
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 transition-colors'
  const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-black text-white uppercase tracking-wide">
            {product ? 'Upraviť produkt' : 'Nový produkt'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Názov *</label>
            <input
              className={inputCls}
              placeholder="napr. Domáci dres 2025/26"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Kategória</label>
              <select
                className={inputCls}
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Cena (€) *</label>
              <input
                className={inputCls}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Počet na sklade *</label>
            <input
              className={inputCls}
              type="number"
              min="0"
              placeholder="0"
              value={form.stock}
              onChange={(e) => set('stock', e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Popis</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              placeholder="Krátky popis produktu…"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>URL obrázka</label>
            <input
              className={inputCls}
              type="url"
              placeholder="https://…"
              value={form.imageUrl}
              onChange={(e) => set('imageUrl', e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-colors"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg text-slate-950 transition-colors disabled:opacity-50"
              style={{ background: clubColor }}
            >
              {saving ? 'Ukladám…' : product ? 'Uložiť zmeny' : 'Pridať produkt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function EShopPanel({ data, clubColor = '#facc15' }) {
  const clubId = data.club?.id
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | product object

  const load = useCallback(async () => {
    if (!clubId) return
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'clubs', String(clubId), 'products'))
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch {
      toast.error('Chyba pri načítaní produktov')
    } finally {
      setLoading(false)
    }
  }, [clubId])

  useEffect(() => { load() }, [load])

  async function handleSave(form) {
    const clubRef = String(clubId)
    try {
      if (modal?.id) {
        await updateDoc(doc(db, 'clubs', clubRef, 'products', modal.id), {
          ...form,
          updatedAt: serverTimestamp(),
        })
        toast.success('Produkt aktualizovaný')
      } else {
        await addDoc(collection(db, 'clubs', clubRef, 'products'), {
          ...form,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        toast.success('Produkt pridaný')
      }
      setModal(null)
      load()
    } catch {
      toast.error('Chyba pri ukladaní produktu')
      throw new Error('save failed')
    }
  }

  async function handleDelete(product) {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Odstrániť produkt "${product.name}"?`)) return
    try {
      await deleteDoc(doc(db, 'clubs', String(clubId), 'products', product.id))
      toast.success('Produkt odstránený')
      setProducts((prev) => prev.filter((p) => p.id !== product.id))
    } catch {
      toast.error('Chyba pri odstraňovaní')
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            {products.length} {products.length === 1 ? 'produkt' : 'produktov'}
          </p>
        </div>
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-widest text-slate-950 transition-colors hover:opacity-90"
          style={{ background: clubColor }}
        >
          <Plus size={13} />
          Pridať produkt
        </button>
      </div>

      {/* Product list */}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-600 font-bold">Načítavam…</div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-600">
          <ShoppingBag size={32} className="mb-3 opacity-40" />
          <p className="text-sm font-black uppercase tracking-widest mb-1">Žiadne produkty</p>
          <p className="text-xs">Pridaj prvý produkt do e-shopu kliknutím na tlačidlo vyššie.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-4 bg-slate-800/50 border border-slate-800 rounded-xl px-4 py-3"
            >
              {/* Thumbnail */}
              <div className="w-10 h-10 rounded-lg shrink-0 overflow-hidden bg-slate-700 flex items-center justify-center">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  <Package size={16} className="text-slate-500" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white truncate">{product.name}</p>
                <p className="text-xs text-slate-500">{product.category}</p>
              </div>

              {/* Price */}
              <p className="text-sm font-black text-white shrink-0">
                {Number(product.price).toFixed(2)} €
              </p>

              {/* Stock */}
              <StockBadge stock={product.stock} />

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setModal(product)}
                  className="p-1.5 text-slate-500 hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-700"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => handleDelete(product)}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-700"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ProductModal
          product={modal === 'add' ? null : modal}
          clubColor={clubColor}
          onClose={() => setModal(null)}
          onSaved={handleSave}
        />
      )}
    </>
  )
}
