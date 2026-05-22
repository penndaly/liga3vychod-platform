import { useRef, useState } from 'react'
import { Upload, Loader, ImageOff } from 'lucide-react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { toast } from 'react-hot-toast'
import { storage } from '../../../services/firebase'

export default function CoverUploader({ docId, currentUrl, onUploaded }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Vyberte obrázok'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Maximálna veľkosť je 5 MB'); return }

    setUploading(true)
    try {
      const storageRef = ref(storage, `news/${docId}/cover`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      toast.success('Obrázok nahratý')
      onUploaded(url)
    } catch {
      toast.error('Chyba pri nahrávaní obrázka')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex items-start gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-32 h-20 rounded-xl border-2 border-dashed border-slate-200 hover:border-yellow-400 flex items-center justify-center overflow-hidden transition-colors focus:outline-none shrink-0"
      >
        {uploading ? (
          <Loader size={18} className="text-slate-400 animate-spin" />
        ) : currentUrl ? (
          <img src={currentUrl} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <ImageOff size={18} className="text-slate-300" />
        )}
      </button>

      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <Upload size={13} />
          {currentUrl ? 'Zmeniť foto' : 'Nahrať foto'}
        </button>
        <p className="text-xs text-slate-400 mt-1.5">PNG, JPG alebo WebP · max 5 MB</p>
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}
