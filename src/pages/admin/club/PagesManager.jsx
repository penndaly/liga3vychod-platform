/**
 * PagesManager.jsx
 *
 * Standalone CMS page at /admin/clubs/:clubSlug/stranky
 * Two views: list (page cards) and editor (TipTap full-screen).
 *
 * Firestore: clubs/{clubId}/pages/{slug}
 *   slug is both the document ID and a field.
 *   Predefined pages (about, stadium, community, contact) cannot be deleted.
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import {
  collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../../services/firebase'
import { useAuth } from '../../../hooks/useAuth'
import { getClubBySlug, getClubByName } from '../../../config/clubs-config'
import RichTextEditor from '../../../components/admin/RichTextEditor'
import {
  ArrowLeft, Plus, Eye, EyeOff, Edit2, Trash2, ExternalLink,
  FileText, Globe, Lock, Loader, Save, X, Check,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Predefined pages ───────────────────────────────────────────────────────
const PREDEFINED = [
  { slug: 'about',     title: 'O klube',         title_en: 'About the Club'  },
  { slug: 'stadium',   title: 'Štadión',          title_en: 'Stadium'         },
  { slug: 'community', title: 'Komunita',         title_en: 'Community'       },
  { slug: 'contact',   title: 'Kontaktujte nás',  title_en: 'Contact Us'      },
]
const PREDEFINED_SLUGS = new Set(PREDEFINED.map((p) => p.slug))

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ── Small shared styles ────────────────────────────────────────────────────
const L  = 'block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5'
const I  = 'w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition-colors'

// ── Page card (list view) ──────────────────────────────────────────────────
function PageCard({ page, clubSlug, clubId, clubColor, onEdit, onDelete, onTogglePublish }) {
  const isPredefined = PREDEFINED_SLUGS.has(page.slug)
  const updatedAt    = page.updatedAt?.toDate?.()

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-colors group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileText size={14} className="text-slate-600 shrink-0" />
          <h3 className="text-sm font-black text-white truncate leading-tight">
            {page.title || page.titleSK || '(bez názvu)'}
          </h3>
          {isPredefined && (
            <Lock size={11} className="text-slate-700 shrink-0" title="Predefinovaná stránka" />
          )}
        </div>

        {/* Published badge */}
        <button
          onClick={() => onTogglePublish(page)}
          className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border transition-colors ${
            page.published
              ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
              : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600'
          }`}
        >
          {page.published ? <Eye size={10} /> : <EyeOff size={10} />}
          {page.published ? 'Živá' : 'Koncept'}
        </button>
      </div>

      {/* Slug + meta */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1 text-[10px] font-mono text-slate-600 bg-slate-800/60 border border-slate-700/50 rounded-md px-2 py-0.5">
          <Globe size={9} /> /{page.slug}
        </span>
        {updatedAt && (
          <span className="text-[10px] text-slate-700">
            Upravené {updatedAt.toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </span>
        )}
        {page.metaDescription && (
          <span className="text-[10px] text-slate-700 truncate max-w-[200px]">
            {page.metaDescription}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onEdit(page)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
        >
          <Edit2 size={11} /> Upraviť
        </button>

        {page.published && (
          <a
            href={`/kluby/${clubId}/strana/${page.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-yellow-400 border border-slate-700/50 hover:border-yellow-400/30 transition-colors"
          >
            <ExternalLink size={11} /> Náhľad
          </a>
        )}

        {!isPredefined && (
          <button
            onClick={() => onDelete(page)}
            className="ml-auto p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
            title="Odstrániť stránku"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── New-page modal ─────────────────────────────────────────────────────────
function NewPageModal({ existingSlugs, onConfirm, onCancel }) {
  const [title, setTitle] = useState('')
  const slug = slugify(title)
  const taken = existingSlugs.has(slug) && slug !== ''

  function submit(e) {
    e.preventDefault()
    if (!slug || taken) return
    onConfirm({ title, slug })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <form
        onSubmit={submit}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-black text-white">Nová stránka</p>
          <button type="button" onClick={onCancel} className="text-slate-600 hover:text-slate-300">
            <X size={16} />
          </button>
        </div>

        <div>
          <label className={L}>Názov stránky</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="História klubu"
            autoFocus
            className={I}
          />
        </div>

        {title && (
          <div>
            <label className={L}>URL adresa</label>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl">
              <Globe size={12} className="text-slate-600 shrink-0" />
              <span className="text-xs font-mono text-slate-400">/strana/</span>
              <span className={`text-xs font-mono ${taken ? 'text-red-400' : 'text-green-400'}`}>
                {slug || '…'}
              </span>
              {taken && <span className="text-[10px] text-red-400 ml-auto">Už existuje</span>}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={!slug || taken}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black disabled:opacity-40 transition-colors"
            style={{ background: '#facc15', color: '#0f172a' }}
          >
            <Check size={12} /> Vytvoriť
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-800 border border-slate-700 hover:text-slate-200 transition-colors"
          >
            Zrušiť
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Editor view ────────────────────────────────────────────────────────────
function EditorView({ page, clubId, clubSlug, clubColor, onBack, onSaved }) {
  const { user } = useAuth()
  const [lang,    setLang]    = useState('sk')
  const [form,    setForm]    = useState({
    title:           page.title    ?? page.titleSK    ?? '',
    title_en:        page.title_en ?? page.titleEN    ?? '',
    content:         page.content  ?? page.contentSK  ?? '',
    content_en:      page.content_en ?? page.contentEN ?? '',
    metaDescription: page.metaDescription ?? '',
    published:       page.published ?? false,
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  async function handleSave() {
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'clubs', clubId, 'pages', page.slug),
        {
          slug:            page.slug,
          title:           form.title,
          title_en:        form.title_en,
          content:         form.content,
          content_en:      form.content_en,
          metaDescription: form.metaDescription,
          published:       form.published,
          updatedAt:       serverTimestamp(),
          createdAt:       page.createdAt ?? serverTimestamp(),
          createdBy:       page.createdBy ?? user?.uid ?? null,
        },
        { merge: true },
      )
      toast.success('Stránka uložená')
      onSaved({ ...page, ...form })
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  const LANG_TABS = [
    { id: 'sk',  label: 'Slovenčina' },
    { id: 'en',  label: 'English'    },
    { id: 'seo', label: 'SEO'        },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">

      {/* Editor header */}
      <div className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3 px-5 h-14">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-500 hover:text-yellow-400 text-xs font-bold transition-colors shrink-0"
          >
            <ArrowLeft size={13} /> Stránky
          </button>

          <div className="w-px h-5 bg-slate-800 shrink-0" />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white truncate">{form.title || '(bez názvu)'}</p>
            <p className="text-[10px] font-mono text-slate-600">/strana/{page.slug}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Publish toggle */}
            <button
              onClick={() => set('published', !form.published)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black border transition-colors ${
                form.published
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              {form.published ? <Eye size={11} /> : <EyeOff size={11} />}
              {form.published ? 'Živá' : 'Koncept'}
            </button>

            {form.published && (
              <a
                href={`/kluby/${clubId}/strana/${page.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-slate-600 hover:text-yellow-400 border border-slate-700/50 hover:border-yellow-400/30 transition-colors"
                title="Otvoriť živú stránku"
              >
                <ExternalLink size={13} />
              </a>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-colors disabled:opacity-50"
              style={{ background: clubColor, color: '#0f172a' }}
            >
              {saving ? <Loader size={12} className="animate-spin" /> : <Save size={12} />}
              {saving ? 'Ukladám…' : 'Uložiť'}
            </button>
          </div>
        </div>

        {/* Lang / SEO tabs */}
        <div className="flex items-center px-5 gap-1 border-t border-slate-800/60">
          {LANG_TABS.map(({ id, label }) => {
            const active = lang === id
            return (
              <button
                key={id}
                onClick={() => setLang(id)}
                className={`px-3 py-2.5 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${
                  active
                    ? 'text-white border-current'
                    : 'text-slate-600 border-transparent hover:text-slate-400'
                }`}
                style={active ? { borderBottomColor: clubColor, color: clubColor } : {}}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Editor body */}
      <div className="flex-1 p-6 max-w-4xl w-full mx-auto space-y-4">

        {lang === 'sk' && (
          <>
            <div>
              <label className={L}>Názov stránky (SK)</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="História klubu"
                className={I}
              />
            </div>
            <div className="flex-1">
              <label className={L}>Obsah (SK)</label>
              <RichTextEditor
                content={form.content}
                onChange={(html) => set('content', html)}
                clubId={clubId}
                placeholder="Začnite písať obsah stránky…"
              />
            </div>
          </>
        )}

        {lang === 'en' && (
          <>
            <div>
              <label className={L}>Page title (EN)</label>
              <input
                type="text"
                value={form.title_en}
                onChange={(e) => set('title_en', e.target.value)}
                placeholder="Club History"
                className={I}
              />
            </div>
            <div className="flex-1">
              <label className={L}>Content (EN)</label>
              <RichTextEditor
                content={form.content_en}
                onChange={(html) => set('content_en', html)}
                clubId={clubId}
                placeholder="Start writing the English content…"
              />
            </div>
          </>
        )}

        {lang === 'seo' && (
          <div className="max-w-xl space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <p className={L}>SEO nastavenia</p>

              <div>
                <label className={L}>Meta popis (SK)</label>
                <textarea
                  value={form.metaDescription}
                  onChange={(e) => set('metaDescription', e.target.value)}
                  placeholder="Krátky popis stránky pre vyhľadávače…"
                  rows={3}
                  maxLength={160}
                  className={`${I} resize-none`}
                />
                <p className={`mt-1 text-right ${form.metaDescription.length > 140 ? 'text-yellow-400' : 'text-slate-600'} text-[10px] font-mono`}>
                  {form.metaDescription.length}/160
                </p>
              </div>

              <div className="pt-2 space-y-1.5 border-t border-slate-800">
                <p className={L}>Náhľad vo vyhľadávači</p>
                <div className="p-3 bg-slate-800/50 rounded-xl space-y-0.5">
                  <p className="text-xs text-blue-400 font-medium">
                    liga3vychod.sk/kluby/{clubId}/strana/{page.slug}
                  </p>
                  <p className="text-sm text-white font-bold leading-tight">{form.title || 'Názov stránky'}</p>
                  <p className="text-xs text-slate-400 leading-snug line-clamp-2">
                    {form.metaDescription || 'Pridajte meta popis stránky…'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function PagesManager() {
  const { clubSlug } = useParams()
  const { isSuperadmin, userData, loading: authLoading } = useAuth()

  const [view,      setView]      = useState('list')   // 'list' | 'edit'
  const [editing,   setEditing]   = useState(null)
  const [pages,     setPages]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showNew,   setShowNew]   = useState(false)

  // ── Access guard ────────────────────────────────────────────────────────
  if (authLoading) return null
  const configClub = getClubBySlug(clubSlug)
  const clubColor  = configClub?.color ?? '#facc15'
  const clubId     = configClub ? String(configClub.id) : null

  const userClubs  = userData?.clubs ?? []
  const hasAccess  = isSuperadmin || (configClub && userClubs.includes(configClub.name))

  if (!hasAccess) {
    const myClubName = userData?.clubs?.[0]
    const mySlug = myClubName ? getClubByName(myClubName)?.slug : null
    return <Navigate to={mySlug ? `/admin/clubs/${mySlug}` : '/admin/unauthorized'} replace />
  }
  if (!clubId) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <p className="text-slate-500 text-sm font-bold">Klub nenájdený</p>
    </div>
  )
  // ────────────────────────────────────────────────────────────────────────

  // Load pages
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const loadPages = useCallback(async () => {
    setLoading(true)
    try {
      const snap  = await getDocs(collection(db, 'clubs', clubId, 'pages'))
      const docs  = snap.docs.map((d) => ({ id: d.id, slug: d.id, ...d.data() }))
      const slugsLoaded = new Set(docs.map((d) => d.slug))

      // Add predefined stubs for pages that don't exist in Firestore yet
      const stubs = PREDEFINED
        .filter((p) => !slugsLoaded.has(p.slug))
        .map((p) => ({ ...p, content: '', content_en: '', published: false, predefined: true }))

      setPages([...docs, ...stubs].sort((a, b) => {
        // Predefined first, then alphabetical
        const ai = PREDEFINED.findIndex((p) => p.slug === a.slug)
        const bi = PREDEFINED.findIndex((p) => p.slug === b.slug)
        if (ai !== -1 && bi !== -1) return ai - bi
        if (ai !== -1) return -1
        if (bi !== -1) return 1
        return (a.title ?? '').localeCompare(b.title ?? '')
      }))
    } finally {
      setLoading(false)
    }
  }, [clubId])

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { loadPages() }, [loadPages])

  const existingSlugs = new Set(pages.map((p) => p.slug))

  async function createPage({ title, slug }) {
    const newPage = {
      slug,
      title,
      title_en:        '',
      content:         '',
      content_en:      '',
      metaDescription: '',
      published:       false,
      createdAt:       serverTimestamp(),
      updatedAt:       serverTimestamp(),
    }
    try {
      await setDoc(doc(db, 'clubs', clubId, 'pages', slug), newPage)
      setShowNew(false)
      await loadPages()
      const fresh = { id: slug, ...newPage }
      setEditing(fresh)
      setView('edit')
    } catch {
      toast.error('Chyba pri vytváraní stránky')
    }
  }

  async function togglePublish(page) {
    try {
      await setDoc(
        doc(db, 'clubs', clubId, 'pages', page.slug),
        { published: !page.published, updatedAt: serverTimestamp() },
        { merge: true },
      )
      await loadPages()
      toast.success(page.published ? 'Stránka skrytá' : 'Stránka zverejnená')
    } catch {
      toast.error('Chyba')
    }
  }

  async function deletePage(page) {
    if (!window.confirm(`Naozaj odstrániť stránku „${page.title}"?`)) return
    try {
      await deleteDoc(doc(db, 'clubs', clubId, 'pages', page.slug))
      await loadPages()
      toast.success('Stránka odstránená')
    } catch {
      toast.error('Chyba pri odstraňovaní')
    }
  }

  // ── Edit view ────────────────────────────────────────────────────────────
  if (view === 'edit' && editing) {
    return (
      <EditorView
        page={editing}
        clubId={clubId}
        clubSlug={clubSlug}
        clubColor={clubColor}
        onBack={() => { setView('list'); setEditing(null) }}
        onSaved={async (updated) => {
          setEditing(updated)
          await loadPages()
        }}
      />
    )
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4 px-5 h-14">
          <Link
            to={`/admin/clubs/${clubSlug}`}
            className="flex items-center gap-1.5 text-slate-500 hover:text-yellow-400 text-xs font-bold transition-colors shrink-0"
          >
            <ArrowLeft size={13} />
            {configClub?.name ?? clubSlug}
          </Link>

          <div className="w-px h-5 bg-slate-800 shrink-0" />

          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: clubColor }}
          >
            <FileText size={13} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white leading-tight">Stránky</p>
            <p className="text-[11px] font-bold" style={{ color: clubColor }}>{configClub?.name}</p>
          </div>

          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-colors hover:opacity-90"
            style={{ background: clubColor, color: '#0f172a' }}
          >
            <Plus size={13} /> Nová stránka
          </button>
        </div>
        <div className="h-0.5 w-full" style={{ background: clubColor }} />
      </header>

      {/* Page grid */}
      <main className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader size={20} className="animate-spin text-slate-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
            {pages.map((page) => (
              <PageCard
                key={page.slug}
                page={page}
                clubSlug={clubSlug}
                clubId={clubId}
                clubColor={clubColor}
                onEdit={(p) => { setEditing(p); setView('edit') }}
                onDelete={deletePage}
                onTogglePublish={togglePublish}
              />
            ))}
          </div>
        )}
      </main>

      {/* New-page modal */}
      {showNew && (
        <NewPageModal
          existingSlugs={existingSlugs}
          onConfirm={createPage}
          onCancel={() => setShowNew(false)}
        />
      )}
    </div>
  )
}
