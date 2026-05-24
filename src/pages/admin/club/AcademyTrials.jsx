import { useState, useEffect, useCallback } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc, doc,
  serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import {
  Plus, Calendar, Trash2, Loader, ClipboardList,
  CheckCircle2, XCircle, Clock, ExternalLink,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { db } from '../../../services/firebase'
import { getClubBySlug } from '../../../config/clubs-config'
import TrialApplicationCard from '../../../components/admin/TrialApplicationCard'

const STATUS_TABS = [
  { id: 'pending',   label: 'Čakajúce',   icon: Clock,         count: true },
  { id: 'approved',  label: 'Schválené',   icon: CheckCircle2,  count: false },
  { id: 'rejected',  label: 'Zamietnuté',  icon: XCircle,       count: false },
]

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5'
const INPUT = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition-colors'

const TEAM_OPTIONS = ['U19', 'U17', 'U15', 'U13', 'U11', 'Všetky']

const EMPTY_SESSION = { date: '', time: '10:00', venue: '', teamId: 'U15', notes: '' }

export default function AcademyTrials({ clubSlug, clubColor = '#facc15' }) {
  const staticClub = getClubBySlug(clubSlug)
  const clubId     = staticClub ? String(staticClub.id) : null

  const [activeStatus,  setActiveStatus]  = useState('pending')
  const [applications,  setApplications]  = useState([])
  const [sessions,      setSessions]      = useState([])
  const [loadingApps,   setLoadingApps]   = useState(true)
  const [loadingSess,   setLoadingSess]   = useState(true)
  const [showAddSess,   setShowAddSess]   = useState(false)
  const [sessForm,      setSessForm]      = useState(EMPTY_SESSION)
  const [savingSess,    setSavingSess]    = useState(false)

  // Live listener: trial applications
  useEffect(() => {
    if (!clubId) return
    const unsub = onSnapshot(
      query(collection(db, 'clubs', clubId, 'trial_applications'), orderBy('submittedAt', 'desc')),
      (snap) => {
        setApplications(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoadingApps(false)
      },
      () => setLoadingApps(false)
    )
    return unsub
  }, [clubId])

  // Live listener: trial sessions
  useEffect(() => {
    if (!clubId) return
    const unsub = onSnapshot(
      query(collection(db, 'clubs', clubId, 'trial_sessions'), orderBy('date', 'asc')),
      (snap) => {
        setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoadingSess(false)
      },
      () => setLoadingSess(false)
    )
    return unsub
  }, [clubId])

  const setSess = (k, v) => setSessForm((p) => ({ ...p, [k]: v }))

  async function addSession(e) {
    e.preventDefault()
    if (!sessForm.date || !sessForm.time) { toast.error('Dátum a čas sú povinné'); return }
    setSavingSess(true)
    try {
      await addDoc(collection(db, 'clubs', clubId, 'trial_sessions'), {
        ...sessForm,
        createdAt: serverTimestamp(),
      })
      toast.success('Termín skúšky pridaný')
      setSessForm(EMPTY_SESSION)
      setShowAddSess(false)
    } catch {
      toast.error('Chyba pri pridávaní termínu')
    } finally {
      setSavingSess(false)
    }
  }

  async function deleteSession(sessionId) {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Odstrániť tento termín skúšky?')) return
    try {
      await deleteDoc(doc(db, 'clubs', clubId, 'trial_sessions', sessionId))
      toast.success('Termín odstránený')
    } catch {
      toast.error('Chyba pri odstraňovaní')
    }
  }

  const filtered = applications.filter((a) => a.status === activeStatus)
  const pendingCount = applications.filter((a) => a.status === 'pending').length

  const today = new Date().toISOString().split('T')[0]
  const upcoming = sessions.filter((s) => s.date >= today)
  const past     = sessions.filter((s) => s.date < today)

  return (
    <div className="space-y-8">

      {/* ── Trial sessions ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-yellow-400 flex items-center gap-1.5">
              <Calendar size={12} /> Termíny skúšok
            </h2>
            {!loadingSess && (
              <p className="text-xs text-slate-600 mt-0.5">{upcoming.length} nadchádzajúce · {past.length} minulé</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={`/akademia/${clubSlug}/registracia`}
              target="_blank"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-300 border border-slate-700 rounded-lg px-3 py-1.5 transition-colors"
            >
              <ExternalLink size={11} /> Registračný formulár
            </Link>
            <button
              onClick={() => setShowAddSess((v) => !v)}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-wide px-4 py-2 rounded-xl transition-colors shrink-0"
              style={{ background: clubColor, color: '#0f172a' }}
            >
              <Plus size={13} /> Pridať termín
            </button>
          </div>
        </div>

        {/* Add session form */}
        {showAddSess && (
          <form onSubmit={addSession} className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Nový termín skúšky</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className={LABEL}>Dátum</label>
                <input type="date" required value={sessForm.date} onChange={(e) => setSess('date', e.target.value)} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Čas</label>
                <input type="time" required value={sessForm.time} onChange={(e) => setSess('time', e.target.value)} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Veková skupina</label>
                <select value={sessForm.teamId} onChange={(e) => setSess('teamId', e.target.value)} className={INPUT}>
                  {TEAM_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Miesto</label>
                <input type="text" value={sessForm.venue} onChange={(e) => setSess('venue', e.target.value)} className={INPUT} placeholder="Ihriská, adresa..." />
              </div>
            </div>
            <div>
              <label className={LABEL}>Poznámky (voliteľné)</label>
              <input type="text" value={sessForm.notes} onChange={(e) => setSess('notes', e.target.value)} className={INPUT} placeholder="Čo si priniesť, kontaktná osoba..." />
            </div>
            <div className="flex gap-3">
              <button
                type="button" onClick={() => setShowAddSess(false)}
                className="flex-1 py-2 border border-slate-700 text-slate-500 text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Zrušiť
              </button>
              <button
                type="submit" disabled={savingSess}
                className="flex-1 py-2 bg-yellow-400 text-slate-950 text-xs font-black rounded-xl hover:bg-yellow-300 disabled:opacity-50 transition-colors"
              >
                {savingSess ? 'Ukladám...' : 'Pridať termín'}
              </button>
            </div>
          </form>
        )}

        {/* Sessions list */}
        {loadingSess ? (
          <div className="flex items-center justify-center py-8">
            <Loader size={18} className="animate-spin text-slate-600" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center py-10 text-slate-700 text-xs font-bold">
            Žiadne naplánované termíny — kliknite „Pridať termín"
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {upcoming.map((s) => (
                  <div
                    key={s.id}
                    className="bg-slate-900 border border-slate-700/60 rounded-xl px-4 py-3 flex items-start justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-100">{s.date}</span>
                        <span className="text-xs font-bold text-slate-400">{s.time}</span>
                        <span
                          className="text-[9px] font-black px-1.5 py-0.5 rounded"
                          style={{ background: clubColor + '33', color: clubColor }}
                        >
                          {s.teamId}
                        </span>
                      </div>
                      {s.venue && <p className="text-[10px] text-slate-600 mt-0.5 truncate">{s.venue}</p>}
                      {s.notes && <p className="text-[10px] text-slate-700 mt-0.5 truncate">{s.notes}</p>}
                    </div>
                    <button
                      onClick={() => deleteSession(s.id)}
                      className="text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {past.length > 0 && upcoming.length > 0 && (
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 pt-1">Minulé</p>
            )}
            {past.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 opacity-50">
                {past.map((s) => (
                  <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-start justify-between gap-3 group">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">{s.date}</span>
                        <span className="text-xs text-slate-600">{s.time}</span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-800 text-slate-600">{s.teamId}</span>
                      </div>
                      {s.venue && <p className="text-[10px] text-slate-700 mt-0.5 truncate">{s.venue}</p>}
                    </div>
                    <button onClick={() => deleteSession(s.id)} className="text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Applications ────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-1 border-b border-slate-800 pb-1">
          {STATUS_TABS.map(({ id, label, icon: Icon }) => {
            const cnt  = id === 'pending' ? pendingCount : 0
            const active = activeStatus === id
            return (
              <button
                key={id}
                onClick={() => setActiveStatus(id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                  active
                    ? 'text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
                style={active ? { borderBottomColor: clubColor, color: 'white' } : { borderColor: 'transparent' }}
              >
                <Icon size={11} />
                {label}
                {id === 'pending' && cnt > 0 && (
                  <span className="bg-yellow-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                    {cnt}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {loadingApps ? (
          <div className="flex items-center justify-center py-16">
            <Loader size={20} className="animate-spin text-slate-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center py-16 text-slate-700">
            <ClipboardList size={28} className="mb-3" />
            <p className="text-sm font-black uppercase tracking-widest mb-1">
              {activeStatus === 'pending' ? 'Žiadne čakajúce prihlášky' : `Žiadne ${STATUS_TABS.find(t=>t.id===activeStatus)?.label.toLowerCase()} prihlášky`}
            </p>
            {activeStatus === 'pending' && (
              <p className="text-xs">Zdieľajte registračný formulár s rodičmi</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => (
              <TrialApplicationCard
                key={app.id}
                app={app}
                clubId={clubId}
                sessions={sessions}
                onUpdated={() => {}}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
