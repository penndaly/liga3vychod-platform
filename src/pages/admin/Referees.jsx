import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Search, Pencil, Trash2, RefreshCw, UserCheck, Phone, Mail } from 'lucide-react'
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { db } from '../../services/firebase'
import AdminLayout from '../../components/admin/AdminLayout'
import RefereeModal, { GRADES } from '../../components/admin/referees/RefereeModal'
import AssignmentModal from '../../components/admin/referees/AssignmentModal'
import AvailabilityModal from '../../components/admin/referees/AvailabilityModal'
import RatingModal from '../../components/admin/referees/RatingModal'

const SEASONS = ['2025/26', '2024/25', '2023/24']

const TABS = [
  { id: 'registry',     label: 'Zoznam' },
  { id: 'assignments',  label: 'Delegovanie' },
  { id: 'availability', label: 'Dostupnosť' },
  { id: 'ratings',      label: 'Hodnotenia' },
]

const TAB_CLS = (active) =>
  `px-4 py-2.5 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
    active ? 'border-yellow-400 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'
  }`

const GRADE_MAP = Object.fromEntries(GRADES.map((g) => [g.value, g]))

function GradeBadge({ value }) {
  const g = GRADE_MAP[value]
  if (!g) return null
  return <span className={`text-xs font-bold px-2 py-0.5 rounded ${g.cls}`}>{g.label}</span>
}

function Stars({ value }) {
  return (
    <span className="text-yellow-400 text-sm tracking-tight">
      {'★'.repeat(Math.round(value))}{'☆'.repeat(5 - Math.round(value))}
      <span className="text-slate-400 text-xs ml-1 font-bold">{value.toFixed(1)}</span>
    </span>
  )
}

export default function Referees() {
  const [season, setSeason] = useState('2025/26')
  const [tab, setTab] = useState('registry')

  const [referees,     setReferees]     = useState([])
  const [assignments,  setAssignments]  = useState([])
  const [availability, setAvailability] = useState([])
  const [ratings,      setRatings]      = useState([])
  const [loading, setLoading] = useState(true)

  const [refModal,   setRefModal]   = useState(null)
  const [asnModal,   setAsnModal]   = useState(null)
  const [availModal, setAvailModal] = useState(false)
  const [ratingModal,setRatingModal]= useState(null)

  const [search,      setSearch]      = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [roundFilter, setRoundFilter] = useState('all')

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [refSnap, asnSnap, availSnap, ratSnap] = await Promise.all([
        getDocs(collection(db, 'referees')),
        getDocs(query(collection(db, 'referee_assignments'), where('season', '==', season))),
        getDocs(collection(db, 'referee_availability')),
        getDocs(query(collection(db, 'referee_ratings'), where('season', '==', season))),
      ])
      setReferees(refSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setAssignments(asnSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setAvailability(availSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setRatings(ratSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch {
      toast.error('Chyba pri načítaní')
    } finally {
      setLoading(false)
    }
  }, [season])

  useEffect(() => { loadAll() }, [loadAll])

  async function del(collName, id, setFn) {
    try {
      await deleteDoc(doc(db, collName, id))
      setFn((prev) => prev.filter((r) => r.id !== id))
      toast.success('Záznam odstránený')
    } catch {
      toast.error('Chyba pri odstraňovaní')
    }
  }

  // Derived
  const filteredRefs = useMemo(() => referees.filter((r) => {
    if (gradeFilter !== 'all' && r.grade !== gradeFilter) return false
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [referees, gradeFilter, search])

  const rounds = useMemo(() => [...new Set(assignments.map((a) => a.round))].sort((a, b) => a - b), [assignments])

  const filteredAsn = useMemo(() =>
    roundFilter === 'all' ? assignments : assignments.filter((a) => a.round === Number(roundFilter)),
    [assignments, roundFilter])

  const groupedAsn = useMemo(() => {
    const map = {}
    filteredAsn.forEach((a) => {
      if (!map[a.round]) map[a.round] = []
      map[a.round].push(a)
    })
    return Object.entries(map).sort(([a], [b]) => Number(a) - Number(b))
  }, [filteredAsn])

  // Avg rating per referee
  const ratingStats = useMemo(() => {
    const map = {}
    ratings.forEach((r) => {
      if (!map[r.refereeId]) map[r.refereeId] = { name: r.refereeName, sum: 0, count: 0 }
      map[r.refereeId].sum += r.rating
      map[r.refereeId].count += 1
    })
    return Object.entries(map)
      .map(([id, v]) => ({ id, name: v.name, avg: v.sum / v.count, count: v.count }))
      .sort((a, b) => b.avg - a.avg)
  }, [ratings])

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900">Rozhodcovia</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {referees.filter((r) => r.active !== false).length} aktívnych · {assignments.length} delegovaní · {ratings.length} hodnotení
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select value={season} onChange={(e) => setSeason(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-yellow-400 transition-colors cursor-pointer">
              {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={loadAll} disabled={loading}
              className="flex items-center gap-2 border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-bold hover:bg-white transition-colors disabled:opacity-50">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-100 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={TAB_CLS(tab === t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── REGISTRY ── */}
        {tab === 'registry' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Hľadať..."
                    className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-yellow-400 transition-colors w-40" />
                </div>
                <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-yellow-400 bg-white">
                  <option value="all">Všetky licencie</option>
                  {GRADES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <button onClick={() => setRefModal('new')}
                className="flex items-center gap-2 bg-yellow-400 text-slate-950 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-yellow-300 transition-colors shrink-0">
                <Plus size={13} /> Pridať rozhodcu
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-slate-300 text-sm animate-pulse">Načítavam...</div>
              ) : filteredRefs.length === 0 ? (
                <div className="py-14 flex flex-col items-center text-slate-300">
                  <UserCheck size={32} className="mb-2" />
                  <p className="text-sm font-bold">Žiadni rozhodcovia</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-400 font-bold uppercase tracking-widest">
                      <th className="text-left px-5 py-2.5">Meno</th>
                      <th className="text-left px-3 py-2.5 hidden sm:table-cell">Licencia</th>
                      <th className="text-left px-3 py-2.5 hidden lg:table-cell">Kraj</th>
                      <th className="text-left px-3 py-2.5 hidden md:table-cell">Kontakt</th>
                      <th className="text-right px-3 py-2.5 hidden sm:table-cell">Priem.</th>
                      <th className="w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRefs.map((r) => {
                      const refRatings = ratings.filter((rt) => rt.refereeId === r.id)
                      const avg = refRatings.length
                        ? refRatings.reduce((s, rt) => s + rt.rating, 0) / refRatings.length
                        : null
                      return (
                        <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              {r.active === false && <span className="text-xs text-slate-300 font-bold">[Neaktívny]</span>}
                              <p className="font-bold text-slate-900">{r.name}</p>
                            </div>
                          </td>
                          <td className="px-3 py-3 hidden sm:table-cell"><GradeBadge value={r.grade} /></td>
                          <td className="px-3 py-3 text-xs text-slate-400 hidden lg:table-cell">{r.region}</td>
                          <td className="px-3 py-3 hidden md:table-cell">
                            <div className="flex items-center gap-3">
                              {r.phone && <span className="flex items-center gap-1 text-xs text-slate-400"><Phone size={10} />{r.phone}</span>}
                              {r.email && <span className="flex items-center gap-1 text-xs text-slate-400"><Mail size={10} />{r.email}</span>}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right hidden sm:table-cell">
                            {avg !== null ? <Stars value={avg} /> : <span className="text-xs text-slate-300">—</span>}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setRefModal(r)} className="text-slate-400 hover:text-slate-700 transition-colors"><Pencil size={13} /></button>
                              <button onClick={() => { if (window.confirm(`Odstrániť ${r.name}?`)) del('referees', r.id, setReferees) }}
                                className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── ASSIGNMENTS ── */}
        {tab === 'assignments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <select value={roundFilter} onChange={(e) => setRoundFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-yellow-400 bg-white">
                <option value="all">Všetky kolá</option>
                {rounds.map((r) => <option key={r} value={r}>{r}. kolo</option>)}
              </select>
              <button onClick={() => setAsnModal('new')}
                className="flex items-center gap-2 bg-yellow-400 text-slate-950 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-yellow-300 transition-colors shrink-0">
                <Plus size={13} /> Nové delegovanie
              </button>
            </div>

            {loading ? (
              <div className="bg-white rounded-xl border border-slate-100 p-8 text-center text-slate-300 animate-pulse text-sm">Načítavam...</div>
            ) : groupedAsn.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-100 py-14 text-center text-slate-300 text-sm font-bold">Žiadne delegovania</div>
            ) : (
              <div className="space-y-4">
                {groupedAsn.map(([round, matches]) => (
                  <div key={round} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500">{round}. kolo</p>
                    </div>
                    <table className="w-full text-sm">
                      <tbody>
                        {matches.map((m) => (
                          <tr key={m.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
                            <td className="px-5 py-3 w-1/3">
                              <p className="font-bold text-slate-900 text-xs">{m.home} <span className="text-slate-400">vs</span> {m.away}</p>
                              {m.date && <p className="text-xs text-slate-400 mt-0.5">{m.date}</p>}
                            </td>
                            <td className="px-3 py-3">
                              <p className="text-sm font-bold text-slate-900">{m.mainRefName}</p>
                              {(m.linesman1Name || m.linesman2Name) && (
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {[m.linesman1Name, m.linesman2Name].filter(Boolean).join(' · ')}
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-3 w-16">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setAsnModal(m)} className="text-slate-400 hover:text-slate-700 transition-colors"><Pencil size={13} /></button>
                                <button onClick={() => { if (window.confirm('Odstrániť?')) del('referee_assignments', m.id, setAssignments) }}
                                  className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── AVAILABILITY ── */}
        {tab === 'availability' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setAvailModal(true)}
                className="flex items-center gap-2 bg-yellow-400 text-slate-950 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-yellow-300 transition-colors">
                <Plus size={13} /> Pridať nedostupnosť
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-slate-300 text-sm animate-pulse">Načítavam...</div>
              ) : availability.length === 0 ? (
                <div className="py-14 text-center text-slate-300 text-sm font-bold">Žiadne záznamy o nedostupnosti</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-400 font-bold uppercase tracking-widest">
                      <th className="text-left px-5 py-2.5">Rozhodca</th>
                      <th className="text-left px-3 py-2.5">Kolá</th>
                      <th className="text-left px-3 py-2.5 hidden sm:table-cell">Dôvod</th>
                      <th className="w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {availability.map((a) => (
                      <tr key={a.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
                        <td className="px-5 py-3 font-bold text-slate-900">{a.refereeName}</td>
                        <td className="px-3 py-3">
                          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {a.fromRound === a.toRound ? `${a.fromRound}. kolo` : `${a.fromRound}–${a.toRound}. kolo`}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-400 hidden sm:table-cell">{a.reason}{a.note ? ` — ${a.note}` : ''}</td>
                        <td className="px-3 py-3">
                          <button onClick={() => { if (window.confirm('Odstrániť?')) del('referee_availability', a.id, setAvailability) }}
                            className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── RATINGS ── */}
        {tab === 'ratings' && (
          <div className="space-y-5">
            <div className="flex justify-end">
              <button onClick={() => setRatingModal('new')}
                className="flex items-center gap-2 bg-yellow-400 text-slate-950 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-yellow-300 transition-colors">
                <Plus size={13} /> Nové hodnotenie
              </button>
            </div>

            {/* Leaderboard */}
            {ratingStats.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">Priemerné hodnotenie</p>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {ratingStats.map((r, i) => (
                      <tr key={r.id} className="border-b border-slate-50 last:border-0">
                        <td className={`px-5 py-2.5 w-8 font-black text-sm ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-600' : 'text-slate-300'}`}>{i + 1}</td>
                        <td className="px-3 py-2.5 font-bold text-slate-900">{r.name}</td>
                        <td className="px-3 py-2.5"><Stars value={r.avg} /></td>
                        <td className="px-4 py-2.5 text-right text-xs text-slate-400">{r.count} hodnotení</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Recent ratings log */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Záznamy hodnotení</p>
              </div>
              {loading ? (
                <div className="p-8 text-center text-slate-300 text-sm animate-pulse">Načítavam...</div>
              ) : ratings.length === 0 ? (
                <div className="py-14 text-center text-slate-300 text-sm font-bold">Žiadne hodnotenia</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-400 font-bold uppercase tracking-widest">
                      <th className="text-left px-5 py-2.5">Rozhodca</th>
                      <th className="text-left px-3 py-2.5 hidden sm:table-cell">Zápas</th>
                      <th className="text-center px-3 py-2.5">Kolo</th>
                      <th className="text-left px-3 py-2.5">Hodnotenie</th>
                      <th className="w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {[...ratings].sort((a, b) => (b.round ?? 0) - (a.round ?? 0)).map((r) => (
                      <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
                        <td className="px-5 py-3 font-bold text-slate-900">{r.refereeName}</td>
                        <td className="px-3 py-3 text-xs text-slate-400 hidden sm:table-cell">{r.home} vs {r.away}</td>
                        <td className="px-3 py-3 text-center text-xs font-bold text-slate-500">{r.round}</td>
                        <td className="px-3 py-3"><Stars value={r.rating} /></td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setRatingModal(r)} className="text-slate-400 hover:text-slate-700 transition-colors"><Pencil size={13} /></button>
                            <button onClick={() => { if (window.confirm('Odstrániť?')) del('referee_ratings', r.id, setRatings) }}
                              className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {refModal    && <RefereeModal    entry={refModal === 'new' ? null : refModal} onClose={() => setRefModal(null)} onSaved={() => { setRefModal(null); loadAll() }} />}
      {asnModal    && <AssignmentModal season={season} entry={asnModal === 'new' ? null : asnModal} referees={referees} onClose={() => setAsnModal(null)} onSaved={() => { setAsnModal(null); loadAll() }} />}
      {availModal  && <AvailabilityModal referees={referees} onClose={() => setAvailModal(false)} onSaved={() => { setAvailModal(false); loadAll() }} />}
      {ratingModal && <RatingModal season={season} entry={ratingModal === 'new' ? null : ratingModal} referees={referees} onClose={() => setRatingModal(null)} onSaved={() => { setRatingModal(null); loadAll() }} />}
    </AdminLayout>
  )
}
