import { Calendar, CheckCircle, Shield, Users, Radio } from 'lucide-react'
import { useCollection, useLiveCollection } from '../../../hooks/useFirestore'

function StatCard({ label, sublabel, icon: Icon, iconBg, iconColor, value, loading }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={16} className={iconColor} />
        </div>
      </div>
      <p className="text-3xl font-black text-slate-900">
        {loading ? <span className="text-slate-300">—</span> : value}
      </p>
      <p className="text-xs text-slate-400 mt-1">{sublabel}</p>
    </div>
  )
}

export default function StatsGrid() {
  const { data: fixtures, loading: lf } = useCollection('fixtures')
  const { data: clubs, loading: lc } = useCollection('clubs')
  const { data: playerStats, loading: lp } = useCollection('player_stats')
  const { data: matches,     loading: lm } = useLiveCollection('fixtures')

  const results = matches.filter((m) => m.status === 'completed').length
  const liveNow = matches.filter((m) => m.status === 'live').length
  const clubCount = clubs.length || 14

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      <StatCard
        label="Plánované zápasy"
        sublabel="Sezóna 2025/26"
        icon={Calendar}
        iconBg="bg-yellow-50"
        iconColor="text-yellow-500"
        value={fixtures.length}
        loading={lf}
      />
      <StatCard
        label="Výsledky"
        sublabel="Odohraté zápasy"
        icon={CheckCircle}
        iconBg="bg-green-50"
        iconColor="text-green-600"
        value={results}
        loading={lm}
      />
      <StatCard
        label="Kluby"
        sublabel="Aktívne v sezóne"
        icon={Shield}
        iconBg="bg-blue-50"
        iconColor="text-blue-500"
        value={clubCount}
        loading={lc}
      />
      <StatCard
        label="Hráči"
        sublabel="Záznamy štatistík"
        icon={Users}
        iconBg="bg-purple-50"
        iconColor="text-purple-500"
        value={playerStats.length}
        loading={lp}
      />
      <StatCard
        label="Live teraz"
        sublabel="Prebiehajúce zápasy"
        icon={Radio}
        iconBg={liveNow > 0 ? 'bg-red-50' : 'bg-slate-50'}
        iconColor={liveNow > 0 ? 'text-red-500' : 'text-slate-400'}
        value={liveNow}
        loading={lm}
      />
    </div>
  )
}
