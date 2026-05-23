import { Link } from 'react-router-dom'
import { Calendar, Clock } from 'lucide-react'
import { RECENT_MATCHES, UPCOMING_FIXTURES } from '../../data/placeholder'

function SectionHeader({ title, to }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xs font-black uppercase tracking-widest text-yellow-400 border-l-2 border-yellow-400 pl-3">
        {title}
      </h2>
      <Link to={to} className="text-xs text-slate-600 hover:text-slate-300 uppercase tracking-wide transition-colors">
        Všetky →
      </Link>
    </div>
  )
}

function MatchResult({ match }) {
  const homeWon = match.homeGoals > match.awayGoals
  const awayWon = match.awayGoals > match.homeGoals

  return (
    <div className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 px-4 py-3 rounded transition-colors">
      <span className="text-slate-600 text-xs w-6 text-center shrink-0">{match.round}</span>
      <div className="flex-1 text-right min-w-0">
        <span className={`text-sm font-medium truncate block ${homeWon ? 'text-white' : 'text-slate-400'}`}>
          {match.home}
        </span>
      </div>
      <div className="bg-slate-950 px-3 py-1.5 flex items-center gap-1 shrink-0">
        <span className={`text-sm font-black ${homeWon ? 'text-yellow-400' : 'text-slate-300'}`}>
          {match.homeGoals}
        </span>
        <span className="text-slate-600 text-xs mx-0.5">–</span>
        <span className={`text-sm font-black ${awayWon ? 'text-yellow-400' : 'text-slate-300'}`}>
          {match.awayGoals}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium truncate block ${awayWon ? 'text-white' : 'text-slate-400'}`}>
          {match.away}
        </span>
      </div>
      <span className="text-slate-600 text-xs shrink-0 hidden sm:block">{match.date}</span>
    </div>
  )
}

function Fixture({ match }) {
  return (
    <div className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 px-4 py-3 rounded transition-colors">
      <span className="text-slate-600 text-xs w-6 text-center shrink-0">{match.round}</span>
      <div className="hidden sm:flex items-center gap-1 text-slate-600 text-xs w-20 shrink-0">
        <Calendar size={10} />
        <span>{match.date}</span>
      </div>
      <div className="flex-1 text-right min-w-0">
        <span className="text-sm font-medium text-white truncate block">{match.home}</span>
      </div>
      <div className="bg-slate-950 px-3 py-1.5 shrink-0">
        <span className="text-slate-500 text-xs font-black uppercase">vs</span>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-white truncate block">{match.away}</span>
      </div>
      <div className="flex items-center gap-1 text-green-500 text-xs shrink-0">
        <Clock size={10} />
        <span>{match.time}</span>
      </div>
    </div>
  )
}

export default function MatchesSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <SectionHeader title="Posledné výsledky" to="/vysledky" />
          <div className="space-y-2">
            {RECENT_MATCHES.map((m, i) => <MatchResult key={i} match={m} />)}
          </div>
        </div>
        <div>
          <SectionHeader title="Najbližší program" to="/vysledky" />
          <div className="space-y-2">
            {UPCOMING_FIXTURES.map((m, i) => <Fixture key={i} match={m} />)}
          </div>
        </div>
      </div>
    </section>
  )
}
