import { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore'
import { Trophy, ChevronDown, Minus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '../../services/firebase'
import { CLUBS } from '../../data/placeholder'
import { computeStandings } from '../../utils/standings'
import Navbar from '../../components/public/Navbar'
import Footer from '../../components/public/Footer'

const SEASONS = ['2025/26', '2024/25', '2023/24']

// Map club name → id for linking
const CLUB_ID_MAP = Object.fromEntries(CLUBS.map((c) => [c.name, c.id]))

function buildZones(rules) {
  const {
    teamsCount      = 14,
    promotionSpots  = 2,
    playoffSpots    = 1,
    relegationSpots = 1,
  } = rules ?? {}
  const zones = {}
  for (let i = 1; i <= promotionSpots; i++) zones[i] = 'promotion'
  const playoffStart = teamsCount - relegationSpots - playoffSpots + 1
  const playoffEnd   = teamsCount - relegationSpots
  for (let i = playoffStart; i <= playoffEnd; i++) zones[i] = 'playoff'
  for (let i = teamsCount - relegationSpots + 1; i <= teamsCount; i++) zones[i] = 'relegation'
  return zones
}

const ZONE_ROW = {
  promotion: 'border-l-2 border-green-500',
  playoff:   'border-l-2 border-yellow-400',
  relegation:'border-l-2 border-red-500',
}

const ZONE_POS = {
  promotion: 'bg-green-500/20 text-green-400',
  playoff:   'bg-yellow-400/20 text-yellow-400',
  relegation:'bg-red-500/20 text-red-400',
}

const ZONE_LABEL = {
  promotion: { cls: 'text-green-400', text: 'Postup' },
  playoff:   { cls: 'text-yellow-400', text: 'Baráž' },
  relegation:{ cls: 'text-red-400',   text: 'Zostup' },
}

const FORM_CLS = { W: 'bg-green-500', D: 'bg-yellow-400', L: 'bg-red-500' }

function FormDot({ result }) {
  return <span className={`w-3.5 h-3.5 rounded-full shrink-0 inline-block ${FORM_CLS[result] ?? 'bg-slate-700'}`} title={result} />
}

function SeasonPicker({ value, onChange }) {
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-slate-900 border border-slate-800 text-white text-sm font-bold rounded-xl px-4 py-2 pr-8 outline-none focus:border-yellow-400 cursor-pointer transition-colors"
      >
        {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-800/60 animate-pulse">
      <td className="py-3 px-4"><div className="w-6 h-6 bg-slate-800 rounded" /></td>
      <td className="py-3 px-2"><div className="h-4 w-32 bg-slate-800 rounded" /></td>
      {[1,2,3,4,5,6,7].map((i) => (
        <td key={i} className="py-3 px-2 text-center"><div className="h-4 w-6 bg-slate-800 rounded mx-auto" /></td>
      ))}
      <td className="py-3 px-3"><div className="flex gap-1">{[1,2,3,4,5].map((i) => <div key={i} className="w-3.5 h-3.5 bg-slate-800 rounded-full" />)}</div></td>
    </tr>
  )
}

export default function StandingsPage() {
  const [season,     setSeason]     = useState(SEASONS[0])
  const [fixtures,   setFixtures]   = useState([])
  const [deductions, setDeductions] = useState([])
  const [rules,      setRules]      = useState(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    setLoading(true)
    async function load() {
      try {
        const [fxSnap, dedSnap, rulesSnap] = await Promise.all([
          getDocs(collection(db, 'fixtures')),
          getDocs(query(collection(db, 'deductions'), where('season', '==', season))),
          getDoc(doc(db, 'settings', 'rules')),
        ])
        setFixtures(fxSnap.docs.map((d) => d.data()))
        setDeductions(dedSnap.docs.map((d) => d.data()))
        setRules(rulesSnap.exists() ? rulesSnap.data() : null)
      } catch {
        // silently fall back to computed standings from empty data
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [season])

  const standings = useMemo(
    () => computeStandings(fixtures, deductions),
    [fixtures, deductions]
  )

  const zones = useMemo(() => buildZones(rules), [rules])

  const hasDeductions = standings.some((r) => r.deduction > 0)

  // Build legend entries from unique zone values in use
  const legendZones = [...new Set(Object.values(zones))].filter((z) => ZONE_LABEL[z])

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={13} className="text-yellow-400" />
              <span className="text-xs font-black uppercase tracking-widest text-yellow-400">Tabuľka</span>
            </div>
            <h1 className="text-3xl font-black text-white">Tabuľka ligy</h1>
          </div>
          <SeasonPicker value={season} onChange={setSeason} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-600 text-xs uppercase tracking-wider">
                  <th className="text-center py-3 px-4 font-bold w-10">#</th>
                  <th className="text-left py-3 px-2 font-bold">Klub</th>
                  <th className="text-center py-3 px-2 font-bold w-10">Z</th>
                  <th className="text-center py-3 px-2 font-bold w-10">V</th>
                  <th className="text-center py-3 px-2 font-bold w-10">R</th>
                  <th className="text-center py-3 px-2 font-bold w-10">P</th>
                  <th className="text-center py-3 px-2 font-bold w-16">G</th>
                  <th className="text-center py-3 px-2 font-bold w-12">+/-</th>
                  {hasDeductions && (
                    <th className="text-center py-3 px-2 font-bold w-10" title="Odpočet">
                      Odp.
                    </th>
                  )}
                  <th className="text-center py-3 px-3 font-bold w-14 text-yellow-400">Body</th>
                  <th className="text-center py-3 px-3 font-bold">Forma</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 14 }).map((_, i) => <SkeletonRow key={i} />)
                  : standings.map((row) => {
                      const zone    = zones[row.pos]
                      const clubId  = CLUB_ID_MAP[row.club]
                      const gdColor = row.gd > 0 ? 'text-green-400' : row.gd < 0 ? 'text-red-400' : 'text-slate-500'
                      return (
                        <tr
                          key={row.pos}
                          className={`border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors group ${zone ? ZONE_ROW[zone] : 'border-l-2 border-transparent'}`}
                        >
                          {/* Position */}
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-black ${zone ? ZONE_POS[zone] : 'text-slate-600'}`}>
                              {row.pos}
                            </span>
                          </td>

                          {/* Club */}
                          <td className="py-3 px-2">
                            {clubId ? (
                              <Link
                                to={`/kluby/${clubId}`}
                                className="font-bold text-slate-300 group-hover:text-white hover:text-yellow-400 transition-colors truncate block"
                              >
                                {row.club}
                              </Link>
                            ) : (
                              <span className="font-bold text-slate-300 group-hover:text-white transition-colors truncate block">
                                {row.club}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-2 text-center text-slate-400">{row.p}</td>
                          <td className="py-3 px-2 text-center text-slate-400">{row.w}</td>
                          <td className="py-3 px-2 text-center text-slate-400">{row.d}</td>
                          <td className="py-3 px-2 text-center text-slate-400">{row.l}</td>
                          <td className="py-3 px-2 text-center text-slate-400">{row.gf}:{row.ga}</td>
                          <td className={`py-3 px-2 text-center font-bold ${gdColor}`}>
                            {row.gd > 0 ? '+' : ''}{row.gd}
                          </td>

                          {hasDeductions && (
                            <td className="py-3 px-2 text-center">
                              {row.deduction > 0
                                ? <span className="text-red-400 font-bold text-xs">-{row.deduction}</span>
                                : <Minus size={10} className="text-slate-800 mx-auto" />
                              }
                            </td>
                          )}

                          {/* Points */}
                          <td className="py-3 px-3 text-center">
                            <span className="text-yellow-400 font-black text-base">{row.finalPts}</span>
                          </td>

                          {/* Form */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1 justify-center">
                              {row.form.length > 0
                                ? row.form.map((r, i) => <FormDot key={i} result={r} />)
                                : <span className="text-slate-700 text-xs">—</span>
                              }
                            </div>
                          </td>
                        </tr>
                      )
                    })
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend + info */}
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {/* Zone legend */}
          {legendZones.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {legendZones.map((zone) => (
                <div key={zone} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${zone === 'promotion' ? 'bg-green-500' : zone === 'playoff' ? 'bg-yellow-400' : 'bg-red-500'}`} />
                  <span className={`text-xs font-bold ${ZONE_LABEL[zone].cls}`}>{ZONE_LABEL[zone].text}</span>
                </div>
              ))}
            </div>
          )}

          <div className="sm:ml-auto text-xs text-slate-600 font-bold">
            Z = zápasy · V = výhry · R = remízy · P = prehry · G = skóre · Body = výsledné body
          </div>
        </div>

        {/* Deductions note */}
        {hasDeductions && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Odpočty bodov</p>
            <div className="space-y-1">
              {standings.filter((r) => r.deduction > 0).map((r) => (
                <p key={r.club} className="text-xs text-slate-400">
                  <span className="font-bold text-slate-300">{r.club}</span>
                  {' '}&mdash;{' '}
                  <span className="text-red-400 font-bold">-{r.deduction} b.</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
