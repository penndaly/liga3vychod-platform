import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, deleteDoc, doc, orderBy, query, where } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { Plus, GalleryThumbnails, Youtube, ChevronRight, Trash2, Loader } from 'lucide-react'
import { db } from '../../../services/firebase'
import AlbumModal from '../media/AlbumModal'

function DarkAlbumCard({ album, onDelete }) {
  const thumb = album.coverUrl ?? null

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden hover:border-slate-600 transition-all group relative">
      {/* Cover */}
      <Link to={`/admin/media/${album.id}`} className="block">
        <div className="w-full h-32 bg-slate-800 relative overflow-hidden">
          {thumb ? (
            <img
              src={thumb}
              alt={album.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <GalleryThumbnails size={24} className="text-slate-700" />
            </div>
          )}
          {album.itemCount > 0 && (
            <span className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {album.itemCount}
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/admin/media/${album.id}`} className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-200 truncate hover:text-white transition-colors">
              {album.title}
            </p>
          </Link>
          <ChevronRight size={12} className="text-slate-700 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="flex items-center gap-2 mt-1.5">
          {album.round && (
            <span className="text-xs bg-slate-700/60 text-slate-400 font-bold px-1.5 py-0.5 rounded">
              {album.round}. kolo
            </span>
          )}
          {album.season && (
            <span className="text-xs text-slate-600">{album.season}</span>
          )}
          {album.youtubeCount > 0 && (
            <span className="ml-auto flex items-center gap-1 text-xs text-red-400 font-bold">
              <Youtube size={10} /> {album.youtubeCount}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(album)}
        className="absolute top-2 left-2 bg-black/60 hover:bg-red-600 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all"
        title="Odstrániť album"
      >
        <Trash2 size={10} className="text-white" />
      </button>
    </div>
  )
}

export default function MediaPanel({ data, clubColor = '#facc15' }) {
  const clubName = data.club?.name

  const [albums,  setAlbums]  = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)

  const load = useCallback(async () => {
    if (!clubName) return
    setLoading(true)
    try {
      const q = query(
        collection(db, 'media_albums'),
        where('club', '==', clubName),
        orderBy('createdAt', 'desc'),
      )
      const snap = await getDocs(q).catch(async () =>
        getDocs(query(collection(db, 'media_albums'), where('club', '==', clubName)))
      )
      const albumDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      // fetch item counts in parallel
      const withCounts = await Promise.all(
        albumDocs.map(async (album) => {
          try {
            const items = await getDocs(collection(db, 'media_albums', album.id, 'items'))
            return {
              ...album,
              itemCount:    items.size,
              youtubeCount: items.docs.filter((d) => d.data().type === 'youtube').length,
            }
          } catch {
            return { ...album, itemCount: 0, youtubeCount: 0 }
          }
        })
      )
      setAlbums(withCounts)
    } catch {
      toast.error('Chyba pri načítaní albumov')
    } finally {
      setLoading(false)
    }
  }, [clubName])

  useEffect(() => { load() }, [load])

  async function handleDelete(album) {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Odstrániť album "${album.title}"?`)) return
    try {
      await deleteDoc(doc(db, 'media_albums', album.id))
      toast.success('Album odstránený')
      setAlbums((prev) => prev.filter((a) => a.id !== album.id))
    } catch {
      toast.error('Chyba pri odstraňovaní')
    }
  }

  const totalPhotos = albums.reduce((s, a) => s + (a.itemCount - a.youtubeCount), 0)
  const totalVideos = albums.reduce((s, a) => s + (a.youtubeCount ?? 0), 0)

  return (
    <>
      <div className="space-y-4">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 font-bold">
            {loading ? '…' : `${albums.length} albumov · ${totalPhotos} foto · ${totalVideos} video`}
          </p>
          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-wide px-4 py-2 rounded-xl transition-colors"
            style={{ background: clubColor, color: '#0f172a' }}
          >
            <Plus size={13} /> Nový album
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-slate-800/60 rounded-xl overflow-hidden animate-pulse">
                <div className="h-32 bg-slate-800" />
                <div className="p-3 space-y-2">
                  <div className="h-3.5 bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : albums.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center py-20 text-slate-700">
            <GalleryThumbnails size={32} className="mb-3" />
            <p className="text-sm font-black uppercase tracking-widest mb-1">Žiadne albumy</p>
            <p className="text-xs">Vytvorte prvý fotoalbum pre váš klub</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {albums.map((album) => (
              <DarkAlbumCard key={album.id} album={album} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {modal && (
        <AlbumModal
          album={{ club: clubName }}
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); load() }}
        />
      )}
    </>
  )
}
