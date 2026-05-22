import { useState, useEffect, useMemo } from 'react'
import { GalleryThumbnails, Plus, ChevronDown, RefreshCw } from 'lucide-react'
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { db } from '../../services/firebase'
import { CLUBS } from '../../data/placeholder'
import AdminLayout from '../../components/admin/AdminLayout'
import AlbumCard from '../../components/admin/media/AlbumCard'
import AlbumModal from '../../components/admin/media/AlbumModal'

const SEASONS = ['2025/26', '2024/25', '2023/24']

export default function Media() {
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAlbumModal, setShowAlbumModal] = useState(false)

  const [clubFilter, setClubFilter] = useState('all')
  const [seasonFilter, setSeasonFilter] = useState('all')

  async function load() {
    setLoading(true)
    try {
      const q = query(collection(db, 'media_albums'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      // For each album, fetch item count from subcollection
      const albumDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      const withCounts = await Promise.all(
        albumDocs.map(async (album) => {
          try {
            const itemsSnap = await getDocs(collection(db, 'media_albums', album.id, 'items'))
            const youtubeCount = itemsSnap.docs.filter((d) => d.data().type === 'youtube').length
            return { ...album, itemCount: itemsSnap.size, youtubeCount }
          } catch {
            return { ...album, itemCount: 0, youtubeCount: 0 }
          }
        })
      )
      setAlbums(withCounts)
    } catch {
      // Fallback without ordering if index missing
      try {
        const snap = await getDocs(collection(db, 'media_albums'))
        setAlbums(snap.docs.map((d) => ({ id: d.id, itemCount: 0, youtubeCount: 0, ...d.data() })))
      } catch {
        toast.error('Chyba pri načítaní albumov')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    return albums.filter((a) => {
      if (clubFilter !== 'all' && a.club !== clubFilter) return false
      if (seasonFilter !== 'all' && a.season !== seasonFilter) return false
      return true
    })
  }, [albums, clubFilter, seasonFilter])

  const totalPhotos = albums.reduce((s, a) => s + (a.itemCount - a.youtubeCount), 0)
  const totalVideos = albums.reduce((s, a) => s + a.youtubeCount, 0)

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900">Médiá</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {albums.length} albumov · {totalPhotos} fotografií · {totalVideos} videí
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-bold hover:bg-white transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Obnoviť</span>
            </button>
            <button
              onClick={() => setShowAlbumModal(true)}
              className="flex items-center gap-2 bg-yellow-400 text-slate-950 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-yellow-300 transition-colors"
            >
              <Plus size={15} /> Nový album
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <select
              value={clubFilter}
              onChange={(e) => setClubFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-yellow-400 transition-colors cursor-pointer"
            >
              <option value="all">Všetky kluby</option>
              <option value="Liga">Liga</option>
              {CLUBS.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-yellow-400 transition-colors cursor-pointer"
            >
              <option value="all">Všetky sezóny</option>
              {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {(clubFilter !== 'all' || seasonFilter !== 'all') && (
            <button
              onClick={() => { setClubFilter('all'); setSeasonFilter('all') }}
              className="text-xs text-slate-400 hover:text-slate-700 font-bold transition-colors"
            >
              Zrušiť filtre ×
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 overflow-hidden animate-pulse">
                <div className="h-36 bg-slate-100" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 flex flex-col items-center justify-center py-20 text-slate-300">
            <GalleryThumbnails size={40} className="mb-3" />
            <p className="text-sm font-bold">
              {albums.length === 0 ? 'Žiadne albumy' : 'Žiadne výsledky pre tento filter'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        )}
      </div>

      {showAlbumModal && (
        <AlbumModal
          album={null}
          onClose={() => setShowAlbumModal(false)}
          onSaved={() => { setShowAlbumModal(false); load() }}
        />
      )}
    </AdminLayout>
  )
}
