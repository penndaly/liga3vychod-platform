import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, getDocs, where } from 'firebase/firestore'
import { RefreshCw, ChevronDown } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { db } from '../../services/firebase'
import AdminLayout from '../../components/admin/AdminLayout'
import StandingsTable from '../../components/admin/standings/StandingsTable'
import DeductionsPanel from '../../components/admin/standings/DeductionsPanel'

const SEASONS = ['2025/26', '2024/25', '2023/24']

export default function Standings() {
  const [season, setSeason] = useState('2025/26')
  const [standings, setStandings] = useState([])
  const [deductions, setDeductions] = useState([])
  const [completedCount, setCompletedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Live standings from Cloud Function — updates automatically whenever fixtures change
  useEffect(() => {
    setLoading(true)
    const unsub = onSnapshot(
      query(collection(db, 'standings'), orderBy('pos', 'asc')),
      (snap) => {
        const rows = []
        let completed = 0
        snap.docs.forEach((d) => {
          if (d.id === '_meta') { completed = d.data().completedMatches ?? 0; return }
          rows.push({ id: d.id, ...d.data() })
        })
        setStandings(rows)
        setCompletedCount(completed)
        setLoading(false)
      },
      () => { toast.error('Chyba pri načítaní tabuľky'); setLoading(false) }
    )
    return unsub
  }, [])

  async function loadDeductions() {
    try {
      const snap = await getDocs(
        query(collection(db, 'deductions'), where('season', '==', season))
      )
      setDeductions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch {
      toast.error('Chyba pri načítaní odpočtov')
    }
  }

  useEffect(() => { loadDeductions() }, [season])

  async function handleRefresh() {
    setRefreshing(true)
    await loadDeductions()
    setRefreshing(false)
  }

  const hasDeductions = deductions.length > 0

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900">Tabuľka</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Automatický výpočet z {completedCount} odohraných zápasov
              {hasDeductions && ` · ${deductions.length} odpočt${deductions.length === 1 ? '' : deductions.length < 5 ? 'y' : 'ov'}`}
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
                {SEASONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-bold hover:bg-white transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Obnoviť</span>
            </button>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <StandingsTable
              standings={standings}
              hasDeductions={hasDeductions}
              loading={loading}
            />
          </div>
          <div>
            <DeductionsPanel
              deductions={deductions}
              season={season}
              onSaved={handleRefresh}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
