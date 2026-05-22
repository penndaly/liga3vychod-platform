import { useState } from 'react'
import { X, Upload, Youtube, Loader } from 'lucide-react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { storage, db } from '../../../services/firebase'

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT  = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition-colors bg-white'

function extractYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

export default function AddMediaModal({ albumId, hasCover, onClose, onSaved }) {
  const [tab, setTab] = useState('photo')

  // Photo state
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(null)

  // YouTube state
  const [ytForm, setYtForm] = useState({ url: '', title: '', caption: '' })
  const [ytSaving, setYtSaving] = useState(false)

  const setYt = (f, v) => setYtForm((prev) => ({ ...prev, [f]: v }))

  async function handlePhotoUpload() {
    if (!files.length) return
    setUploading(true)
    try {
      const items = collection(db, 'media_albums', albumId, 'items')
      let firstUrl = null
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setProgress(`${i + 1} / ${files.length}`)
        const storageRef = ref(storage, `media/${albumId}/${Date.now()}_${file.name}`)
        await uploadBytes(storageRef, file)
        const url = await getDownloadURL(storageRef)
        if (i === 0) firstUrl = url
        await addDoc(items, {
          type: 'photo',
          url,
          youtubeId: null,
          title: '',
          caption: '',
          createdAt: serverTimestamp(),
        })
      }
      // Set album cover if not already set
      if (!hasCover && firstUrl) {
        await updateDoc(doc(db, 'media_albums', albumId), { coverUrl: firstUrl })
      }
      toast.success(`${files.length} ${files.length === 1 ? 'fotografia' : 'fotografie'} nahraté`)
      onSaved()
    } catch {
      toast.error('Chyba pri nahrávaní')
    } finally {
      setUploading(false)
      setProgress(null)
    }
  }

  async function handleYouTube(e) {
    e.preventDefault()
    const ytId = extractYouTubeId(ytForm.url)
    if (!ytId) { toast.error('Neplatný YouTube odkaz'); return }
    setYtSaving(true)
    try {
      const items = collection(db, 'media_albums', albumId, 'items')
      await addDoc(items, {
        type:      'youtube',
        url:       ytForm.url,
        youtubeId: ytId,
        title:     ytForm.title.trim(),
        caption:   ytForm.caption.trim(),
        createdAt: serverTimestamp(),
      })
      // Set album cover from YouTube thumbnail if no cover
      if (!hasCover) {
        const thumb = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
        await updateDoc(doc(db, 'media_albums', albumId), { coverUrl: thumb })
      }
      toast.success('Video pridané')
      onSaved()
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setYtSaving(false)
    }
  }

  const TAB = (t, label) => (
    <button
      type="button"
      onClick={() => setTab(t)}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
        tab === t ? 'border-yellow-400 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Pridať médiá</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-4">
          {TAB('photo', <><Upload size={13} /> Fotografie</>)}
          {TAB('youtube', <><Youtube size={13} /> YouTube</>)}
        </div>

        {tab === 'photo' && (
          <div className="p-6 space-y-4">
            <label className="block w-full border-2 border-dashed border-slate-200 hover:border-yellow-400 rounded-xl p-8 text-center cursor-pointer transition-colors">
              <Upload size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-500">
                {files.length > 0
                  ? `${files.length} ${files.length === 1 ? 'súbor vybraný' : 'súbory vybrané'}`
                  : 'Kliknite alebo pretiahnite fotografie'}
              </p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG, WebP · max 10 MB na súbor</p>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const arr = Array.from(e.target.files ?? []).filter((f) => f.size <= 10 * 1024 * 1024)
                  if (arr.length < (e.target.files?.length ?? 0)) toast.error('Niektoré súbory presahujú 10 MB')
                  setFiles(arr)
                }}
              />
            </label>

            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-100">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Zrušiť
              </button>
              <button
                type="button"
                onClick={handlePhotoUpload}
                disabled={!files.length || uploading}
                className="flex-1 py-2.5 bg-yellow-400 text-slate-950 text-sm font-black rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <><Loader size={14} className="animate-spin" /> {progress}</>
                ) : (
                  'Nahrať'
                )}
              </button>
            </div>
          </div>
        )}

        {tab === 'youtube' && (
          <form onSubmit={handleYouTube} className="p-6 space-y-4">
            <div>
              <label className={LABEL}>YouTube odkaz</label>
              <input
                type="url"
                required
                value={ytForm.url}
                onChange={(e) => setYt('url', e.target.value)}
                className={INPUT}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <div>
              <label className={LABEL}>Popis videa</label>
              <input
                type="text"
                value={ytForm.title}
                onChange={(e) => setYt('title', e.target.value)}
                className={INPUT}
                placeholder="Góly 22. kola"
              />
            </div>
            <div>
              <label className={LABEL}>Doplnkový text</label>
              <input
                type="text"
                value={ytForm.caption}
                onChange={(e) => setYt('caption', e.target.value)}
                className={INPUT}
                placeholder="Komentár alebo zdroj..."
              />
            </div>

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
                disabled={ytSaving}
                className="flex-1 py-2.5 bg-yellow-400 text-slate-950 text-sm font-black rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors"
              >
                {ytSaving ? 'Ukladám...' : 'Pridať video'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
