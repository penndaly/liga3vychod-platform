import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { ROLES } from '../../../data/roles'
import { CLUB_NAME_LIST } from '../../../config/clubs-config'
import { updateDocument } from '../../../services/api'

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT  = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition-colors bg-white'

const CLUB_NAMES = CLUB_NAME_LIST

export default function UserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:  user.name  ?? '',
    role:  user.role  ?? 'VIEWER',
    clubs: user.clubs ?? [],
  })
  const [saving, setSaving] = useState(false)

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  function toggleClub(name) {
    setForm((f) => ({
      ...f,
      clubs: f.clubs.includes(name)
        ? f.clubs.filter((c) => c !== name)
        : [...f.clubs, name],
    }))
  }

  const needsClubs = form.role !== 'SUPERADMIN' && form.role !== 'VIEWER'

  async function handleSubmit(e) {
    e.preventDefault()
    if (needsClubs && form.clubs.length === 0) {
      toast.error('Priraďte aspoň jeden klub')
      return
    }
    setSaving(true)
    try {
      await updateDocument('users', user.id, {
        name:  form.name,
        role:  form.role,
        clubs: form.role === 'SUPERADMIN' ? [] : form.clubs,
      })
      toast.success('Používateľ aktualizovaný')
      onSaved()
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
            Upraviť používateľa
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className={LABEL}>Email</label>
            <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
              {user.email}
            </p>
          </div>

          <div>
            <label className={LABEL}>Meno</label>
            <input
              type="text" required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={INPUT}
            />
          </div>

          <div>
            <label className={LABEL}>Rola</label>
            <select value={form.role} onChange={(e) => set('role', e.target.value)} className={INPUT}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
              ))}
            </select>
          </div>

          {needsClubs && (
            <div>
              <label className={LABEL}>Priradené kluby</label>
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3">
                {CLUB_NAMES.map((name) => (
                  <label key={name} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded p-1">
                    <input
                      type="checkbox"
                      checked={form.clubs.includes(name)}
                      onChange={() => toggleClub(name)}
                      className="accent-green-600"
                    />
                    <span className="text-xs text-slate-700 leading-tight">{name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Zrušiť
            </button>
            <button
              type="submit" disabled={saving}
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
