import { useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { Shield, Plus, GraduationCap, ClipboardList } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { useAcademyTeam, TEAM_DEFS } from '../../../hooks/useAcademyTeams'
import { getClubBySlug, getClubByName } from '../../../config/clubs-config'
import AcademyTeamRoster from '../../../components/admin/AcademyTeamRoster'
import AddAcademyPlayer from '../../../components/admin/AddAcademyPlayer'
import PromotePlayerModal from '../../../components/admin/PromotePlayerModal'
import AcademyTrials from './AcademyTrials'

function TeamTab({ def, active, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 flex flex-col items-center px-4 py-2.5 border-b-2 text-xs font-black uppercase tracking-widest transition-all ${
        active
          ? 'border-b-2 text-white'
          : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700'
      }`}
      style={active ? { borderBottomColor: color } : {}}
    >
      <span>{def.label}</span>
      <span className={`text-[9px] font-bold normal-case tracking-normal mt-0.5 ${active ? 'text-slate-400' : 'text-slate-700'}`}>
        {def.sublabel}
      </span>
    </button>
  )
}

function ActiveTeamPanel({ clubSlug, teamDef, clubColor, onAdd, onEdit, onPromote }) {
  const { players, loading } = useAcademyTeam(clubSlug, teamDef.id)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-slate-500 font-bold">
            {loading ? '…' : `${players.length} hráčov · vek ${teamDef.minAge}–${teamDef.maxAge} rokov`}
          </p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-wide px-4 py-2 rounded-xl transition-colors shrink-0"
          style={{ background: clubColor, color: '#0f172a' }}
        >
          <Plus size={13} /> Pridať hráča
        </button>
      </div>

      <AcademyTeamRoster
        clubSlug={clubSlug}
        teamId={teamDef.id}
        players={players}
        loading={loading}
        clubColor={clubColor}
        onEdit={onEdit}
        onPromote={onPromote}
      />
    </div>
  )
}

export default function Academy() {
  const { clubSlug } = useParams()
  const { isSuperadmin, userData, loading: authLoading } = useAuth()

  const configClub = getClubBySlug(clubSlug)
  const clubColor  = configClub?.color ?? '#facc15'

  const [activeTeam, setActiveTeam] = useState('U19')
  const [modal,      setModal]      = useState(null)
  // modal: null | { type: 'add' } | { type: 'edit', player } | { type: 'promote', player }
  // activeTeam === 'TRIALS' shows the trials panel instead of a roster

  if (authLoading) return null

  const userClubs  = userData?.clubs ?? []
  const hasAccess  = isSuperadmin || (configClub && userClubs.includes(configClub.name))

  if (!hasAccess) {
    const mySlug = getClubByName(userData?.clubs?.[0])?.slug
    return <Navigate to={mySlug ? `/admin/clubs/${mySlug}` : '/admin/unauthorized'} replace />
  }

  if (!configClub) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Klub nenájdený.</p>
      </div>
    )
  }

  const teamDef = TEAM_DEFS.find((t) => t.id === activeTeam) ?? TEAM_DEFS[0]

  function closeModal() { setModal(null) }
  function afterSave()  { setModal(null) }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3 px-5 h-14">
          <Link
            to={`/admin/clubs/${clubSlug}`}
            className="text-slate-600 hover:text-yellow-400 transition-colors shrink-0"
          >
            <Shield size={16} />
          </Link>
          <div className="w-px h-5 bg-slate-800 shrink-0" />
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: clubColor }}
          >
            <span className="text-[9px] font-black text-white leading-none">{configClub.short}</span>
          </div>
          <Link
            to={`/admin/clubs/${clubSlug}`}
            className="text-sm font-bold text-slate-400 hover:text-slate-200 transition-colors truncate"
          >
            {configClub.name}
          </Link>
          <span className="text-slate-700">/</span>
          <div className="flex items-center gap-1.5">
            <GraduationCap size={13} style={{ color: clubColor }} />
            <span className="text-sm font-black text-white">Akadémia</span>
          </div>
        </div>
        <div className="h-0.5 w-full" style={{ background: clubColor }} />
      </header>

      {/* Tab bar */}
      <div className="bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex overflow-x-auto px-5 scrollbar-none">
          {TEAM_DEFS.map((def) => (
            <TeamTab
              key={def.id}
              def={def}
              active={activeTeam === def.id}
              color={clubColor}
              onClick={() => { setActiveTeam(def.id); setModal(null) }}
            />
          ))}
          {/* Trials tab */}
          <button
            onClick={() => { setActiveTeam('TRIALS'); setModal(null) }}
            className={`shrink-0 flex flex-col items-center px-4 py-2.5 border-b-2 text-xs font-black uppercase tracking-widest transition-all ${
              activeTeam === 'TRIALS'
                ? 'text-white'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700'
            }`}
            style={activeTeam === 'TRIALS' ? { borderBottomColor: clubColor } : {}}
          >
            <span className="flex items-center gap-1"><ClipboardList size={11} /> Skúšky</span>
            <span className={`text-[9px] font-bold normal-case tracking-normal mt-0.5 ${activeTeam === 'TRIALS' ? 'text-slate-400' : 'text-slate-700'}`}>
              Registrácie
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {activeTeam === 'TRIALS' ? (
          <AcademyTrials clubSlug={clubSlug} clubColor={clubColor} />
        ) : (
          <ActiveTeamPanel
            key={activeTeam}
            clubSlug={clubSlug}
            teamDef={teamDef}
            clubColor={clubColor}
            onAdd={() => setModal({ type: 'add' })}
            onEdit={(player) => setModal({ type: 'edit', player })}
            onPromote={(player) => setModal({ type: 'promote', player })}
          />
        )}
      </main>

      {/* Modals */}
      {modal?.type === 'add' && (
        <AddAcademyPlayer
          clubSlug={clubSlug}
          teamId={activeTeam}
          player={null}
          onClose={closeModal}
          onSaved={afterSave}
        />
      )}
      {modal?.type === 'edit' && (
        <AddAcademyPlayer
          clubSlug={clubSlug}
          teamId={activeTeam}
          player={modal.player}
          onClose={closeModal}
          onSaved={afterSave}
        />
      )}
      {modal?.type === 'promote' && (
        <PromotePlayerModal
          clubSlug={clubSlug}
          fromTeam={activeTeam}
          player={modal.player}
          onClose={closeModal}
          onDone={afterSave}
        />
      )}
    </div>
  )
}
