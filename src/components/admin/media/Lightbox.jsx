import { useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

function ytThumb(id) {
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`
}

export function itemThumbnail(item) {
  return item.type === 'youtube' ? ytThumb(item.youtubeId) : item.url
}

export default function Lightbox({ items, index, setIndex, onClose }) {
  const item = items[index]
  const hasPrev = index > 0
  const hasNext = index < items.length - 1

  const prev = useCallback(() => { if (hasPrev) setIndex(index - 1) }, [hasPrev, index, setIndex])
  const next = useCallback(() => { if (hasNext) setIndex(index + 1) }, [hasNext, index, setIndex])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  if (!item) return null

  return (
    <div
      className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
        onClick={onClose}
      >
        <X size={24} />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm font-bold z-10">
        {index + 1} / {items.length}
      </div>

      {/* Prev */}
      {hasPrev && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10 bg-black/30 rounded-full p-2"
          onClick={(e) => { e.stopPropagation(); prev() }}
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Content */}
      <div
        className="max-w-5xl max-h-[85vh] w-full flex flex-col items-center px-16"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === 'youtube' ? (
          <iframe
            src={`https://www.youtube.com/embed/${item.youtubeId}?autoplay=1`}
            allow="autoplay; fullscreen"
            className="w-full aspect-video rounded-lg"
            title={item.title}
          />
        ) : (
          <img
            src={item.url}
            alt={item.title}
            className="max-h-[75vh] max-w-full object-contain rounded-lg"
          />
        )}
        {(item.title || item.caption) && (
          <div className="mt-3 text-center">
            {item.title && <p className="text-white font-bold text-sm">{item.title}</p>}
            {item.caption && <p className="text-white/60 text-xs mt-0.5">{item.caption}</p>}
          </div>
        )}
      </div>

      {/* Next */}
      {hasNext && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10 bg-black/30 rounded-full p-2"
          onClick={(e) => { e.stopPropagation(); next() }}
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Strip */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10" onClick={(e) => e.stopPropagation()}>
          {items.map((it, i) => (
            <button
              key={it.id}
              onClick={() => setIndex(i)}
              className={`w-10 h-7 rounded overflow-hidden border-2 transition-all ${
                i === index ? 'border-yellow-400 opacity-100' : 'border-transparent opacity-40 hover:opacity-70'
              }`}
            >
              <img src={itemThumbnail(it)} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
