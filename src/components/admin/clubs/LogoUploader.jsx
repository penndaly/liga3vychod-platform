import { useRef, useState } from 'react'
import { Upload, Loader } from 'lucide-react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, setDoc } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { storage, db } from '../../../services/firebase'

export default function LogoUploader({ clubId, clubShort, currentUrl, onUploaded }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) { toast.error('Vyberte obrázok'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Maximálna veľkosť je 2 MB'); return }

    setUploading(true)
    try {
      const storageRef = ref(storage, `clubs/${clubId}/logo`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      await setDoc(doc(db, 'clubs', String(clubId)), { logoUrl: url }, { merge: true })
      toast.success('Logo nahraté')
      onUploaded(url)
    } catch {
      toast.error('Chyba pri nahrávaní loga')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex items-center gap-5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 hover:border-yellow-400 flex items-center justify-center overflow-hidden transition-colors focus:outline-none"
      >
        {uploading ? (
          <Loader size={20} className="text-slate-400 animate-spin" />
        ) : currentUrl ? (
          <img src={currentUrl} alt="Logo" className="w-full h-full object-contain p-2" />
        ) : (
          <span className="text-sm font-black text-slate-400">{clubShort}</span>
        )}
      </button>

      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <Upload size={14} />
          {currentUrl ? 'Zmeniť logo' : 'Nahrať logo'}
        </button>
        <p className="text-xs text-slate-400 mt-1.5">PNG alebo SVG · max 2 MB</p>
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}
