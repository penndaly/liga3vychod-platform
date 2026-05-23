import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { ChevronLeft, MapPin, Calendar, Building2, Users } from 'lucide-react'
import { db } from '../../services/firebase'
import { CLUBS } from '../../data/placeholder'
import Navbar from '../../components/public/Navbar'
import Footer from '../../components/public/Footer'

const POSITION_ORDER = { GK: 1, DEF: 2, MID: 3, FWD: 4 }
const POSITION_LABELS = { GK: 'Brankári', DEF: 'Obrancovia', MID: 'Záložníci', FWD: 'Útočníci' }
const POSITION_GROUP_ORDER = ['GK', 'DEF', 'MID', 'FWD']

const POSITION_BADGE = {
  GK:  'bg-yellow-400/20 text-yellow-400',
  DEF: 'bg-blue-500/20 text-blue-400',
  MID: 'bg-green-500/20 text-green-400',
  FWD: 'bg-red-500/20 text-red-400',
}

function FormDot({ result }) {
  const cls = result === 'W' ? 'bg-green-500' : result === 'D' ? 'bg-yellow-400' : 'bg-red-500'
  const label = result === 'W' ? 'V' : result === 'D' ? 'R' : 'P'
  return (
    <div className={`w-6 h-6 rounded-full ${cls} flex items-center justify-center`}>
      <span className="text-xs font-black text-white">{label}</span>
    </div>
  )
}

export default function ClubProfile() {
  const { clubId } = useParams()
  const staticClub = CLUBS.find((c) => c.id === Number(clubId))

  const [profile,  setProfile]  = useState(null)
  const [players,  setPlayers]  = useState([])
  const [fixtures, setFixtures] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!staticClub) { setLoading(false); return }
    async function load() {
      try {
        const [profileSnap, playersSnap, fixturesSnap] = await Promise.all([
          getDoc(doc(db, 'clubs', String(clubId))),
          getDocs(collection(db, 'clubs', String(clubId), 'players')),
          getDocs(query(
            collection(db, 'fixtures'),
            where('status', '==', 'completed'),
          )),
        ])
        setProfile(profileSnap.exists() ? profileSnap.data() : null)
        const rawPlayers = playersSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setPlayers(rawPlayers.sort((a, b) => (a.number ?? 99) - (b.number ?? 99)))
        const allFinished = fixturesSnap.docs.map((d) => d.data())
        const clubName = profileSnap.data()?.name ?? staticClub.name
        const relevant = allFinished
          .filter((f) => f.home === clubName || f.away === clubName)
          .sort((a, b) => (b.round ?? 0) - (a.round ?? 0))
          .slice(0, 5)
          .reverse()
        setFixtures(relevant)
      } catch {
        // silently fail — show static data
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [clubId, staticClub])

  if (!staticClub) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-slate-500 text-sm">Klub nenájdený.</p>
        </div>
        <Footer />
      </div>
    )
  }

  const clubName = profile?.name ?? staticClub.name
  const logoUrl  = profile?.logoUrl ?? null

  // Form: compute W/D/L from recent fixtures
  const form = fixtures.map((f) => {
    const isHome = f.home === clubName
    const gf = isHome ? f.homeGoals : f.awayGoals
    const ga = isHome ? f.awayGoals : f.homeGoals
    if (gf > ga) return 'W'
    if (gf < ga) return 'L'
    return 'D'
  })

  // Group players by position
  const grouped = {}
  players.forEach((p) => {
    const pos = p.position ?? 'MID'
    if (!grouped[pos]) grouped[pos] = []
    grouped[pos].push(p)
  })
  POSITION_GROUP_ORDER.forEach((pos) => {
    if (grouped[pos]) {
      grouped[pos].sort((a, b) => (POSITION_ORDER[a.position] ?? 9) - (POSITION_ORDER[b.position] ?? 9) || (a.jerseyNumber ?? 99) - (b.jerseyNumber ?? 99))
    }
  })

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* Back */}
        <Link to="/kluby" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-yellow-400 transition-colors">
          <ChevronLeft size={14} /> Všetky kluby
        </Link>

        {/* Club header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-24 h-24 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
            {loading ? (
              <div className="w-full h-full bg-slate-700 animate-pulse rounded-2xl" />
            ) : logoUrl ? (
              <img src={logoUrl} alt={clubName} className="w-full h-full object-contain p-2" />
            ) : (
              <span className="text-lg font-black text-yellow-400">{staticClub.short}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {loading ? <span className="block w-48 h-8 bg-slate-700 animate-pulse rounded" /> : clubName}
            </h1>
            <p className="text-sm text-yellow-400 font-bold mt-1 uppercase tracking-widest">
              {staticClub.short}
            </p>

            {!loading && (profile?.city || profile?.founded || profile?.stadium) && (
              <div className="flex flex-wrap gap-4 mt-4">
                {profile.city && (
                  <span className="flex items-center gap-1.5 text-sm text-slate-400">
                    <MapPin size={13} className="text-slate-600" /> {profile.city}
                  </span>
                )}
                {profile.founded && (
                  <span className="flex items-center gap-1.5 text-sm text-slate-400">
                    <Calendar size={13} className="text-slate-600" /> Zal. {profile.founded}
                  </span>
                )}
                {profile.ground && (
                  <span className="flex items-center gap-1.5 text-sm text-slate-400">
                    <Building2 size={13} className="text-slate-600" /> {profile.ground}
                  </span>
                )}
              </div>
            )}

            {/* Form */}
            {form.length > 0 && (
              <div className="flex items-center gap-2 mt-5">
                <span className="text-xs text-slate-600 font-bold uppercase tracking-wide">Forma</span>
                <div className="flex gap-1">
                  {form.map((r, i) => <FormDot key={i} result={r} />)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent fixtures */}
        {fixtures.length > 0 && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-yellow-400">
              Posledné zápasy
            </h2>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
              {[...fixtures].reverse().map((f, i) => {
                const isHome = f.home === clubName
                const opponent = isHome ? f.away : f.home
                const gf = isHome ? f.homeGoals : f.awayGoals
                const ga = isHome ? f.awayGoals : f.homeGoals
                const result = gf > ga ? 'W' : gf < ga ? 'L' : 'D'
                return (
                  <div key={i} className="flex items-center gap-4 px-5 py-3 text-sm">
                    <span className="text-slate-600 text-xs font-bold w-14 shrink-0">K. {f.round}</span>
                    <span className="flex-1 text-slate-400 truncate">{isHome ? 'vs' : '@'} {opponent}</span>
                    <span className="font-black text-white">{gf}:{ga}</span>
                    <FormDot result={result} />
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Roster */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-yellow-400">
            <Users size={13} /> Zostava
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl h-14 animate-pulse" />
              ))}
            </div>
          ) : players.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center py-16 text-slate-600 text-sm font-bold">
              Zostava nie je k dispozícii
            </div>
          ) : (
            <div className="space-y-6">
              {POSITION_GROUP_ORDER.filter((pos) => grouped[pos]?.length).map((pos) => (
                <div key={pos}>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                    {POSITION_LABELS[pos]}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {grouped[pos].map((player) => (
                      <Link
                        key={player.id}
                        to={`/kluby/${clubId}/hrac/${player.id}`}
                        className="flex items-center gap-3 bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl px-4 py-3 transition-colors group"
                      >
                        <span className="w-8 text-center text-sm font-black text-slate-600 group-hover:text-slate-400 transition-colors shrink-0">
                          {player.jerseyNumber ?? '—'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-200 group-hover:text-white truncate transition-colors">
                            {player.name}
                          </p>
                          {player.nationality && (
                            <p className="text-xs text-slate-600">{player.nationality}</p>
                          )}
                        </div>
                        <span className={`text-xs font-black px-2 py-0.5 rounded shrink-0 ${POSITION_BADGE[player.position] ?? 'bg-slate-700 text-slate-400'}`}>
                          {player.position}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  )
}
