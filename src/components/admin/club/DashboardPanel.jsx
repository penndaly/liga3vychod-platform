import { Link } from 'react-router-dom'
import { Trophy, Users, Newspaper, Calendar, Clock, ChevronRight } from 'lucide-react'

const FORM_CLS = { W: 'bg-green-500', D: 'bg-yellow-400', L: 'bg-red-500' }

function FormDot({ result }) {
  return <span className={`w-2.5 h-2.5 rounded-full inline-block ${FORM_CLS[result] ?? 'bg-slate-700'}`} />
}

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

export default function DashboardPanel({ data }) {
  const { club, profile, players, fixtures, standings, news, playerStats, loading } = data

  const standing = standings.find((s) => s.club === club?.name)
  const upcoming = fixtures.filter((f) => f.status === 'scheduled').slice(0, 3)
  const recent   = fixtures.filter((f) => f.status === 'completed').slice(-5).reverse()

  // Build activity feed from recent results + recent news
  const activity = [
    ...recent.map((f) => ({
      type: 'fixture',
      label: f.home === club?.name
        ? `${f.homeGoals}:${f.awayGoals} vs ${f.away}`
        : `${f.awayGoals}:${f.homeGoals} @ ${f.home}`,
      sub: `${f.round}. kolo · ${f.date}`,
      result: (() => {
        const gf = f.home === club?.name ? f.homeGoals : f.awayGoals
        const ga = f.home === club?.name ? f.awayGoals : f.homeGoals
        return gf > ga ? 'W' : gf < ga ? 'L' : 'D'
      })(),
    })),
    ...news.slice(0, 2).map((n) => ({
      type: 'news',
      label: n.title,
      sub: 'Novinka',
      result: null,
    })),
  ].slice(0, 5)

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
              sub={standing?.form?.length ? undefined : undefined}
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

        {/* Recent activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Posledná aktivita</h3>
          </div>
          {loading ? (
            <div className="divide-y divide-slate-800/60">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3 animate-pulse">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-40 bg-slate-800 rounded" />
                    <div className="h-3 w-24 bg-slate-800/60 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : activity.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-700 text-sm font-bold">
              Žiadna aktivita
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {activity.map((item, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  {item.result ? (
                    <FormDot result={item.result} />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500/60 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-300 truncate">{item.label}</p>
                    <p className="text-xs text-slate-600">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming fixtures */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Najbližšie zápasy</h3>
            <Link to="/vysledky" className="text-xs text-slate-600 hover:text-yellow-400 transition-colors flex items-center gap-0.5">
              Všetky <ChevronRight size={11} />
            </Link>
          </div>
          {loading ? (
            <div className="divide-y divide-slate-800/60">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-4 animate-pulse flex items-center gap-4">
                  <div className="flex-1 h-4 bg-slate-800 rounded" />
                  <div className="w-10 h-6 bg-slate-800 rounded" />
                  <div className="flex-1 h-4 bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-700 text-sm font-bold">
              Žiadne naplánované zápasy
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {upcoming.map((f, i) => {
                const isHome = f.home === club?.name
                return (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-slate-600">{f.round}. kolo</span>
                      <span className="text-slate-800">·</span>
                      <span className="text-xs text-slate-600 flex items-center gap-1">
                        <Calendar size={9} />{f.date}
                      </span>
                      <span className="text-xs text-green-500 flex items-center gap-1 ml-auto">
                        <Clock size={9} />{f.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`flex-1 text-right text-sm truncate ${isHome ? 'font-black text-white' : 'font-medium text-slate-400'}`}>
                        {f.home}
                      </span>
                      <span className="text-slate-600 text-xs font-black shrink-0 bg-slate-800 px-2 py-0.5 rounded">vs</span>
                      <span className={`flex-1 text-sm truncate ${!isHome ? 'font-black text-white' : 'font-medium text-slate-400'}`}>
                        {f.away}
                      </span>
                    </div>
                    {!isHome && (
                      <p className="text-xs text-slate-700 mt-1 text-right">Hosťujúci</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
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
