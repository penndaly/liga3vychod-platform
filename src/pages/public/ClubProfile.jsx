import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  doc, getDoc, getDocs, collection, query,
  where, orderBy, limit,
} from 'firebase/firestore'
import {
  ChevronLeft, MapPin, Calendar, Building2,
  Users, Trophy, Target, HelpingHand, BookOpen, Square,
  ChevronRight,
} from 'lucide-react'
import { db } from '../../services/firebase'
import { CLUBS_2025_26 } from '../../config/clubs-config'
import Navbar from '../../components/public/Navbar'
import Footer from '../../components/public/Footer'

const POSITION_ORDER  = { GK: 1, DEF: 2, MID: 3, FWD: 4 }
const POSITION_LABELS = { GK: 'Brankári', DEF: 'Obrancovia', MID: 'Záložníci', FWD: 'Útočníci' }
const POSITION_GROUP_ORDER = ['GK', 'DEF', 'MID', 'FWD']
const POSITION_BADGE  = {
  GK:  'bg-yellow-400/20 text-yellow-400',
  DEF: 'bg-blue-500/20 text-blue-400',
  MID: 'bg-green-500/20 text-green-400',
  FWD: 'bg-red-500/20 text-red-400',
}

function FormDot({ result }) {
  const cls   = result === 'W' ? 'bg-green-500' : result === 'D' ? 'bg-yellow-400' : 'bg-red-500'
  const label = result === 'W' ? 'V'            : result === 'D' ? 'R'             : 'P'
  return (
    <div className={`w-6 h-6 rounded-full ${cls} flex items-center justify-center shrink-0`}>
      <span className="text-[10px] font-black text-white">{label}</span>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-xs font-black uppercase tracking-widest text-yellow-400 mb-3">
      {children}
    </h2>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const [y, m, d] = dateStr.split('-')
    if (y && m && d) return `${d}.${m}.${y}`
  } catch { /* ignore */ }
  return dateStr
}

export default function ClubProfile() {
  const { clubId } = useParams()
  const staticClub = CLUBS_2025_26.find((c) => c.id === Number(clubId))

  const [profile,         setProfile]         = useState(null)
  const [players,         setPlayers]         = useState([])
  const [completed,       setCompleted]       = useState([])
  const [upcoming,        setUpcoming]        = useState([])
  const [standing,        setStanding]        = useState(null)
  const [topScorers,      setTopScorers]      = useState([])
  const [aboutPage,       setAboutPage]       = useState(null)
  const [loading,         setLoading]         = useState(true)

  useEffect(() => {
    if (!staticClub) { setLoading(false); return }

    async function load() {
      try {
        const clubIdStr = String(clubId)

        const [profileSnap, playersSnap, allFixturesSnap, aboutSnap] = await Promise.all([
          getDoc(doc(db, 'clubs', clubIdStr)),
          getDocs(collection(db, 'clubs', clubIdStr, 'players')),
          getDocs(collection(db, 'fixtures')),
          getDoc(doc(db, 'clubs', clubIdStr, 'pages', 'about')),
        ])

        const profileData = profileSnap.exists() ? profileSnap.data() : null
        setProfile(profileData)
        setAboutPage(aboutSnap.exists() ? aboutSnap.data() : null)

        const rawPlayers = playersSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setPlayers(rawPlayers.sort((a, b) => (a.jerseyNumber ?? 99) - (b.jerseyNumber ?? 99)))

        const clubName = profileData?.name ?? staticClub.name
        const allFixtures = allFixturesSnap.docs.map((d) => d.data())
        const clubFixtures = allFixtures.filter((f) => f.home === clubName || f.away === clubName)

        const done = clubFixtures
          .filter((f) => f.status === 'completed')
          .sort((a, b) => (b.round ?? 0) - (a.round ?? 0))
          .slice(0, 5)
        setCompleted(done)

        const sched = clubFixtures
          .filter((f) => f.status !== 'completed')
          .sort((a, b) => (a.round ?? 0) - (b.round ?? 0))
          .slice(0, 3)
        setUpcoming(sched)

        // Standings position
        const standingSnap = await getDoc(doc(db, 'standings', clubName))
        setStanding(standingSnap.exists() ? standingSnap.data() : null)

        // Top scorers for this club (current season)
        const statsSnap = await getDocs(
          query(collection(db, 'player_stats'), where('club', '==', clubName))
        )
        const stats = statsSnap.docs.map((d) => d.data())
        const scorers = stats
          .filter((s) => (s.goals ?? 0) > 0)
          .sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))
          .slice(0, 5)
        setTopScorers(scorers)
      } catch (err) {
        console.error('ClubProfile load error:', err)
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
  const accentColor = staticClub.color

  const form = completed.map((f) => {
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

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* Back */}
        <Link
          to="/kluby"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-yellow-400 transition-colors"
        >
          <ChevronLeft size={14} /> Všetky kluby
        </Link>

        {/* Club header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="h-1.5" style={{ background: accentColor }} />
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
            {/* Logo */}
            <div className="w-24 h-24 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
              {loading ? (
                <div className="w-full h-full bg-slate-700 animate-pulse rounded-2xl" />
              ) : logoUrl ? (
                <img src={logoUrl} alt={clubName} className="w-full h-full object-contain p-2" />
              ) : (
                <span className="text-xl font-black" style={{ color: accentColor }}>
                  {staticClub.short}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-8 w-52 bg-slate-700 animate-pulse rounded" />
                  <div className="h-4 w-20 bg-slate-800 animate-pulse rounded" />
                </div>
              ) : (
                <>
                  <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                    {clubName}
                  </h1>
                  <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: accentColor }}>
                    {staticClub.short}
                  </p>

                  {(profile?.city || profile?.founded || profile?.ground) && (
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

                  {form.length > 0 && (
                    <div className="flex items-center gap-2 mt-5">
                      <span className="text-xs text-slate-600 font-bold uppercase tracking-wide">Forma</span>
                      <div className="flex gap-1">
                        {[...form].reverse().map((r, i) => <FormDot key={i} result={r} />)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* League position pill */}
            {!loading && standing && (
              <div className="shrink-0 flex flex-col items-center gap-1 bg-slate-800 rounded-2xl px-6 py-4">
                <Trophy size={13} className="text-yellow-400" />
                <span className="text-3xl font-black text-white">{standing.pos}.</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">miesto</span>
                <span className="text-sm font-black text-yellow-400 mt-1">{standing.finalPts} b.</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats strip */}
        {!loading && standing && (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Výhry',   value: standing.w, color: 'text-green-400' },
              { label: 'Remízy',  value: standing.d, color: 'text-yellow-400' },
              { label: 'Prehry',  value: standing.l, color: 'text-red-400' },
              { label: 'GR',      value: `${standing.gf}:${standing.ga}`, color: 'text-slate-300' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                <p className={`text-xl font-black ${color}`}>{value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Two-column layout: fixtures + top scorers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Recent results */}
          {(loading || completed.length > 0) && (
            <section>
              <SectionTitle>Posledné výsledky</SectionTitle>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
                  {completed.map((f, i) => {
                    const isHome = f.home === clubName
                    const opponent = isHome ? f.away : f.home
                    const gf = isHome ? f.homeGoals : f.awayGoals
                    const ga = isHome ? f.awayGoals : f.homeGoals
                    const result = gf > ga ? 'W' : gf < ga ? 'L' : 'D'
                    return (
                      <div key={i} className="flex items-center gap-3 px-5 py-3 text-sm">
                        <span className="text-slate-600 text-xs font-bold w-12 shrink-0">K. {f.round}</span>
                        <span className="flex-1 text-slate-400 truncate">
                          {isHome ? 'vs' : '@'} {opponent}
                        </span>
                        <span className="font-black text-white">{gf}:{ga}</span>
                        <FormDot result={result} />
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* Upcoming fixtures */}
          {(loading || upcoming.length > 0) && (
            <section>
              <SectionTitle>Najbližšie zápasy</SectionTitle>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : upcoming.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center py-10 text-slate-600 text-sm">
                  Žiadne naplánované zápasy
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
                  {upcoming.map((f, i) => {
                    const isHome = f.home === clubName
                    const opponent = isHome ? f.away : f.home
                    return (
                      <div key={i} className="flex items-center gap-3 px-5 py-3 text-sm">
                        <span className="text-slate-600 text-xs font-bold w-12 shrink-0">K. {f.round}</span>
                        <span className="flex-1 text-slate-400 truncate">
                          {isHome ? 'vs' : '@'} {opponent}
                        </span>
                        {f.date && (
                          <span className="text-xs text-slate-500 shrink-0">
                            {formatDate(f.date)}{f.time ? ` ${f.time}` : ''}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Top scorers */}
        {!loading && topScorers.length > 0 && (
          <section>
            <SectionTitle>Strelci</SectionTitle>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-500">Hráč</th>
                    <th className="text-center px-4 py-3 text-xs font-black uppercase tracking-widest text-green-500">G</th>
                    <th className="text-center px-4 py-3 text-xs font-black uppercase tracking-widest text-blue-400">A</th>
                    <th className="text-center px-4 py-3 text-xs font-black uppercase tracking-widest text-yellow-400">ŽK</th>
                    <th className="text-center px-4 py-3 text-xs font-black uppercase tracking-widest text-red-400">ČK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {topScorers.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 font-bold text-slate-200">{s.name}</td>
                      <td className="text-center px-4 py-3 font-black text-green-400">{s.goals ?? 0}</td>
                      <td className="text-center px-4 py-3 font-bold text-blue-400">{s.assists ?? 0}</td>
                      <td className="text-center px-4 py-3 font-bold text-yellow-400">{s.yellowCards ?? 0}</td>
                      <td className="text-center px-4 py-3 font-bold text-red-400">{s.redCards ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* About / CMS content */}
        {!loading && aboutPage?.published && (aboutPage.contentSK || aboutPage.contentEN) && (
          <section>
            <SectionTitle>O klube</SectionTitle>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              {aboutPage.titleSK && (
                <h3 className="text-lg font-black text-white">{aboutPage.titleSK}</h3>
              )}
              {aboutPage.contentSK && (
                <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
                  {aboutPage.contentSK}
                </p>
              )}
              {aboutPage.images?.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {aboutPage.images.slice(0, 6).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className="w-full aspect-video object-cover rounded-xl border border-slate-700"
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Roster */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionTitle>
              <Users size={12} className="inline mr-1.5" />Zostava
            </SectionTitle>
            {players.length > 0 && (
              <span className="text-xs text-slate-600">{players.length} hráčov</span>
            )}
          </div>

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
                    {grouped[pos]
                      .sort((a, b) => (a.jerseyNumber ?? 99) - (b.jerseyNumber ?? 99))
                      .map((player) => (
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
                          <ChevronRight size={12} className="text-slate-700 group-hover:text-slate-500 transition-colors shrink-0" />
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
