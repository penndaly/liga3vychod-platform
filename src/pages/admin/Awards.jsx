import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, RefreshCw } from 'lucide-react'
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { db } from '../../services/firebase'
import AdminLayout from '../../components/admin/AdminLayout'
import StatLeaderboard from '../../components/admin/awards/StatLeaderboard'
import PlayerStatModal from '../../components/admin/awards/PlayerStatModal'
import PotmSection from '../../components/admin/awards/PotmSection'

const SEASONS = ['2025/26', '2024/25', '2023/24']

const TABS = [
  { id: 'goals',   label: 'Strelci' },
  { id: 'assists', label: 'Asistenti' },
  { id: 'cards',   label: 'Karty' },
  { id: 'potm',    label: 'Hráč mesiaca' },
]

const TAB_CLS = (active) =>
  `px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
    active
      ? 'border-yellow-400 text-slate-900'
      : 'border-transparent text-slate-400 hover:text-slate-700'
  }`

export default function Awards() {
  const [season, setSeason] = useState('2025/26')
  const [tab, setTab] = useState('goals')
  const [players, setPlayers] = useState([])
  const [potmAwards, setPotmAwards] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | player entry

  const loadPlayers = useCallback(async () => {
    try {
      const q = query(collection(db, 'player_stats'), where('season', '==', season))
      const snap = await getDocs(q)
      setPlayers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch {
      toast.error('Chyba pri načítaní štatistík')
    }
  }, [season])

  const loadPotm = useCallback(async () => {
    try {
      const q = query(collection(db, 'awards_potm'), where('season', '==', season))
      const snap = await getDocs(q)
      setPotmAwards(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch {
      // awards_potm may not exist yet
    }
  }, [season])

  async function load() {
    setLoading(true)
    await Promise.all([loadPlayers(), loadPotm()])
    setLoading(false)
  }

  useEffect(() => { load() }, [season])

  async function handleDelete(player) {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Odstrániť záznam pre ${player.name}?`)) return
    try {
      await deleteDoc(doc(db, 'player_stats', player.id))
      setPlayers((prev) => prev.filter((p) => p.id !== player.id))
      toast.success('Záznam odstránený')
    } catch {
      toast.error('Chyba pri odstraňovaní')
    }
  }

  const leaderboardProps = {
    players,
    loading,
    onAdd:    () => setModal('add'),
    onEdit:   (p) => setModal(p),
    onDelete: handleDelete,
  }

  const totalPlayers = players.length
  const totalGoals   = players.reduce((s, p) => s + (p.goals ?? 0), 0)
  const totalCards   = players.reduce((s, p) => s + (p.yellowCards ?? 0) + (p.redCards ?? 0), 0)

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900">Ocenenia & Štatistiky</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {totalPlayers} hráčov · {totalGoals} gólov · {totalCards} kariet
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Season selector */}
            <div className="relative">
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-yellow-400 transition-colors cursor-pointer"
              >
                {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-bold hover:bg-white transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Obnoviť</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-100 flex gap-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={TAB_CLS(tab === t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'goals' && (
          <StatLeaderboard
            {...leaderboardProps}
            title="Najlepší strelci"
            sortKey="goals"
            label="Góly"
            unit="g"
            color="bg-green-500"
          />
        )}

        {tab === 'assists' && (
          <StatLeaderboard
            {...leaderboardProps}
            title="Asistenti"
            sortKey="assists"
            label="Asistencie"
            unit="a"
            color="bg-blue-500"
          />
        )}

        {tab === 'cards' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <StatLeaderboard
              {...leaderboardProps}
              title="Žlté karty"
              sortKey="yellowCards"
              label="ŽK"
              unit={null}
              color="bg-yellow-400"
            />
            <StatLeaderboard
              {...leaderboardProps}
              title="Červené karty"
              sortKey="redCards"
              label="ČK"
              unit={null}
              color="bg-red-500"
            />
          </div>
        )}

        {tab === 'potm' && (
          <PotmSection
            season={season}
            awards={potmAwards}
            onRefresh={loadPotm}
          />
        )}
      </div>

      {modal && (
        <PlayerStatModal
          season={season}
          entry={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); loadPlayers() }}
        />
      )}
    </AdminLayout>
  )
}
