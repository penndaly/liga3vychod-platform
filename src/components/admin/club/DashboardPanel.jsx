import { Trophy, Users, Newspaper } from 'lucide-react'
import RecentActivity from '../RecentActivity'
import UpcomingFixtures from '../UpcomingFixtures'

function StatCard({ icon: Icon, value, label, color = 'text-yellow-400', sub }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 flex flex-col gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-slate-700/60`}>
        <Icon size={16} className={color} />
      </div>
      <div>
        <p className={`text-3xl font-black leading-none ${color}`}>{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-600 font-bold mt-0.5">{sub}</p>}
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1">{label}</p>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 animate-pulse">
      <div className="w-9 h-9 rounded-xl bg-slate-700 mb-3" />
      <div className="h-8 w-12 bg-slate-700 rounded mb-1" />
      <div className="h-3 w-20 bg-slate-700/60 rounded" />
    </div>
  )
}

export default function DashboardPanel({ data, clubColor = '#facc15' }) {
  const { club, profile, players, fixtures, standings, news, playerStats, loading } = data

  const standing = standings.find((s) => s.club === club?.name)

  return (
    <div className="space-y-6">

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              icon={Trophy}
              value={standing ? `#${standing.pos}` : '—'}
              label="Pozícia"
              color="text-yellow-400"
            />
            <StatCard
              icon={Trophy}
              value={standing?.finalPts ?? '—'}
              label="Body"
              color="text-green-400"
              sub={standing ? `${standing.w}V ${standing.d}R ${standing.l}P` : undefined}
            />
            <StatCard
              icon={Users}
              value={players.length}
              label="Hráči"
              color="text-blue-400"
            />
            <StatCard
              icon={Newspaper}
              value={news.length}
              label="Novinky"
              color="text-purple-400"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentActivity fixtures={fixtures} news={news} clubName={club?.name ?? ''} loading={loading} />
        <UpcomingFixtures fixtures={fixtures} clubName={club?.name ?? ''} loading={loading} />
      </div>

      {/* Form + top scorers */}
      {!loading && standing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Form guide */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Forma (posledných 5)</h3>
            {standing.form.length > 0 ? (
              <div className="flex items-center gap-2">
                {standing.form.map((r, i) => (
                  <div key={i} className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                    r === 'W' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : r === 'D' ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {r === 'W' ? 'V' : r === 'D' ? 'R' : 'P'}
                  </div>
                ))}
                <div className="ml-auto text-right">
                  <p className="text-xs text-slate-600">{standing.gf} strelených</p>
                  <p className="text-xs text-slate-600">{standing.ga} obdržaných</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-700">Žiadne výsledky</p>
            )}
          </div>

          {/* Top scorers */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Strelci klubu</h3>
            {playerStats.length === 0 ? (
              <p className="text-sm text-slate-700">Žiadne štatistiky</p>
            ) : (
              <div className="space-y-2">
                {[...playerStats]
                  .filter((p) => (p.goals ?? 0) > 0)
                  .sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))
                  .slice(0, 4)
                  .map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-600 w-4">{i + 1}</span>
                      <span className="flex-1 text-sm font-bold text-slate-300 truncate">{p.name}</span>
                      <span className="text-yellow-400 font-black text-sm">{p.goals}</span>
                      <span className="text-xs text-slate-600">gólov</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
