import { Link } from 'react-router-dom'
import { GalleryThumbnails, Youtube, ChevronRight } from 'lucide-react'

export default function AlbumCard({ album }) {
  const thumb = album.coverUrl ?? null

  return (
    <Link
      to={`/admin/media/${album.id}`}
      className="bg-white border border-slate-100 rounded-xl overflow-hidden hover:border-slate-200 hover:shadow-sm transition-all group"
    >
      {/* Cover */}
      <div className="w-full h-36 bg-slate-100 relative overflow-hidden">
        {thumb ? (
          <img src={thumb} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <GalleryThumbnails size={28} className="text-slate-300" />
          </div>
        )}
        {album.itemCount > 0 && (
          <span className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {album.itemCount}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate group-hover:text-green-700 transition-colors">
              {album.title}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{album.club}</p>
          </div>
          <ChevronRight size={13} className="text-slate-300 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="flex items-center gap-2 mt-2">
          {album.round && (
            <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded">
              {album.round}. kolo
            </span>
          )}
          {album.season && (
            <span className="text-xs text-slate-400">{album.season}</span>
          )}
          {album.youtubeCount > 0 && (
            <span className="ml-auto flex items-center gap-1 text-xs text-red-500 font-bold">
              <Youtube size={11} /> {album.youtubeCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
