import { useState, useMemo } from 'react'
import { Radio } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { CLUBS_2025_26 } from '../../config/clubs-config'
import { updateDocument } from '../../services/api'
import { useLiveMatches } from '../../hooks/useLiveMatches'
import AdminLayout from '../../components/admin/AdminLayout'
import MatchCard from '../../components/admin/MatchCard'
import ScoreModal from '../../components/admin/live/ScoreModal'
import MatchDetailModal from '../../components/admin/live/MatchDetailModal'
import MatchModal from '../../components/admin/fixtures/MatchModal'

const STATUS_FILTERS = [
  { id: 'all',       label: 'Všetky'       },
  { id: 'live',      label: 'Live'         },
  { id: 'completed', label: 'Odohraté'     },
  { id: 'scheduled', label: 'Nadchádzajúce'},
]

function SectionHeader({ title, count, accent = 'text-slate-500' }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <h2 className={`text-xs font-black uppercase tracking-widest ${accent}`}>{title}</h2>
      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
        {count}
      </span>
    </div>
  )
}

function MatchGrid({ matches, onExpand, onMarkComplete }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
      {matches.map((f) => (
        <MatchCard
          key={f.id}
          match={f}
          onExpand={onExpand}
          onMarkComplete={onMarkComplete}
        />
      ))}
    </div>
  )
}

export default function LiveMatchCentre() {
  const { matches: allFixtures, loading } = useLiveMatches()
  const [statusFilter, setStatusFilter] = useState('all')
  const [clubFilter,   setClubFilter]   = useState('all')
  const [scoreModal,   setScoreModal]   = useState(null)
  const [detailModal,  setDetailModal]  = useState(null)
  const [editModal,    setEditModal]    = useState(null)

  const liveCount = allFixtures.filter((f) => f.status === 'live').length

  const filtered = useMemo(() => allFixtures.filter((f) => {
    if (statusFilter !== 'all' && f.status !== statusFilter) return false
    if (clubFilter   !== 'all' && f.home !== clubFilter && f.away !== clubFilter) return false
    return true
  }), [allFixtures, statusFilter, clubFilter])

  const live      = filtered.filter((f) => f.status === 'live')
  const completed = filtered.filter((f) => f.status === 'completed')
  const upcoming  = filtered.filter((f) => f.status === 'scheduled' || f.status === 'postponed')

  async function handleMarkComplete(fixture) {
    try {
      await updateDocument('fixtures', fixture.id, {
        status: fixture.status === 'live' ? 'live' : 'completed',
        homeGoals: fixture.homeGoals ?? 0,
        awayGoals: fixture.awayGoals ?? 0,
      })
      setScoreModal(fixture)
    } catch {
      toast.error('Chyba pri aktualizácii zápasu')
    }
  }

  function handleExpand(fixture) {
    setDetailModal(fixture)
  }

  function openEdit(f) {
    setDetailModal(null)
    setEditModal(f)
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Radio
                size={18}
                className={liveCount > 0 ? 'text-red-500 animate-pulse' : 'text-slate-400'}
              />
              <h1 className="text-xl font-black text-slate-900">Live Match Centre</h1>
              {liveCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-0.5 rounded-md border bg-red-50 border-red-200 text-red-700">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  {liveCount} LIVE
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1">
              {allFixtures.length} zápasov · {completed.length} odohraných
              {liveCount > 0 && ` · ${liveCount} práve prebieha`}
            </p>
          </div>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status pill buttons */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
            {STATUS_FILTERS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setStatusFilter(id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === id
                    ? id === 'live'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
                {id === 'live' && liveCount > 0 && (
                  <span className={`ml-1.5 text-[10px] font-black ${
                    statusFilter === 'live' ? 'text-red-200' : 'text-red-500'
                  }`}>
                    {liveCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Club dropdown */}
          <select
            value={clubFilter}
            onChange={(e) => setClubFilter(e.target.value)}
            className="border border-slate-200 bg-white rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-yellow-400 transition-colors"
          >
            <option value="all">Všetky kluby</option>
            {CLUBS_2025_26.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          {(statusFilter !== 'all' || clubFilter !== 'all') && (
            <button
              onClick={() => { setStatusFilter('all'); setClubFilter('all') }}
              className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors underline"
            >
              Zrušiť filtre
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center py-24 text-slate-300">
            <Radio size={32} className="mb-3" />
            <p className="text-sm font-bold text-slate-400">Žiadne zápasy nezodpovedajú filtru</p>
          </div>
        ) : (
          <div className="space-y-10">

            {live.length > 0 && (
              <section>
                <SectionHeader title="Práve prebieha" count={live.length} accent="text-red-500" />
                <MatchGrid matches={live} onExpand={handleExpand} onMarkComplete={handleMarkComplete} />
              </section>
            )}

            {completed.length > 0 && (
              <section>
                <SectionHeader title="Odohraté" count={completed.length} accent="text-green-600" />
                <MatchGrid matches={completed} onExpand={handleExpand} onMarkComplete={handleMarkComplete} />
              </section>
            )}

            {upcoming.length > 0 && (
              <section>
                <SectionHeader title="Nadchádzajúce" count={upcoming.length} accent="text-slate-500" />
                <MatchGrid matches={upcoming} onExpand={handleExpand} onMarkComplete={handleMarkComplete} />
              </section>
            )}

          </div>
        )}
      </div>

      {/* Modals */}
      {scoreModal && (
        <ScoreModal
          fixture={scoreModal}
          onClose={() => setScoreModal(null)}
          onSaved={() => setScoreModal(null)}
        />
      )}

      {detailModal && (
        <MatchDetailModal
          fixture={detailModal}
          onClose={() => setDetailModal(null)}
          onEdit={() => openEdit(detailModal)}
        />
      )}

      {editModal && (
        <MatchModal
          match={editModal}
          onClose={() => setEditModal(null)}
          onSaved={() => setEditModal(null)}
        />
      )}
    </AdminLayout>
  )
}
