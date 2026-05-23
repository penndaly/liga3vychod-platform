import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { ChevronLeft, Target, HelpingHand, BookOpen, Square } from 'lucide-react'
import { db } from '../../services/firebase'
import { CLUBS_2025_26 as CLUBS } from '../../config/clubs-config'
import Navbar from '../../components/public/Navbar'
import Footer from '../../components/public/Footer'

const POSITION_BADGE = {
  GK:  'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30',
  DEF: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  MID: 'bg-green-500/20 text-green-400 border border-green-500/30',
  FWD: 'bg-red-500/20 text-red-400 border border-red-500/30',
}

const POSITION_LABELS = { GK: 'Brankár', DEF: 'Obranca', MID: 'Záložník', FWD: 'Útočník' }

function StatCard({ icon: Icon, value, label, color = 'text-yellow-400' }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col items-center gap-2">
      <Icon size={18} className={color} />
      <span className={`text-3xl font-black ${color}`}>{value ?? 0}</span>
      <span className="text-xs text-slate-500 font-bold uppercase tracking-wide text-center">{label}</span>
    </div>
  )
}

function formatDob(dob) {
  if (!dob) return null
  try {
    const d = new Date(dob)
    if (isNaN(d)) return dob
    const age = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    return `${d.toLocaleDateString('sk-SK')} (${age} r.)`
  } catch {
    return dob
  }
}

export default function PlayerProfile() {
  const { clubId, playerId } = useParams()
  const staticClub = CLUBS.find((c) => c.id === Number(clubId))

  const [player,  setPlayer]  = useState(null)
  const [stats,   setStats]   = useState([])
  const [clubDoc, setClubDoc] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!staticClub) { setLoading(false); return }
    async function load() {
      try {
        const [playerSnap, clubSnap] = await Promise.all([
          getDoc(doc(db, 'clubs', String(clubId), 'players', playerId)),
          getDoc(doc(db, 'clubs', String(clubId))),
        ])
        if (!playerSnap.exists()) { setLoading(false); return }
        const p = { id: playerSnap.id, ...playerSnap.data() }
        setPlayer(p)
        setClubDoc(clubSnap.exists() ? clubSnap.data() : null)

        const clubName = clubSnap.data()?.name ?? staticClub.name
        const statsSnap = await getDocs(
          query(collection(db, 'player_stats'), where('name', '==', p.name), where('club', '==', clubName))
        )
        setStats(statsSnap.docs.map((d) => d.data()).sort((a, b) => String(b.season).localeCompare(String(a.season))))
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [clubId, playerId, staticClub])

  const clubName = clubDoc?.name ?? staticClub?.name ?? ''
  const clubLogo = clubDoc?.logoUrl ?? null

  // Aggregate career totals
  const totals = stats.reduce(
    (acc, s) => ({
      goals:       acc.goals       + (s.goals       ?? 0),
      assists:     acc.assists     + (s.assists      ?? 0),
      yellowCards: acc.yellowCards + (s.yellowCards  ?? 0),
      redCards:    acc.redCards    + (s.redCards     ?? 0),
    }),
    { goals: 0, assists: 0, yellowCards: 0, redCards: 0 }
  )

  if (!loading && (!staticClub || !player)) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-slate-500 text-sm">Hráč nenájdený.</p>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* Back */}
        <Link to={`/kluby/${clubId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-yellow-400 transition-colors">
          <ChevronLeft size={14} /> {clubName || 'Klub'}
        </Link>

        {/* Player header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            {loading ? (
              <div className="w-full h-full bg-slate-700 animate-pulse rounded-2xl" />
            ) : (
              <span className="text-2xl font-black text-slate-500">
                {player?.number ?? '?'}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-2">
                <div className="h-8 w-48 bg-slate-700 animate-pulse rounded" />
                <div className="h-4 w-24 bg-slate-800 animate-pulse rounded" />
              </div>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {player?.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {player?.position && (
                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${POSITION_BADGE[player.position] ?? 'bg-slate-700 text-slate-400 border border-slate-600'}`}>
                      {POSITION_LABELS[player.position] ?? player.position}
                    </span>
                  )}
                  {player?.number && (
                    <span className="text-xs font-bold text-slate-500">#{player.number}</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 mt-4">
                  {player?.dob && (
                    <span className="text-sm text-slate-400">{formatDob(player.dob)}</span>
                  )}
                  {player?.nationality && (
                    <span className="text-sm text-slate-500">{player.nationality}</span>
                  )}
                </div>

                {/* Club link */}
                <Link to={`/kluby/${clubId}`} className="inline-flex items-center gap-2 mt-4 hover:opacity-80 transition-opacity">
                  {clubLogo ? (
                    <img src={clubLogo} alt={clubName} className="w-5 h-5 object-contain" />
                  ) : null}
                  <span className="text-sm font-bold text-slate-400 hover:text-white transition-colors">{clubName}</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Career stats totals */}
        {(stats.length > 0 || !loading) && (
          <section className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-yellow-400">
              Kariérne štatistiky
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon={Target}    value={totals.goals}       label="Góly"          color="text-green-400" />
              <StatCard icon={HelpingHand} value={totals.assists}    label="Asistencie"    color="text-blue-400" />
              <StatCard icon={BookOpen}  value={totals.yellowCards} label="Žlté karty"    color="text-yellow-400" />
              <StatCard icon={Square}    value={totals.redCards}    label="Červené karty" color="text-red-400" />
            </div>
          </section>
        )}

        {/* Per-season breakdown */}
        {stats.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-yellow-400">
              Sezóny
            </h2>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-500">Sezóna</th>
                    <th className="text-center px-3 py-3 text-xs font-black uppercase tracking-widest text-slate-500">G</th>
                    <th className="text-center px-3 py-3 text-xs font-black uppercase tracking-widest text-slate-500">A</th>
                    <th className="text-center px-3 py-3 text-xs font-black uppercase tracking-widest text-slate-500">ŽK</th>
                    <th className="text-center px-3 py-3 text-xs font-black uppercase tracking-widest text-slate-500">ČK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stats.map((s) => (
                    <tr key={s.season} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 font-bold text-slate-300">{s.season}</td>
                      <td className="text-center px-3 py-3 font-black text-green-400">{s.goals ?? 0}</td>
                      <td className="text-center px-3 py-3 font-bold text-blue-400">{s.assists ?? 0}</td>
                      <td className="text-center px-3 py-3 font-bold text-yellow-400">{s.yellowCards ?? 0}</td>
                      <td className="text-center px-3 py-3 font-bold text-red-400">{s.redCards ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!loading && stats.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center py-12 text-slate-600 text-sm font-bold">
            Žiadne štatistiky k dispozícii
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
