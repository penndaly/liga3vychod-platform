import { useState, useEffect, useMemo } from 'react'
import { Calendar, Plus, Upload, ChevronDown, ChevronRight, Pencil, Trash2, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import MatchModal from '../../components/admin/fixtures/MatchModal'
import BulkImportModal from '../../components/admin/fixtures/BulkImportModal'
import { fetchCollection, deleteDocument } from '../../services/api'

const STATUS_CONFIG = {
  scheduled: { label: 'Plánovaný', cls: 'bg-slate-100 text-slate-500' },
  live:      { label: 'LIVE',      cls: 'bg-red-100 text-red-600' },
  completed: { label: 'Odohraný', cls: 'bg-green-100 text-green-700' },
  postponed: { label: 'Odložený', cls: 'bg-yellow-100 text-yellow-700' },
}

const FILTERS = [
  { key: 'all',       label: 'Všetky' },
  { key: 'scheduled', label: 'Plánované' },
  { key: 'completed', label: 'Odohraných' },
  { key: 'live',      label: 'Live' },
  { key: 'postponed', label: 'Odložené' },
]

function MatchRow({ match, onEdit, onDelete }) {
  const cfg = STATUS_CONFIG[match.status] ?? STATUS_CONFIG.scheduled
  const isScored = match.status === 'completed' || match.status === 'live'
  const homeWon = isScored && match.homeGoals > match.awayGoals
  const awayWon = isScored && match.awayGoals > match.homeGoals

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group">
      <div className="flex-1 text-right min-w-0">
        <span className={`text-sm truncate block ${homeWon ? 'font-bold text-slate-900' : 'font-medium text-slate-500'}`}>
          {match.home}
        </span>
      </div>

      <div className="shrink-0 w-24 flex justify-center">
        {isScored ? (
          <div className="bg-slate-900 text-white text-sm font-black px-4 py-1.5 rounded-lg tabular-nums">
            {match.homeGoals ?? 0} – {match.awayGoals ?? 0}
          </div>
        ) : (
          <div className="text-slate-300 text-xs font-bold px-4 py-1.5 border border-slate-200 rounded-lg">
            vs
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <span className={`text-sm truncate block ${awayWon ? 'font-bold text-slate-900' : 'font-medium text-slate-500'}`}>
          {match.away}
        </span>
      </div>

      <div className="shrink-0 text-right hidden md:block w-20">
        <p className="text-xs text-slate-400">{match.date}</p>
        <p className="text-xs text-slate-400">{match.time}</p>
      </div>

      <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded hidden lg:block w-20 text-center ${cfg.cls}`}>
        {cfg.label}
      </span>

      <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(match)}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded transition-colors"
          title="Upraviť"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onDelete(match)}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded transition-colors"
          title="Vymazať"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

function RoundGroup({ round, matches, defaultOpen, onEdit, onDelete }) {
  const [open, setOpen] = useState(defaultOpen)
  const completedCount = matches.filter((m) => m.status === 'completed').length
  const firstDate = matches[0]?.date

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {open
            ? <ChevronDown size={13} className="text-slate-400" />
            : <ChevronRight size={13} className="text-slate-400" />}
          <span className="text-sm font-black text-slate-900">Kolo {round}</span>
          <span className="text-xs text-slate-400">
            {matches.length} zápasov
            {completedCount > 0 && ` · ${completedCount} odohraných`}
          </span>
        </div>
        {firstDate && (
          <span className="text-xs text-slate-400 hidden sm:block">{firstDate}</span>
        )}
      </button>

      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {matches.map((match) => (
            <MatchRow key={match.id} match={match} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Fixtures() {
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [editMatch, setEditMatch] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showBulk, setShowBulk] = useState(false)

  async function loadFixtures() {
    setLoading(true)
    try {
      const data = await fetchCollection('fixtures')
      setFixtures(data.sort((a, b) => a.round - b.round || (a.home ?? '').localeCompare(b.home ?? '')))
    } catch {
      toast.error('Chyba pri načítaní zápasov')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFixtures() }, [])

  async function handleDelete(match) {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Vymazať zápas ${match.home} vs ${match.away}?`)) return
    try {
      await deleteDocument('fixtures', match.id)
      toast.success('Zápas vymazaný')
      setFixtures((prev) => prev.filter((m) => m.id !== match.id))
    } catch {
      toast.error('Chyba pri mazaní')
    }
  }

  const counts = useMemo(() => ({
    all:       fixtures.length,
    scheduled: fixtures.filter((m) => m.status === 'scheduled').length,
    completed: fixtures.filter((m) => m.status === 'completed').length,
    live:      fixtures.filter((m) => m.status === 'live').length,
    postponed: fixtures.filter((m) => m.status === 'postponed').length,
  }), [fixtures])

  const grouped = useMemo(() => {
    const q = search.toLowerCase()
    const filtered = fixtures.filter((m) => {
      if (filter !== 'all' && m.status !== filter) return false
      if (q && !m.home?.toLowerCase().includes(q) && !m.away?.toLowerCase().includes(q)) return false
      return true
    })
    const groups = {}
    filtered.forEach((m) => {
      if (!groups[m.round]) groups[m.round] = []
      groups[m.round].push(m)
    })
    return Object.entries(groups)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([round, matches]) => ({ round: Number(round), matches }))
  }, [fixtures, filter, search])

  const maxRound = grouped.length > 0 ? Math.max(...grouped.map((g) => g.round)) : 0

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900">Zápasy & Výsledky</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {counts.all} zápasov · {counts.completed} odohraných
              {counts.live > 0 && ` · ${counts.live} live`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowBulk(true)}
              className="flex items-center gap-2 border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-white transition-colors"
            >
              <Upload size={14} /> Import
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 bg-yellow-400 text-slate-950 px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wide hover:bg-yellow-300 transition-colors"
            >
              <Plus size={14} /> Pridať zápas
            </button>
          </div>
        </div>

        {/* Filters + search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 gap-0.5 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${
                  filter === f.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {f.label}
                {counts[f.key] > 0 && (
                  <span className="ml-1 opacity-60">({counts[f.key]})</span>
                )}
              </button>
            ))}
          </div>

          <div className="relative max-w-xs w-full">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Hľadať tím..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-24 text-sm text-slate-400">Načítavam zápasy...</div>
        ) : fixtures.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-20 text-center">
            <Calendar size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-sm font-bold text-slate-400 mb-1">Žiadne zápasy v databáze</p>
            <p className="text-xs text-slate-400 mb-6">
              Pridajte zápasy ručne alebo importujte celý program sezóny naraz.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowBulk(true)}
                className="flex items-center gap-2 border border-slate-200 text-slate-600 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                <Upload size={14} /> Hromadný import
              </button>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 bg-yellow-400 text-slate-950 px-5 py-2.5 rounded-lg text-sm font-black hover:bg-yellow-300 transition-colors"
              >
                <Plus size={14} /> Pridať zápas
              </button>
            </div>
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-16 text-sm text-slate-400">
            Žiadne zápasy nezodpovedajú filtru.
          </div>
        ) : (
          <div className="space-y-3">
            {grouped.map(({ round, matches }) => (
              <RoundGroup
                key={round}
                round={round}
                matches={matches}
                defaultOpen={round >= maxRound - 2}
                onEdit={setEditMatch}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <MatchModal
          match={null}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); loadFixtures() }}
        />
      )}
      {editMatch && (
        <MatchModal
          match={editMatch}
          onClose={() => setEditMatch(null)}
          onSaved={() => { setEditMatch(null); loadFixtures() }}
        />
      )}
      {showBulk && (
        <BulkImportModal
          onClose={() => setShowBulk(false)}
          onSaved={() => { setShowBulk(false); loadFixtures() }}
        />
      )}
    </AdminLayout>
  )
}
