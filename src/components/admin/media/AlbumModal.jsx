import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { doc, collection, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../services/firebase'
import { CLUBS } from '../../../data/placeholder'

const SEASONS = ['2025/26', '2024/25', '2023/24']

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT  = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition-colors bg-white'

export default function AlbumModal({ album, onClose, onSaved }) {
  const isEdit = Boolean(album?.id)
  const [docId] = useState(() => isEdit ? album.id : doc(collection(db, 'media_albums')).id)

  const [form, setForm] = useState({
    title:  album?.title  ?? '',
    club:   album?.club   ?? 'Liga',
    round:  album?.round  != null ? String(album.round) : '',
    season: album?.season ?? '2025/26',
  })
  const [saving, setSaving] = useState(false)

  const set = (f, v) => setForm((prev) => ({ ...prev, [f]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'media_albums', docId),
        {
          title:     form.title.trim(),
          club:      form.club,
          round:     form.round !== '' ? Number(form.round) : null,
          season:    form.season,
          updatedAt: serverTimestamp(),
          ...(isEdit ? {} : { createdAt: serverTimestamp(), coverUrl: null }),
        },
        { merge: true }
      )
      toast.success(isEdit ? 'Album aktualizovaný' : 'Album vytvorený')
      onSaved(docId)
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
            {isEdit ? 'Upraviť album' : 'Nový album'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={LABEL}>Názov albumu</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className={INPUT}
              placeholder="Zápas 22. kola — BDJ vs HMN"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Klub</label>
              <select value={form.club} onChange={(e) => set('club', e.target.value)} className={INPUT}>
                <option value="Liga">Liga</option>
                {CLUBS.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Kolo</label>
              <input
                type="number"
                min="1"
                max="46"
                value={form.round}
                onChange={(e) => set('round', e.target.value)}
                className={INPUT}
                placeholder="22"
              />
            </div>
          </div>

          <div>
            <label className={LABEL}>Sezóna</label>
            <select value={form.season} onChange={(e) => set('season', e.target.value)} className={INPUT}>
              {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
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
              disabled={saving}
              className="flex-1 py-2.5 bg-yellow-400 text-slate-950 text-sm font-black rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Ukladám...' : 'Uložiť'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
