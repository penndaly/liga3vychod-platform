import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { Globe, Eye, EyeOff, Plus, X, Loader } from 'lucide-react'
import { db } from '../../../services/firebase'

const PAGE_DEFS = [
  { id: 'about',     labelSK: 'O klube',    labelEN: 'About',     defaultTitleSK: 'O klube',        defaultTitleEN: 'About the Club' },
  { id: 'stadium',   labelSK: 'Štadión',    labelEN: 'Stadium',   defaultTitleSK: 'Náš štadión',     defaultTitleEN: 'Our Stadium'    },
  { id: 'community', labelSK: 'Komunita',   labelEN: 'Community', defaultTitleSK: 'Komunita',        defaultTitleEN: 'Community'      },
  { id: 'contact',   labelSK: 'Kontakt',    labelEN: 'Contact',   defaultTitleSK: 'Kontaktujte nás', defaultTitleEN: 'Contact Us'     },
]

function empty(def) {
  return {
    titleSK:   def.defaultTitleSK,
    titleEN:   def.defaultTitleEN,
    contentSK: '',
    contentEN: '',
    images:    [],
    published: false,
  }
}

const inputCls = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 transition-colors'
const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5'

export default function PagesPanel({ data, clubColor = '#facc15' }) {
  const clubId = data.club?.id
  const [activePage, setActivePage] = useState('about')
  const [pages, setPages] = useState({})          // { [pageId]: form object }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState('')

  const load = useCallback(async () => {
    if (!clubId) return
    setLoading(true)
    const results = {}
    await Promise.all(
      PAGE_DEFS.map(async (def) => {
        const snap = await getDoc(doc(db, 'clubs', String(clubId), 'pages', def.id))
        results[def.id] = snap.exists() ? snap.data() : empty(def)
      })
    )
    setPages(results)
    setLoading(false)
  }, [clubId])

  useEffect(() => { load() }, [load])

  function setField(key, value) {
    setPages((prev) => ({
      ...prev,
      [activePage]: { ...prev[activePage], [key]: value },
    }))
  }

  function addImage() {
    const url = newImageUrl.trim()
    if (!url) return
    const current = pages[activePage]?.images ?? []
    if (current.includes(url)) { toast.error('URL už existuje'); return }
    setField('images', [...current, url])
    setNewImageUrl('')
  }

  function removeImage(url) {
    setField('images', (pages[activePage]?.images ?? []).filter((u) => u !== url))
  }

  async function handleSave() {
    if (!clubId) return
    const form = pages[activePage]
    if (!form) return
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'clubs', String(clubId), 'pages', activePage),
        { ...form, updatedAt: serverTimestamp() },
        { merge: true }
      )
      toast.success('Stránka uložená')
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader size={20} className="text-slate-600 animate-spin" />
    </div>
  )

  const form = pages[activePage] ?? {}
  const activeDef = PAGE_DEFS.find((d) => d.id === activePage)

  return (
    <div className="space-y-5">
      {/* Page selector */}
      <div className="flex gap-1 bg-slate-800/50 border border-slate-800 rounded-xl p-1">
        {PAGE_DEFS.map((def) => {
          const isActive = activePage === def.id
          const pg = pages[def.id]
          return (
            <button
              key={def.id}
              onClick={() => { setActivePage(def.id); setNewImageUrl('') }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${
                isActive ? 'text-slate-950' : 'text-slate-500 hover:text-slate-300'
              }`}
              style={isActive ? { background: clubColor } : {}}
            >
              {def.labelSK}
              {pg?.published && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
              )}
            </button>
          )
        })}
      </div>

      {/* Editor */}
      <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-5 space-y-5">

        {/* Published toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-white">{activeDef?.labelSK}</p>
            <p className="text-xs text-slate-500">{activeDef?.labelEN}</p>
          </div>
          <button
            onClick={() => setField('published', !form.published)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide transition-colors ${
              form.published
                ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                : 'bg-slate-700 text-slate-400 border border-slate-600'
            }`}
          >
            {form.published ? <Eye size={12} /> : <EyeOff size={12} />}
            {form.published ? 'Publikovaná' : 'Skrytá'}
          </button>
        </div>

        {/* Titles */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nadpis (SK)</label>
            <input
              className={inputCls}
              value={form.titleSK ?? ''}
              onChange={(e) => setField('titleSK', e.target.value)}
              placeholder="Nadpis v slovenčine"
            />
          </div>
          <div>
            <label className={labelCls}>Title (EN)</label>
            <input
              className={inputCls}
              value={form.titleEN ?? ''}
              onChange={(e) => setField('titleEN', e.target.value)}
              placeholder="Title in English"
            />
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Obsah (SK)</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={8}
              value={form.contentSK ?? ''}
              onChange={(e) => setField('contentSK', e.target.value)}
              placeholder="Obsah stránky v slovenčine…"
            />
          </div>
          <div>
            <label className={labelCls}>Content (EN)</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={8}
              value={form.contentEN ?? ''}
              onChange={(e) => setField('contentEN', e.target.value)}
              placeholder="Page content in English…"
            />
          </div>
        </div>

        {/* Images */}
        <div>
          <label className={labelCls}>Obrázky</label>
          <div className="space-y-2">
            {(form.images ?? []).map((url) => (
              <div key={url} className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                <Globe size={12} className="text-slate-500 shrink-0" />
                <span className="text-xs text-slate-400 truncate flex-1">{url}</span>
                <button
                  onClick={() => removeImage(url)}
                  className="text-slate-600 hover:text-red-400 transition-colors shrink-0"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                className={`${inputCls} flex-1`}
                type="url"
                placeholder="https://… (URL obrázka)"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImage() } }}
              />
              <button
                onClick={addImage}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-bold transition-colors shrink-0"
              >
                <Plus size={13} /> Pridať
              </button>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest text-slate-950 transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: clubColor }}
          >
            {saving ? 'Ukladám…' : 'Uložiť stránku'}
          </button>
        </div>
      </div>
    </div>
  )
}
