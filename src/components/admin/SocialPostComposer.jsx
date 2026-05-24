/**
 * SocialPostComposer.jsx
 *
 * Unified Facebook + Instagram post composer.
 *
 * Credentials are stored in Firestore (never in localStorage):
 *   clubs/{clubId}/social_credentials/facebook  → { pageId, pageName, accessToken }
 *   clubs/{clubId}/social_credentials/instagram → { accountId, username, profilePicture, accessToken }
 *
 * Post history lives at:
 *   clubs/{clubId}/social_posts/{postId}
 *
 * Instagram requires a Business or Creator account linked to the Facebook Page.
 * The access token must be a Page Access Token (long-lived or standard).
 */

import { useState, useEffect, useRef } from 'react'
import {
  doc, getDoc, setDoc, addDoc, collection, onSnapshot,
  serverTimestamp, query, orderBy, limit,
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../services/firebase'
import {
  Facebook, Instagram, Link2, Link2Off, Send, Image as ImageIcon,
  X, CheckCircle2, Loader, Clock, AlertCircle, ExternalLink,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Constants ──────────────────────────────────────────────────────────────
const GRAPH = 'https://graph.facebook.com/v19.0'

const CHAR_LIMITS = {
  facebook:  63206,
  instagram: 2200,
}

const WARN_AT = {
  facebook:  1000,
  instagram: 1800,
}

// ── Helpers ────────────────────────────────────────────────────────────────
const L = 'block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5'
const I = 'w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition-colors'

async function graphGet(path, token) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${GRAPH}${path}${sep}access_token=${token}`)
  return res.json()
}

async function graphPost(path, token, body) {
  const res = await fetch(`${GRAPH}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ ...body, access_token: token }),
  })
  return res.json()
}

function CharCounter({ text, platform }) {
  const max  = CHAR_LIMITS[platform]
  const warn = WARN_AT[platform]
  const len  = text.length
  const pct  = len / max
  const color = pct > 1 ? '#ef4444' : pct > 0.9 ? '#f97316' : len > warn ? '#facc15' : '#475569'
  return (
    <span className="text-[10px] font-mono tabular-nums" style={{ color }}>
      {len.toLocaleString()} / {max.toLocaleString()}
    </span>
  )
}

// ── Facebook connection card ───────────────────────────────────────────────
function FacebookCard({ clubId, creds, onConnected }) {
  const [open,    setOpen]    = useState(!creds)
  const [pageId,  setPageId]  = useState(creds?.pageId  ?? '')
  const [token,   setToken]   = useState(creds?.accessToken ?? '')
  const [saving,  setSaving]  = useState(false)

  async function connect(e) {
    e.preventDefault()
    if (!pageId.trim() || !token.trim()) return
    setSaving(true)
    try {
      // Verify token by fetching page info
      const data = await graphGet(`/${pageId.trim()}?fields=name,fan_count`, token.trim())
      if (data.error) throw new Error(data.error.message)

      await setDoc(
        doc(db, 'clubs', clubId, 'social_credentials', 'facebook'),
        { pageId: pageId.trim(), pageName: data.name ?? pageId.trim(), accessToken: token.trim(), connectedAt: serverTimestamp() },
        { merge: true },
      )
      toast.success(`Facebook stránka „${data.name}" prepojená`)
      setOpen(false)
      onConnected?.()
    } catch (err) {
      toast.error(`Chyba: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function disconnect() {
    await setDoc(
      doc(db, 'clubs', clubId, 'social_credentials', 'facebook'),
      { pageId: '', pageName: '', accessToken: '', disconnectedAt: serverTimestamp() },
      { merge: true },
    )
    toast.success('Facebook odpojený')
    onConnected?.()
  }

  const isConnected = Boolean(creds?.pageId && creds?.accessToken)

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-800/40 transition-colors"
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#1877f2' }}>
          <Facebook size={15} className="text-white" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-black text-white leading-tight">Facebook</p>
          {isConnected
            ? <p className="text-[11px] text-green-400 font-bold truncate">{creds.pageName}</p>
            : <p className="text-[11px] text-slate-600 font-bold">Nie je prepojený</p>
          }
        </div>
        {isConnected
          ? <CheckCircle2 size={14} className="text-green-400 shrink-0" />
          : <Link2 size={14} className="text-slate-600 shrink-0" />
        }
        {open ? <ChevronUp size={13} className="text-slate-600 shrink-0" /> : <ChevronDown size={13} className="text-slate-600 shrink-0" />}
      </button>

      {open && (
        <form onSubmit={connect} className="px-4 pb-4 space-y-3 border-t border-slate-800">
          <p className="text-[11px] text-slate-500 pt-3 leading-relaxed">
            Zadajte ID Facebook stránky a Page Access Token. Token získate cez{' '}
            <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer"
               className="text-blue-400 hover:text-blue-300 underline">
              Graph API Explorer
            </a>{' '}alebo Meta Business Suite.
          </p>
          <div>
            <label className={L}>Page ID</label>
            <input type="text" value={pageId} onChange={(e) => setPageId(e.target.value)}
              placeholder="123456789" className={I} />
          </div>
          <div>
            <label className={L}>Page Access Token</label>
            <input type="password" value={token} onChange={(e) => setToken(e.target.value)}
              placeholder="EAABsbCS0…" className={I} autoComplete="off" />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!pageId.trim() || !token.trim() || saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black disabled:opacity-40 hover:bg-blue-500 transition-colors"
            >
              {saving ? <Loader size={12} className="animate-spin" /> : <Link2 size={12} />}
              {saving ? 'Overujem…' : 'Pripojiť'}
            </button>
            {isConnected && (
              <button
                type="button"
                onClick={disconnect}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-red-400 text-xs font-black hover:bg-red-500/10 transition-colors"
              >
                <Link2Off size={12} /> Odpojiť
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}

// ── Instagram connection card ──────────────────────────────────────────────
function InstagramCard({ clubId, creds, fbCreds, onConnected }) {
  const [open,        setOpen]        = useState(false)
  const [connecting,  setConnecting]  = useState(false)

  async function connectInstagram() {
    if (!fbCreds?.pageId || !fbCreds?.accessToken) {
      toast.error('Najprv prepojte Facebook stránku')
      return
    }
    setConnecting(true)
    try {
      // Get Instagram business account linked to the FB page
      const pageData = await graphGet(
        `/${fbCreds.pageId}?fields=instagram_business_account`,
        fbCreds.accessToken,
      )
      if (pageData.error) throw new Error(pageData.error.message)

      if (!pageData.instagram_business_account) {
        toast.error('Táto Facebook stránka nemá prepojený Instagram Business účet')
        return
      }

      const igId   = pageData.instagram_business_account.id
      const igData = await graphGet(
        `/${igId}?fields=username,profile_picture_url,followers_count,media_count`,
        fbCreds.accessToken,
      )
      if (igData.error) throw new Error(igData.error.message)

      await setDoc(
        doc(db, 'clubs', clubId, 'social_credentials', 'instagram'),
        {
          accountId:      igId,
          username:       igData.username,
          profilePicture: igData.profile_picture_url ?? null,
          followersCount: igData.followers_count ?? 0,
          mediaCount:     igData.media_count ?? 0,
          accessToken:    fbCreds.accessToken,   // IG uses the same Page token
          connectedAt:    serverTimestamp(),
        },
        { merge: true },
      )
      toast.success(`Instagram @${igData.username} prepojený`)
      setOpen(false)
      onConnected?.()
    } catch (err) {
      toast.error(`Chyba: ${err.message}`)
    } finally {
      setConnecting(false)
    }
  }

  async function disconnect() {
    await setDoc(
      doc(db, 'clubs', clubId, 'social_credentials', 'instagram'),
      { accountId: '', username: '', accessToken: '', disconnectedAt: serverTimestamp() },
      { merge: true },
    )
    toast.success('Instagram odpojený')
    onConnected?.()
  }

  const isConnected  = Boolean(creds?.accountId && creds?.accessToken)
  const fbConnected  = Boolean(fbCreds?.pageId  && fbCreds?.accessToken)

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-800/40 transition-colors"
      >
        {/* Instagram gradient icon */}
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }}>
          {creds?.profilePicture
            ? <img src={creds.profilePicture} className="w-full h-full rounded-xl object-cover" alt="" />
            : <Instagram size={15} className="text-white" />
          }
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-black text-white leading-tight">Instagram</p>
          {isConnected
            ? <p className="text-[11px] text-pink-400 font-bold truncate">@{creds.username}</p>
            : <p className="text-[11px] text-slate-600 font-bold">
                {fbConnected ? 'Kliknutím prepojíte IG účet' : 'Najprv prepojte Facebook'}
              </p>
          }
        </div>
        {isConnected
          ? <CheckCircle2 size={14} className="text-green-400 shrink-0" />
          : <Link2 size={14} className={fbConnected ? 'text-pink-400 shrink-0' : 'text-slate-700 shrink-0'} />
        }
        {open ? <ChevronUp size={13} className="text-slate-600 shrink-0" /> : <ChevronDown size={13} className="text-slate-600 shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-800">
          {!fbConnected ? (
            <div className="flex items-start gap-2 pt-3">
              <AlertCircle size={13} className="text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500">
                Instagram Business účet sa pripojí automaticky z vašej Facebook stránky.
                Najprv prepojte Facebook stránku vyššie.
              </p>
            </div>
          ) : (
            <div className="pt-3 space-y-3">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Prepojenie Instagram Business účtu cez Facebook stránku{' '}
                <strong className="text-slate-300">{fbCreds.pageName}</strong>.<br />
                Uistite sa, že je Instagram Business účet prepojený s touto stránkou v Meta Business Suite.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={connectInstagram}
                  disabled={connecting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-black disabled:opacity-40 hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg,#f09433,#dc2743,#bc1888)' }}
                >
                  {connecting ? <Loader size={12} className="animate-spin" /> : <Instagram size={12} />}
                  {connecting ? 'Hľadám IG účet…' : 'Pripojiť Instagram'}
                </button>
                {isConnected && (
                  <button
                    type="button"
                    onClick={disconnect}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-red-400 text-xs font-black hover:bg-red-500/10 transition-colors"
                  >
                    <Link2Off size={12} /> Odpojiť
                  </button>
                )}
              </div>
              {isConnected && (
                <a
                  href={`https://instagram.com/${creds.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-pink-400/70 hover:text-pink-400 transition-colors font-bold"
                >
                  <ExternalLink size={10} /> instagram.com/{creds.username}
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Post history row ───────────────────────────────────────────────────────
function PostRow({ post }) {
  const dt = post.publishedAt?.toDate?.() ?? null
  const platformColor = post.platform === 'facebook' ? '#1877f2'
    : post.platform === 'instagram' ? '#e1306c' : '#475569'
  const PlatformIcon = post.platform === 'facebook' ? Facebook : Instagram

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${platformColor}22` }}>
        <PlatformIcon size={11} style={{ color: platformColor }} />
      </div>
      {post.imageUrl && (
        <img src={post.imageUrl} alt=""
          className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-700" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{post.caption || post.message || '—'}</p>
        <div className="flex items-center gap-2 mt-1">
          {dt && (
            <span className="text-[10px] text-slate-600 flex items-center gap-1">
              <Clock size={9} />
              {dt.toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {post.postId && (
            <a
              href={
                post.platform === 'instagram'
                  ? `https://instagram.com/p/${post.postId}/`
                  : `https://facebook.com/${post.postId}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-slate-600 hover:text-slate-400 flex items-center gap-0.5 transition-colors"
            >
              <ExternalLink size={9} /> Zobraziť
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function SocialPostComposer({ clubId, clubColor }) {
  // Credentials
  const [fbCreds,  setFbCreds]  = useState(null)
  const [igCreds,  setIgCreds]  = useState(null)
  const [credsLoading, setCredsLoading] = useState(true)

  // Composer state
  const [caption,  setCaption]  = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [platforms, setPlatforms] = useState({ facebook: true, instagram: true })
  const [publishing, setPublishing] = useState(false)

  // Post history
  const [posts,     setPosts]     = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const fileInputRef = useRef(null)

  // Load credentials
  useEffect(() => {
    if (!clubId) return
    let loaded = 0
    const done = () => { if (++loaded === 2) setCredsLoading(false) }

    getDoc(doc(db, 'clubs', clubId, 'social_credentials', 'facebook'))
      .then((s) => { setFbCreds(s.exists() && s.data().pageId ? s.data() : null); done() })
      .catch(() => done())

    getDoc(doc(db, 'clubs', clubId, 'social_credentials', 'instagram'))
      .then((s) => { setIgCreds(s.exists() && s.data().accountId ? s.data() : null); done() })
      .catch(() => done())
  }, [clubId])

  // Post history
  useEffect(() => {
    if (!clubId) return
    const q = query(
      collection(db, 'clubs', clubId, 'social_posts'),
      orderBy('publishedAt', 'desc'),
      limit(20),
    )
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }, () => {})
    return unsub
  }, [clubId])

  function reloadCreds() {
    if (!clubId) return
    getDoc(doc(db, 'clubs', clubId, 'social_credentials', 'facebook'))
      .then((s) => setFbCreds(s.exists() && s.data().pageId ? s.data() : null)).catch(() => {})
    getDoc(doc(db, 'clubs', clubId, 'social_credentials', 'instagram'))
      .then((s) => setIgCreds(s.exists() && s.data().accountId ? s.data() : null)).catch(() => {})
  }

  // ── Image handling ────────────────────────────────────────────────────
  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
    // Reset the input so the same file can be re-selected
    e.target.value = ''
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
  }

  async function uploadImage(file) {
    const ext  = file.name.split('.').pop()
    const path = `clubs/${clubId}/social_uploads/${Date.now()}.${ext}`
    const fileRef = storageRef(storage, path)
    await uploadBytes(fileRef, file)
    return getDownloadURL(fileRef)
  }

  // ── Post to Facebook ──────────────────────────────────────────────────
  async function postToFacebook(imageUrl) {
    const { pageId, accessToken } = fbCreds
    let data

    if (imageUrl) {
      // Photo post
      data = await graphPost(`/${pageId}/photos`, accessToken, {
        url:     imageUrl,
        message: caption,
      })
    } else {
      // Text-only post
      data = await graphPost(`/${pageId}/feed`, accessToken, {
        message: caption,
      })
    }

    if (data.error) throw new Error(`Facebook: ${data.error.message}`)

    await addDoc(collection(db, 'clubs', clubId, 'social_posts'), {
      platform:    'facebook',
      postId:      data.id ?? data.post_id ?? null,
      message:     caption,
      imageUrl:    imageUrl ?? null,
      publishedAt: serverTimestamp(),
    })
    return data.id ?? data.post_id
  }

  // ── Post to Instagram ─────────────────────────────────────────────────
  async function postToInstagram(imageUrl) {
    if (!imageUrl) throw new Error('Instagram vyžaduje obrázok')
    const { accountId, accessToken } = igCreds

    // Step 1: Create media container
    const containerData = await graphPost(`/${accountId}/media`, accessToken, {
      image_url: imageUrl,
      caption,
    })
    if (containerData.error) throw new Error(`IG container: ${containerData.error.message}`)

    // Step 2: Publish
    const publishData = await graphPost(`/${accountId}/media_publish`, accessToken, {
      creation_id: containerData.id,
    })
    if (publishData.error) throw new Error(`IG publish: ${publishData.error.message}`)

    await addDoc(collection(db, 'clubs', clubId, 'social_posts'), {
      platform:    'instagram',
      postId:      publishData.id,
      caption,
      imageUrl,
      publishedAt: serverTimestamp(),
    })
    return publishData.id
  }

  // ── Publish handler ───────────────────────────────────────────────────
  async function handlePublish() {
    if (!caption.trim() && !imageFile) {
      toast.error('Pridajte text alebo obrázok')
      return
    }
    if (platforms.instagram && !imageFile) {
      toast.error('Instagram vyžaduje obrázok')
      return
    }
    if (!platforms.facebook && !platforms.instagram) {
      toast.error('Vyberte aspoň jednu platformu')
      return
    }

    setPublishing(true)
    let imageUrl = null

    try {
      // Upload image once if needed
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }

      const jobs = []
      if (platforms.facebook && fbCreds) jobs.push({ label: 'Facebook', fn: () => postToFacebook(imageUrl) })
      if (platforms.instagram && igCreds) jobs.push({ label: 'Instagram', fn: () => postToInstagram(imageUrl) })

      if (jobs.length === 0) {
        toast.error('Žiadna platforma nie je prepojená')
        return
      }

      const results = await Promise.allSettled(jobs.map(({ fn }) => fn()))
      const failed  = results.filter((r) => r.status === 'rejected')
      const passed  = results.filter((r) => r.status === 'fulfilled')

      if (passed.length > 0) {
        const names = passed.map((_, i) => jobs[i].label).join(' + ')
        toast.success(`Príspevok zverejnený: ${names}`)
        setCaption('')
        clearImage()
      }
      if (failed.length > 0) {
        failed.forEach((r, i) => toast.error(`${jobs[i].label}: ${r.reason?.message ?? 'Chyba'}`))
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPublishing(false)
    }
  }

  // ── Derived state ─────────────────────────────────────────────────────
  const fbConnected  = Boolean(fbCreds?.pageId)
  const igConnected  = Boolean(igCreds?.accountId)
  const anyConnected = fbConnected || igConnected

  const captionLen   = caption.length
  const overLimitFb  = platforms.facebook  && captionLen > CHAR_LIMITS.facebook
  const overLimitIg  = platforms.instagram && captionLen > CHAR_LIMITS.instagram
  const overLimit    = overLimitFb || overLimitIg

  const canPublish = (caption.trim() || imageFile) && anyConnected
    && (platforms.facebook || platforms.instagram)
    && !(platforms.instagram && !imageFile)
    && !overLimit

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-2xl">

      {/* ── Connections ── */}
      <div className="space-y-2">
        <p className={L}>Prepojené platformy</p>
        {credsLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader size={16} className="animate-spin text-slate-600" />
          </div>
        ) : (
          <>
            <FacebookCard  clubId={clubId} creds={fbCreds}  onConnected={reloadCreds} />
            <InstagramCard clubId={clubId} creds={igCreds}  fbCreds={fbCreds} onConnected={reloadCreds} />
          </>
        )}
      </div>

      {/* ── Composer ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <p className={L}>Nový príspevok</p>

        {/* Platform toggles */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'facebook',  label: 'Facebook',  Icon: Facebook,  color: '#1877f2', connected: fbConnected  },
            { key: 'instagram', label: 'Instagram', Icon: Instagram, color: '#e1306c', connected: igConnected },
          ].map(({ key, label, Icon, color, connected }) => {
            const checked = platforms[key] && connected
            return (
              <button
                key={key}
                type="button"
                disabled={!connected}
                onClick={() => connected && setPlatforms((p) => ({ ...p, [key]: !p[key] }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black border-2 transition-all ${
                  !connected ? 'opacity-30 cursor-not-allowed border-transparent bg-slate-800'
                  : checked ? 'text-white border-transparent'
                  : 'bg-transparent text-slate-500 border-slate-700 hover:border-slate-600'
                }`}
                style={connected && checked ? { background: color, borderColor: color } : {}}
              >
                <Icon size={12} />
                {label}
                {!connected && <span className="text-[9px] opacity-60">neprepojený</span>}
              </button>
            )
          })}
        </div>

        {/* Image upload */}
        <div>
          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-48 h-48 object-cover rounded-xl border border-slate-700"
              />
              {/* Square crop indicator for Instagram */}
              {platforms.instagram && igConnected && (
                <div className="absolute inset-0 rounded-xl ring-2 ring-pink-500/50 pointer-events-none">
                  <span className="absolute bottom-1.5 right-1.5 text-[9px] font-black bg-pink-500/80 text-white px-1.5 py-0.5 rounded">
                    1:1 IG
                  </span>
                </div>
              )}
              <button
                onClick={clearImage}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-400 transition-colors"
              >
                <X size={10} className="text-white" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400 text-xs font-bold transition-all"
            >
              <ImageIcon size={14} />
              Pridať obrázok
              {platforms.instagram && igConnected && (
                <span className="text-pink-400/70 text-[10px]">(povinné pre Instagram)</span>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        {/* Caption textarea */}
        <div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Napíšte váš príspevok…"
            rows={5}
            className={`${I} resize-none`}
          />
          {/* Character counters */}
          <div className="flex justify-end gap-4 mt-1.5">
            {platforms.facebook && fbConnected && (
              <span className="flex items-center gap-1 text-[10px] text-slate-600">
                <Facebook size={9} />
                <CharCounter text={caption} platform="facebook" />
              </span>
            )}
            {platforms.instagram && igConnected && (
              <span className="flex items-center gap-1 text-[10px] text-slate-600">
                <Instagram size={9} />
                <CharCounter text={caption} platform="instagram" />
              </span>
            )}
          </div>
        </div>

        {/* Instagram image warning */}
        {platforms.instagram && igConnected && !imageFile && (
          <div className="flex items-center gap-2 text-[11px] text-yellow-500/80 bg-yellow-400/5 border border-yellow-400/15 rounded-xl px-3 py-2">
            <AlertCircle size={12} className="shrink-0" />
            Instagram vyžaduje obrázok. Pridajte fotografiu pred publikovaním.
          </div>
        )}

        {/* Publish button */}
        <button
          type="button"
          onClick={handlePublish}
          disabled={!canPublish || publishing}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]"
          style={{
            background:  canPublish ? clubColor : 'rgba(100,116,139,0.2)',
            color:       canPublish ? '#0f172a' : '#475569',
            boxShadow:   canPublish ? `0 6px 20px ${clubColor}33` : 'none',
          }}
        >
          {publishing
            ? <><Loader size={15} className="animate-spin" /> Publikujem…</>
            : <><Send size={15} /> Zverejniť</>
          }
        </button>
      </div>

      {/* ── Post history ── */}
      {posts.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowHistory((s) => !s)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/40 transition-colors"
          >
            <p className={`${L} mb-0`}>História príspevkov ({posts.length})</p>
            {showHistory ? <ChevronUp size={13} className="text-slate-600" /> : <ChevronDown size={13} className="text-slate-600" />}
          </button>
          {showHistory && (
            <div className="px-5 pb-3">
              {posts.map((p) => <PostRow key={p.id} post={p} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
