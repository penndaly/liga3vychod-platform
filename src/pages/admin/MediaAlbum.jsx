import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Plus, Pencil, Trash2, Youtube, Play } from 'lucide-react'
import { doc, getDoc, collection, getDocs, deleteDoc, orderBy, query } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { db } from '../../services/firebase'
import AdminLayout from '../../components/admin/AdminLayout'
import AlbumModal from '../../components/admin/media/AlbumModal'
import AddMediaModal from '../../components/admin/media/AddMediaModal'
import Lightbox, { itemThumbnail } from '../../components/admin/media/Lightbox'

export default function MediaAlbum() {
  const { albumId } = useParams()

  const [album, setAlbum] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const [editAlbum, setEditAlbum] = useState(false)
  const [addMedia, setAddMedia] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const loadAlbum = useCallback(async () => {
    const snap = await getDoc(doc(db, 'media_albums', albumId))
    setAlbum(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  }, [albumId])

  const loadItems = useCallback(async () => {
    try {
      const q = query(collection(db, 'media_albums', albumId, 'items'), orderBy('createdAt', 'asc'))
      const snap = await getDocs(q)
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch {
      const snap = await getDocs(collection(db, 'media_albums', albumId, 'items'))
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }
  }, [albumId])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadAlbum(), loadItems()]).finally(() => setLoading(false))
  }, [loadAlbum, loadItems])

  async function handleDeleteItem(item) {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Odstrániť túto položku?')) return
    try {
      await deleteDoc(doc(db, 'media_albums', albumId, 'items', item.id))
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      toast.success('Položka odstránená')
    } catch {
      toast.error('Chyba pri odstraňovaní')
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="h-8 w-48 bg-slate-100 rounded animate-pulse mb-4" />
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="break-inside-avoid mb-3 rounded-xl bg-slate-100 animate-pulse" style={{ height: `${120 + (i % 3) * 40}px` }} />
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!album) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-sm text-slate-500">Album nebol nájdený.</p>
          <Link to="/admin/media" className="text-sm text-green-600 font-bold mt-2 inline-block">← Späť na médiá</Link>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        {/* Back + header */}
        <div>
          <Link
            to="/admin/media"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors mb-3"
          >
            <ChevronLeft size={13} /> Späť na médiá
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-black text-slate-900">{album.title}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm text-slate-400">{album.club}</span>
                {album.round && <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded">{album.round}. kolo</span>}
                {album.season && <span className="text-xs text-slate-400">{album.season}</span>}
                <span className="text-xs text-slate-300">·</span>
                <span className="text-xs text-slate-400">{items.length} položiek</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setEditAlbum(true)}
                className="flex items-center gap-2 border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                <Pencil size={13} /> Upraviť
              </button>
              <button
                onClick={() => setAddMedia(true)}
                className="flex items-center gap-2 bg-yellow-400 text-slate-950 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-yellow-300 transition-colors"
              >
                <Plus size={15} /> Pridať médiá
              </button>
            </div>
          </div>
        </div>

        {/* Masonry grid */}
        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 flex flex-col items-center justify-center py-20 text-slate-300">
            <Plus size={32} className="mb-2" />
            <p className="text-sm font-bold">Album je prázdny</p>
            <button
              onClick={() => setAddMedia(true)}
              className="mt-3 text-sm text-yellow-500 font-bold hover:text-yellow-600 transition-colors"
            >
              Pridať médiá →
            </button>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
            {items.map((item, i) => (
              <div key={item.id} className="break-inside-avoid mb-3 group relative rounded-xl overflow-hidden bg-slate-100 cursor-pointer">
                <img
                  src={itemThumbnail(item)}
                  alt={item.title}
                  className="w-full h-auto block group-hover:scale-105 transition-transform duration-300"
                  onClick={() => setLightboxIndex(i)}
                />

                {/* YouTube play overlay */}
                {item.type === 'youtube' && (
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black/30"
                    onClick={() => setLightboxIndex(i)}
                  >
                    <div className="bg-red-600 rounded-full p-3">
                      <Play size={18} className="text-white fill-white" />
                    </div>
                  </div>
                )}

                {/* Hover overlay with actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" onClick={() => setLightboxIndex(i)} />
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.type === 'youtube' && (
                    <span className="bg-red-600 rounded-full p-1">
                      <Youtube size={10} className="text-white" />
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteItem(item) }}
                    className="bg-black/60 hover:bg-red-600 rounded-full p-1 transition-colors"
                  >
                    <Trash2 size={11} className="text-white" />
                  </button>
                </div>

                {item.title && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-bold truncate">{item.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {editAlbum && (
        <AlbumModal
          album={album}
          onClose={() => setEditAlbum(false)}
          onSaved={() => { setEditAlbum(false); loadAlbum() }}
        />
      )}

      {addMedia && (
        <AddMediaModal
          albumId={albumId}
          hasCover={Boolean(album.coverUrl)}
          onClose={() => setAddMedia(false)}
          onSaved={() => { setAddMedia(false); loadAlbum(); loadItems() }}
        />
      )}

      {lightboxIndex !== null && (
        <Lightbox
          items={items}
          index={lightboxIndex}
          setIndex={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </AdminLayout>
  )
}
