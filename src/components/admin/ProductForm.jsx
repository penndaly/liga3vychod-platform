import { useState, useRef } from 'react'
import {
  doc, addDoc, updateDoc, collection, serverTimestamp,
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { toast } from 'react-hot-toast'
import { X, Upload, Star, ImagePlus, Loader, Trash2, GripVertical } from 'lucide-react'
import { db, storage } from '../../services/firebase'
import { getClubBySlug } from '../../config/clubs-config'

const CATEGORIES = [
  { value: 'dresy',    label: 'Dresy'    },
  { value: 'doplnky',  label: 'Doplnky'  },
  { value: 'listky',   label: 'Lístky'   },
  { value: 'clenstvo', label: 'Členstvo' },
  { value: 'ine',      label: 'Iné'      },
]

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const LABEL = 'block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT = 'w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition-colors'
const TEXTAREA = `${INPUT} resize-none`

const EMPTY = {
  name: '', name_en: '',
  description: '', description_en: '',
  category: 'dresy', price: '',
  featured: false, active: true,
}

function Toggle({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-slate-300 font-bold">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-10 h-6 rounded-full transition-colors relative ${value ? 'bg-green-500' : 'bg-slate-700'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </label>
  )
}

export default function ProductForm({ clubSlug, product, onClose, onSaved }) {
  const isEdit     = Boolean(product?.id)
  const staticClub = getClubBySlug(clubSlug)
  const clubId     = staticClub ? String(staticClub.id) : null

  const [form, setForm] = useState(isEdit ? {
    name:         product.name         ?? '',
    name_en:      product.name_en      ?? '',
    description:  product.description  ?? '',
    description_en: product.description_en ?? '',
    category:     product.category     ?? 'dresy',
    price:        product.price != null ? String(product.price) : '',
    featured:     product.featured     ?? false,
    active:       product.active       !== false,
  } : { ...EMPTY })

  const [images,        setImages]        = useState(
    isEdit ? (Array.isArray(product.images) ? product.images : product.imageUrl ? [product.imageUrl] : []) : []
  )
  const [selectedSizes, setSelectedSizes] = useState(
    isEdit && product.stock && typeof product.stock === 'object'
      ? Object.keys(product.stock)
      : isEdit && typeof product.stock === 'number'
        ? []
        : []
  )
  const [sizeStock, setSizeStock] = useState(
    isEdit && product.stock && typeof product.stock === 'object'
      ? product.stock
      : {}
  )
  const [simpleStock, setSimpleStock] = useState(
    isEdit && typeof product.stock === 'number' ? String(product.stock) : ''
  )
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [dragOver,  setDragOver]  = useState(false)
  const fileRef = useRef(null)

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  function toggleSize(size) {
    setSelectedSizes((prev) => {
      const next = prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
      return next
    })
  }

  async function handleFiles(files) {
    const remaining = 5 - images.length
    const toUpload  = Array.from(files).slice(0, remaining)
    if (!toUpload.length) return

    setUploading(true)
    try {
      const urls = []
      for (const file of toUpload) {
        const path = `shops/${clubId}/products/${Date.now()}_${file.name}`
        const sRef  = storageRef(storage, path)
        await uploadBytes(sRef, file)
        const url = await getDownloadURL(sRef)
        urls.push(url)
      }
      setImages((prev) => [...prev, ...urls])
      toast.success(`${urls.length} obrázok/obrázkov nahraný`)
    } catch {
      toast.error('Chyba pri nahrávaní obrázkov')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Zadajte názov produktu'); return }
    if (!form.price || isNaN(Number(form.price))) { toast.error('Zadajte platnú cenu'); return }

    const stockData = selectedSizes.length > 0
      ? Object.fromEntries(selectedSizes.map((s) => [s, Number(sizeStock[s] ?? 0)]))
      : simpleStock !== '' ? Number(simpleStock) : 0

    setSaving(true)
    try {
      const data = {
        name:           form.name.trim(),
        name_en:        form.name_en.trim(),
        description:    form.description.trim(),
        description_en: form.description_en.trim(),
        category:       form.category,
        price:          parseFloat(form.price),
        currency:       'EUR',
        images,
        imageUrl:       images[0] ?? null,
        sizes:          selectedSizes,
        stock:          stockData,
        featured:       form.featured,
        active:         form.active,
        updatedAt:      serverTimestamp(),
      }

      if (isEdit) {
        await updateDoc(doc(db, 'clubs', clubId, 'products', product.id), data)
        toast.success('Produkt aktualizovaný')
      } else {
        await addDoc(collection(db, 'clubs', clubId, 'products'), {
          ...data, createdAt: serverTimestamp(),
        })
        toast.success('Produkt pridaný')
      }
      onSaved()
    } catch {
      toast.error('Chyba pri ukladaní produktu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl my-8">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 rounded-t-2xl z-10">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-100">
            {isEdit ? 'Upraviť produkt' : 'Nový produkt'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Images */}
          <div>
            <label className={LABEL}>Obrázky (max 5)</label>
            <div className="space-y-3">
              {/* Thumbnails */}
              {images.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {images.map((url, i) => (
                    <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-700">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} className="text-white" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 text-[8px] font-black bg-slate-900/80 text-yellow-400 px-1.5 py-0.5 rounded">
                          Hlavný
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Drop zone */}
              {images.length < 5 && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                    dragOver ? 'border-yellow-400 bg-yellow-400/5' : 'border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {uploading ? (
                    <>
                      <Loader size={20} className="animate-spin text-slate-500" />
                      <p className="text-xs text-slate-500">Nahrávam obrázky...</p>
                    </>
                  ) : (
                    <>
                      <ImagePlus size={20} className="text-slate-600" />
                      <p className="text-xs text-slate-500 text-center">
                        Pretiahnite sem obrázky alebo <span className="text-yellow-400 font-bold">kliknite pre výber</span>
                      </p>
                      <p className="text-[10px] text-slate-700">PNG, JPG, WEBP · max 5 MB · {5 - images.length} zostávajú</p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          </div>

          {/* Name (bilingual) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Názov (SK) *</label>
              <input type="text" required value={form.name} onChange={(e) => set('name', e.target.value)} className={INPUT} placeholder="Domáci dres 2025/26" />
            </div>
            <div>
              <label className={LABEL}>Názov (EN)</label>
              <input type="text" value={form.name_en} onChange={(e) => set('name_en', e.target.value)} className={INPUT} placeholder="Home Jersey 2025/26" />
            </div>
          </div>

          {/* Description (bilingual) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Popis (SK)</label>
              <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} className={TEXTAREA} placeholder="Oficiálny domáci dres sezóny..." />
            </div>
            <div>
              <label className={LABEL}>Popis (EN)</label>
              <textarea rows={3} value={form.description_en} onChange={(e) => set('description_en', e.target.value)} className={TEXTAREA} placeholder="Official home jersey..." />
            </div>
          </div>

          {/* Category + Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Kategória</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className={INPUT}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Cena (EUR) *</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} className={INPUT} placeholder="0.00" />
            </div>
          </div>

          {/* Sizes + Stock */}
          <div>
            <label className={LABEL}>Veľkosti a sklad</label>
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex gap-2 flex-wrap">
                {SIZES.map((size) => {
                  const checked = selectedSizes.includes(size)
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`text-xs font-black px-3 py-1.5 rounded-lg border transition-colors ${
                        checked
                          ? 'bg-yellow-400 text-slate-950 border-yellow-400'
                          : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>

              {selectedSizes.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {selectedSizes.map((size) => (
                    <div key={size}>
                      <label className="block text-[10px] font-black text-slate-600 mb-1 text-center">{size}</label>
                      <input
                        type="number" min="0"
                        value={sizeStock[size] ?? ''}
                        onChange={(e) => setSizeStock((p) => ({ ...p, [size]: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-100 text-center focus:outline-none focus:border-yellow-400 transition-colors"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">Celkový sklad (bez veľkostí)</span>
                  <input
                    type="number" min="0"
                    value={simpleStock}
                    onChange={(e) => setSimpleStock(e.target.value)}
                    className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 text-center focus:outline-none focus:border-yellow-400 transition-colors"
                    placeholder="0"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Toggles */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
            <Toggle label="Odporúčaný produkt" value={form.featured} onChange={(v) => set('featured', v)} />
            <div className="border-t border-slate-700/40 pt-3">
              <Toggle label="Aktívny (viditeľný v e-shope)" value={form.active} onChange={(v) => set('active', v)} />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-700 text-slate-400 text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors">
              Zrušiť
            </button>
            <button type="submit" disabled={saving || uploading} className="flex-1 py-3 bg-yellow-400 text-slate-950 text-sm font-black rounded-xl hover:bg-yellow-300 disabled:opacity-50 transition-colors">
              {saving ? 'Ukladám...' : isEdit ? 'Uložiť zmeny' : 'Pridať produkt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
