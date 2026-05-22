import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { doc, collection, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../services/firebase'
import { CLUBS } from '../../../data/placeholder'
import CoverUploader from './CoverUploader'

export const CATEGORIES = [
  { value: 'výsledky',      label: 'Výsledky',      cls: 'bg-green-100 text-green-700' },
  { value: 'program',       label: 'Program',        cls: 'bg-blue-100 text-blue-700' },
  { value: 'správy',        label: 'Správy',         cls: 'bg-slate-100 text-slate-600' },
  { value: 'prestup',       label: 'Prestup',        cls: 'bg-purple-100 text-purple-700' },
  { value: 'disciplinárne', label: 'Disciplinárne',  cls: 'bg-red-100 text-red-700' },
  { value: 'rozhovor',      label: 'Rozhovor',       cls: 'bg-yellow-100 text-yellow-700' },
]

function toSlug(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT  = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition-colors bg-white'

export default function ArticleModal({ article, onClose, onSaved }) {
  const isEdit = Boolean(article?.id)
  const [docId] = useState(() => isEdit ? article.id : doc(collection(db, 'news')).id)

  const [form, setForm] = useState({
    title:    article?.title    ?? '',
    slug:     article?.slug     ?? '',
    excerpt:  article?.excerpt  ?? '',
    content:  article?.content  ?? '',
    category: article?.category ?? 'správy',
    club:     article?.club     ?? 'Liga',
    status:   article?.status   ?? 'draft',
  })
  const [slugEdited, setSlugEdited] = useState(isEdit)
  const [coverUrl, setCoverUrl] = useState(article?.coverUrl ?? null)
  const [saving, setSaving] = useState(false)

  const set = (f, v) => setForm((prev) => ({ ...prev, [f]: v }))

  useEffect(() => {
    if (!slugEdited) {
      set('slug', toSlug(form.title))
    }
  }, [form.title, slugEdited])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Zadajte nadpis'); return }
    setSaving(true)
    try {
      const now = serverTimestamp()
      await setDoc(
        doc(db, 'news', docId),
        {
          title:       form.title.trim(),
          slug:        form.slug || toSlug(form.title),
          excerpt:     form.excerpt.trim(),
          content:     form.content.trim(),
          category:    form.category,
          club:        form.club,
          coverUrl:    coverUrl ?? null,
          status:      form.status,
          publishedAt: form.status === 'published' ? (article?.publishedAt ?? now) : null,
          updatedAt:   now,
          ...(isEdit ? {} : { createdAt: now }),
        },
        { merge: true }
      )
      toast.success(isEdit ? 'Článok aktualizovaný' : 'Článok vytvorený')
      onSaved()
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
            {isEdit ? 'Upraviť článok' : 'Nový článok'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className={LABEL}>Nadpis</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className={INPUT}
              placeholder="Bardejov potvrdil líderstvo"
            />
          </div>

          {/* Slug */}
          <div>
            <label className={LABEL}>URL slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => { setSlugEdited(true); set('slug', e.target.value) }}
              className={`${INPUT} font-mono text-xs`}
              placeholder="bardejov-potvrdil-liderstvo"
            />
          </div>

          {/* Category + Club */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Kategória</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className={INPUT}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Klub</label>
              <select value={form.club} onChange={(e) => set('club', e.target.value)} className={INPUT}>
                <option value="Liga">Liga (všetky kluby)</option>
                {CLUBS.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className={LABEL}>Perex</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => set('excerpt', e.target.value)}
              rows={2}
              className={INPUT}
              placeholder="Krátky úvod článku zobrazený v zozname noviniek..."
            />
          </div>

          {/* Content */}
          <div>
            <label className={LABEL}>Obsah článku</label>
            <textarea
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              rows={8}
              className={INPUT}
              placeholder="Celý text článku..."
            />
          </div>

          {/* Cover image */}
          <div>
            <label className={LABEL}>Titulný obrázok</label>
            <CoverUploader docId={docId} currentUrl={coverUrl} onUploaded={setCoverUrl} />
          </div>

          {/* Status */}
          <div>
            <label className={LABEL}>Stav</label>
            <div className="flex gap-3">
              {[
                { value: 'draft',     label: 'Koncept',     desc: 'Neviditeľný pre verejnosť' },
                { value: 'published', label: 'Publikovaný', desc: 'Viditeľný na webe' },
              ].map((s) => (
                <label
                  key={s.value}
                  className={`flex-1 flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                    form.status === s.value
                      ? 'border-yellow-400 bg-yellow-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={s.value}
                    checked={form.status === s.value}
                    onChange={() => set('status', s.value)}
                    className="mt-0.5 accent-yellow-400"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{s.label}</p>
                    <p className="text-xs text-slate-400">{s.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-yellow-400 text-slate-950 text-sm font-black rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Ukladám...' : isEdit ? 'Uložiť zmeny' : 'Vytvoriť článok'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
