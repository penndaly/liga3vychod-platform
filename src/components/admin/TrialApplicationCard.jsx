import { useState } from 'react'
import {
  Phone, Mail, AlertTriangle, CheckCircle, XCircle,
  CalendarClock, MessageSquare, ChevronDown, ChevronUp,
} from 'lucide-react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { db } from '../../services/firebase'
import { calcAge } from '../../hooks/useAcademyTeams'

const STATUS_CFG = {
  pending:   { label: 'Čakajúca',    cls: 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30', border: 'border-l-4 border-yellow-500/40' },
  approved:  { label: 'Schválená',   cls: 'bg-green-500/20  text-green-400  border border-green-500/30',  border: 'border-l-4 border-green-500/40'  },
  rejected:  { label: 'Zamietnutá',  cls: 'bg-red-500/20    text-red-400    border border-red-500/30',    border: 'border-l-4 border-red-500/40'    },
  scheduled: { label: 'Naplánovaná', cls: 'bg-blue-500/20   text-blue-400   border border-blue-500/30',   border: 'border-l-4 border-blue-500/40'   },
}

const POS_LABEL = { GK: 'Brankár', DEF: 'Obranca', MID: 'Záložník', FWD: 'Útočník' }
const POS_BADGE = {
  GK:  'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25',
  DEF: 'bg-blue-500/15   text-blue-400   border border-blue-500/25',
  MID: 'bg-green-500/15  text-green-400  border border-green-500/25',
  FWD: 'bg-red-500/15    text-red-400    border border-red-500/25',
}

export default function TrialApplicationCard({ app, clubId, sessions = [], onUpdated }) {
  const [expanded,      setExpanded]      = useState(false)
  const [notes,         setNotes]         = useState(app.coachNotes ?? '')
  const [rejectReason,  setRejectReason]  = useState('')
  const [showRejectBox, setShowRejectBox] = useState(false)
  const [saving,        setSaving]        = useState(false)

  const cfg      = STATUS_CFG[app.status] ?? STATUS_CFG.pending
  const age      = calcAge(app.dob)
  const initials = app.playerName?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'

  const sessionById = Object.fromEntries(sessions.map((s) => [s.id, s]))
  const sessionLabel = app.preferredTrialDate && sessionById[app.preferredTrialDate]
    ? `${sessionById[app.preferredTrialDate].date} · ${sessionById[app.preferredTrialDate].time}`
    : app.preferredTrialDate || null

  async function patch(fields) {
    setSaving(true)
    try {
      await updateDoc(
        doc(db, 'clubs', clubId, 'trial_applications', app.id),
        { ...fields, updatedAt: serverTimestamp() }
      )
      toast.success('Aktualizované')
      onUpdated?.()
    } catch {
      toast.error('Chyba pri aktualizácii')
    } finally {
      setSaving(false)
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) { toast.error('Zadajte dôvod zamietnutia'); return }
    await patch({ status: 'rejected', rejectionReason: rejectReason.trim() })
    setShowRejectBox(false)
  }

  return (
    <div className={`bg-slate-900 ${cfg.border} rounded-2xl overflow-hidden`}>

      {/* Main row */}
      <div className="p-4 flex items-start gap-4">

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-xs font-black text-slate-400">
          {initials}
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Name + status */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <p className="font-black text-slate-100 leading-tight">{app.playerName}</p>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${cfg.cls}`}>
              {cfg.label}
            </span>
          </div>

          {/* Age + position */}
          <div className="flex items-center gap-2 flex-wrap">
            {age !== null && (
              <span className="text-xs text-slate-500">{age} rokov</span>
            )}
            {app.position && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${POS_BADGE[app.position] ?? 'bg-slate-700 text-slate-400'}`}>
                {POS_LABEL[app.position] ?? app.position}
              </span>
            )}
          </div>

          {/* Parent contact */}
          <div className="flex items-center gap-3 flex-wrap">
            {app.parentName && (
              <span className="text-xs text-slate-500 font-medium">{app.parentName}</span>
            )}
            {app.parentPhone && (
              <a href={`tel:${app.parentPhone}`} className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
                <Phone size={9} /> {app.parentPhone}
              </a>
            )}
            {app.parentEmail && (
              <a href={`mailto:${app.parentEmail}`} className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
                <Mail size={9} /> {app.parentEmail}
              </a>
            )}
          </div>

          {/* Medical warning */}
          {app.medicalNotes?.trim() && (
            <div className="flex items-start gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5">
              <AlertTriangle size={11} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-400 leading-relaxed">{app.medicalNotes}</p>
            </div>
          )}

          {/* Preferred trial date */}
          {sessionLabel && (
            <p className="flex items-center gap-1 text-[10px] text-slate-600">
              <CalendarClock size={10} /> {sessionLabel}
            </p>
          )}
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-slate-600 hover:text-slate-400 transition-colors shrink-0 mt-1"
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-800 p-4 space-y-4">
          {app.experience && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">Skúsenosti</p>
              <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{app.experience}</p>
            </div>
          )}
          {app.emergencyContact && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">Núdzový kontakt</p>
              <p className="text-xs text-slate-400">{app.emergencyContact}</p>
            </div>
          )}
          {app.rejectionReason && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1">Dôvod zamietnutia</p>
              <p className="text-xs text-red-400">{app.rejectionReason}</p>
            </div>
          )}

          {/* Coach notes */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1.5">Poznámky trénera</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Pozorovania z tréningu..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition-colors resize-none"
            />
            <button
              onClick={() => patch({ coachNotes: notes })}
              disabled={saving || notes === (app.coachNotes ?? '')}
              className="mt-1.5 text-xs font-bold text-yellow-400 hover:text-yellow-300 disabled:opacity-40 transition-colors flex items-center gap-1"
            >
              <MessageSquare size={10} /> Uložiť poznámky
            </button>
          </div>
        </div>
      )}

      {/* Action bar */}
      {app.status !== 'rejected' && (
        <div className="border-t border-slate-800 px-4 py-3 flex items-center gap-2 flex-wrap">
          {app.status !== 'approved' && (
            <button
              onClick={() => patch({ status: 'approved' })}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg hover:bg-green-600/30 transition-colors disabled:opacity-50"
            >
              <CheckCircle size={12} /> Schváliť
            </button>
          )}

          {app.status === 'pending' && !showRejectBox && (
            <button
              onClick={() => setShowRejectBox(true)}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50"
            >
              <XCircle size={12} /> Zamietnuť
            </button>
          )}

          {showRejectBox && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Dôvod zamietnutia..."
                autoFocus
                className="flex-1 min-w-0 bg-slate-800 border border-red-800/40 rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-red-500 transition-colors"
              />
              <button
                onClick={handleReject}
                disabled={saving}
                className="text-xs font-black px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors shrink-0"
              >
                Potvrdiť
              </button>
              <button
                onClick={() => setShowRejectBox(false)}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors shrink-0"
              >
                Zrušiť
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
