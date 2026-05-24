/**
 * PageView.jsx
 *
 * Public CMS page renderer at /kluby/:clubId/strana/:pageSlug
 * Fetches the page doc from Firestore, sanitizes HTML via DOMPurify,
 * and injects SEO meta tags via react-helmet-async.
 *
 * Shows a 404 state if the page doesn't exist or is not published.
 */

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { Helmet } from 'react-helmet-async'
import DOMPurify from 'dompurify'
import { db } from '../../../services/firebase'
import { CLUBS_2025_26 } from '../../../config/clubs-config'
import Navbar  from '../../../components/public/Navbar'
import Footer  from '../../../components/public/Footer'
import { ChevronLeft, FileText, Loader, Home } from 'lucide-react'
import '../../../components/admin/RichTextEditor.css'

// Resolve club config by numeric string ID
function getClubConfig(clubId) {
  return CLUBS_2025_26.find((c) => String(c.id) === String(clubId)) ?? null
}

// ── 404 state ──────────────────────────────────────────────────────────────
function NotFound({ clubId, clubConfig }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24 px-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mb-2">
          <FileText size={24} className="text-slate-600" />
        </div>
        <h1 className="text-2xl font-black text-white">Stránka nenájdená</h1>
        <p className="text-slate-500 text-sm text-center max-w-sm">
          Táto stránka neexistuje alebo momentálne nie je verejne dostupná.
        </p>
        <div className="flex items-center gap-3 mt-2">
          {clubId && (
            <Link
              to={`/kluby/${clubId}`}
              className="flex items-center gap-1.5 text-sm font-bold text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              <ChevronLeft size={14} />
              {clubConfig?.name ?? 'Späť na klub'}
            </Link>
          )}
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Home size={14} /> Domov
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function PageView() {
  const { clubId, pageSlug } = useParams()
  const [page,    setPage]    = useState(null)
  const [status,  setStatus]  = useState('loading')  // 'loading' | 'found' | 'notfound'

  const clubConfig = getClubConfig(clubId)
  const clubColor  = clubConfig?.color ?? '#facc15'

  useEffect(() => {
    if (!clubId || !pageSlug) { setStatus('notfound'); return }
    setStatus('loading')

    getDoc(doc(db, 'clubs', String(clubId), 'pages', pageSlug))
      .then((snap) => {
        if (snap.exists() && snap.data().published) {
          setPage(snap.data())
          setStatus('found')
        } else {
          setStatus('notfound')
        }
      })
      .catch(() => setStatus('notfound'))
  }, [clubId, pageSlug])

  // Loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader size={20} className="animate-spin text-slate-600" />
        </div>
        <Footer />
      </div>
    )
  }

  // Not found
  if (status === 'notfound') {
    return <NotFound clubId={clubId} clubConfig={clubConfig} />
  }

  // Sanitize
  const safeHtml = DOMPurify.sanitize(page.content ?? '', {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'width', 'height'],
    // Only allow youtube/vimeo iframes
    FORBID_ATTR: [],
    CUSTOM_ELEMENT_HANDLING: {
      tagNameCheck: null,
      attributeNameCheck: null,
      allowCustomizedBuiltInElements: false,
    },
  })

  const siteTitle = 'Liga 3 Východ'
  const pageTitle = page.title ?? pageSlug
  const metaDesc  = page.metaDescription || `${pageTitle} — ${clubConfig?.name ?? ''}`

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Helmet>
        <title>{pageTitle} — {clubConfig?.name ?? ''} | {siteTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta property="og:title"       content={`${pageTitle} — ${clubConfig?.name ?? ''}`} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:type"        content="article" />
      </Helmet>

      <Navbar />

      {/* Club color accent */}
      <div className="h-1 w-full" style={{ background: clubColor }} />

      {/* Breadcrumb */}
      <div className="border-b border-slate-800/60 bg-slate-900/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-2 text-xs text-slate-600">
            <Link to="/" className="hover:text-slate-400 transition-colors">Domov</Link>
            <span>/</span>
            <Link to="/kluby" className="hover:text-slate-400 transition-colors">Kluby</Link>
            <span>/</span>
            <Link to={`/kluby/${clubId}`} className="hover:text-slate-400 transition-colors">
              {clubConfig?.name ?? clubId}
            </Link>
            <span>/</span>
            <span className="text-slate-400">{pageTitle}</span>
          </nav>
        </div>
      </div>

      {/* Article */}
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

          {/* Page header */}
          <div className="mb-8">
            <div
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg mb-4"
              style={{ background: `${clubColor}18`, color: clubColor }}
            >
              <FileText size={11} />
              {clubConfig?.name ?? 'Klub'}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              {pageTitle}
            </h1>
            {page.updatedAt?.toDate && (
              <p className="text-xs text-slate-600 mt-2">
                Aktualizované {page.updatedAt.toDate().toLocaleDateString('sk-SK', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-800 mb-8" />

          {/* Rich HTML content */}
          <div
            className="rich-content"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />

          {/* Back link */}
          <div className="mt-12 pt-6 border-t border-slate-800">
            <Link
              to={`/kluby/${clubId}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-yellow-400 transition-colors"
            >
              <ChevronLeft size={14} />
              Späť na profil {clubConfig?.name ?? 'klubu'}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
