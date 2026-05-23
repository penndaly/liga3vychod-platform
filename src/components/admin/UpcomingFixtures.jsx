import { Link } from 'react-router-dom'
import { Calendar, Clock, ChevronRight, Home, Plane } from 'lucide-react'
import { getClubByName } from '../../config/clubs-config'

function ClubBadge({ name, size = 5 }) {
  const cfg = getClubByName(name)
  const sz = `w-${size} h-${size}`
  return (
    <span
      className={`${sz} rounded-full shrink-0 inline-flex items-center justify-center text-[7px] font-black text-white`}
      style={{ background: cfg?.color ?? '#475569' }}
    >
      {cfg?.short?.slice(0, 2) ?? ''}
    </span>
  )
}

export default function UpcomingFixtures({ fixtures = [], clubName = '', loading = false }) {
  const upcoming = fixtures
    .filter((f) => f.status === 'scheduled' || f.status === 'postponed')
    .slice(0, 3)

  return (
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
            const isHome = f.home === clubName
            const opponent = isHome ? f.away : f.home
            return (
              <div key={i} className="px-5 py-4">
                {/* Meta row */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-600">{f.round}. kolo</span>
                  {f.date && (
                    <>
                      <span className="text-slate-800">·</span>
                      <span className="text-xs text-slate-600 flex items-center gap-1">
                        <Calendar size={9} />{f.date}
                      </span>
                    </>
                  )}
                  {f.time && (
                    <span className="text-xs text-green-500 flex items-center gap-1 ml-auto">
                      <Clock size={9} />{f.time}
                    </span>
                  )}
                  {f.status === 'postponed' && (
                    <span className="ml-auto text-xs font-bold text-yellow-400 uppercase tracking-wide">Odložený</span>
                  )}
                </div>

                {/* Teams row */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
                    <span className={`text-sm truncate ${isHome ? 'font-black text-white' : 'font-medium text-slate-400'}`}>
                      {f.home}
                    </span>
                    <ClubBadge name={f.home} />
                  </div>
                  <span className="text-slate-600 text-xs font-black shrink-0 bg-slate-800 px-2 py-0.5 rounded">vs</span>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <ClubBadge name={f.away} />
                    <span className={`text-sm truncate ${!isHome ? 'font-black text-white' : 'font-medium text-slate-400'}`}>
                      {f.away}
                    </span>
                  </div>
                </div>

                {/* Venue indicator */}
                <div className={`flex items-center gap-1 mt-1.5 text-xs font-bold ${isHome ? 'text-slate-700' : 'text-slate-700'}`}>
                  {isHome
                    ? <><Home size={9} className="text-green-600" /><span className="text-green-700">Domáci</span></>
                    : <><Plane size={9} className="text-slate-600" /><span>Hosťujúci</span></>
                  }
                  {f.venue && <span className="text-slate-700 ml-1">· {f.venue}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
