import { useState, useEffect, useCallback, useMemo } from 'react'
import { ChevronDown, RefreshCw, Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { db } from '../../services/firebase'
import AdminLayout from '../../components/admin/AdminLayout'
import SuspensionModal, { SUSPENSION_REASONS } from '../../components/admin/disciplinary/SuspensionModal'
import FineModal from '../../components/admin/disciplinary/FineModal'
import DecisionModal from '../../components/admin/disciplinary/DecisionModal'
import CardWatchPanel from '../../components/admin/disciplinary/CardWatchPanel'

const SEASONS = ['2025/26', '2024/25', '2023/24']

const TABS = [
  { id: 'suspensions', label: 'Suspenzie' },
  { id: 'fines',       label: 'Pokuty' },
  { id: 'cards',       label: 'Sledovanie kariet' },
  { id: 'decisions',   label: 'Rozhodnutia' },
]

const TAB_CLS = (active) =>
  `px-4 py-2.5 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
    active ? 'border-yellow-400 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'
  }`

function StatusBadge({ status, type }) {
  if (type === 'suspension') {
    return status === 'active'
      ? <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">Aktívna</span>
      : <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">Odsedená</span>
  }
  return status === 'unpaid'
    ? <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">Nezaplatená</span>
    : <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">Zaplatená</span>
}

function reasonLabel(value) {
  return SUSPENSION_REASONS.find((r) => r.value === value)?.label ?? value
}

export default function Disciplinary() {
  const [season, setSeason] = useState('2025/26')
  const [tab, setTab] = useState('suspensions')

  const [suspensions, setSuspensions] = useState([])
  const [fines, setFines]             = useState([])
  const [decisions, setDecisions]     = useState([])
  const [playerStats, setPlayerStats] = useState([])
  const [loading, setLoading]         = useState(true)

  const [suspModal, setSuspModal]   = useState(null)
  const [fineModal, setFineModal]   = useState(null)
  const [decModal,  setDecModal]    = useState(null)
  const [expandedDec, setExpandedDec] = useState(null)

  const [suspFilter, setSuspFilter] = useState('all')
  const [fineFilter, setFineFilter] = useState('all')

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [suspSnap, fineSnap, decSnap, statsSnap] = await Promise.all([
        getDocs(query(collection(db, 'disciplinary_suspensions'), where('season', '==', season))),
        getDocs(query(collection(db, 'disciplinary_fines'),       where('season', '==', season))),
        getDocs(query(collection(db, 'disciplinary_decisions'),   where('season', '==', season))),
        getDocs(query(collection(db, 'player_stats'),             where('season', '==', season))),
      ])
      setSuspensions(suspSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setFines(fineSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setDecisions(decSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setPlayerStats(statsSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch {
      toast.error('Chyba pri načítaní')
    } finally {
      setLoading(false)
    }
  }, [season])

  useEffect(() => { loadAll() }, [loadAll])

  async function deleteRecord(collName, id, setFn) {
    try {
      await deleteDoc(doc(db, collName, id))
      setFn((prev) => prev.filter((r) => r.id !== id))
      toast.success('Záznam odstránený')
    } catch {
      toast.error('Chyba pri odstraňovaní')
    }
  }

  const filteredSusp = useMemo(() =>
    suspFilter === 'all' ? suspensions : suspensions.filter((s) => s.status === suspFilter),
    [suspensions, suspFilter])

  const filteredFines = useMemo(() =>
    fineFilter === 'all' ? fines : fines.filter((f) => f.status === fineFilter),
    [fines, fineFilter])

  const activeCount   = suspensions.filter((s) => s.status === 'active').length
  const unpaidTotal   = fines.filter((f) => f.status === 'unpaid').reduce((s, f) => s + (f.amount ?? 0), 0)
  const cardDanger    = playerStats.filter((p) => (p.yellowCards ?? 0) >= 5).length
  const cardWarning   = playerStats.filter((p) => (p.yellowCards ?? 0) === 4).length

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900">Disciplinárne</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {activeCount} aktívnych suspenzií · {unpaidTotal > 0 ? `${unpaidTotal} € nezaplatených` : 'bez dlhov'} · {cardDanger + cardWarning} hráčov na sledovaní
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <select value={season} onChange={(e) => setSeason(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-yellow-400 transition-colors cursor-pointer">
                {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button onClick={loadAll} disabled={loading}
              className="flex items-center gap-2 border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-bold hover:bg-white transition-colors disabled:opacity-50">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Obnoviť</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-100 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={TAB_CLS(tab === t.id)}>
              {t.label}
              {t.id === 'suspensions' && activeCount > 0 && (
                <span className="ml-1.5 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">{activeCount}</span>
              )}
              {t.id === 'fines' && unpaidTotal > 0 && (
                <span className="ml-1.5 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">{unpaidTotal} €</span>
              )}
              {t.id === 'cards' && (cardDanger + cardWarning) > 0 && (
                <span className="ml-1.5 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold">{cardDanger + cardWarning}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── SUSPENSIONS ── */}
        {tab === 'suspensions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {[['all', 'Všetky'], ['active', 'Aktívne'], ['served', 'Odsedené']].map(([v, l]) => (
                  <button key={v} onClick={() => setSuspFilter(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${suspFilter === v ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    {l}
                  </button>
                ))}
              </div>
              <button onClick={() => setSuspModal('new')}
                className="flex items-center gap-2 bg-yellow-400 text-slate-950 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-yellow-300 transition-colors">
                <Plus size={13} /> Nová suspenzia
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-slate-300 text-sm animate-pulse">Načítavam...</div>
              ) : filteredSusp.length === 0 ? (
                <div className="py-14 text-center text-slate-300 text-sm font-bold">Žiadne záznamy</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-400 font-bold uppercase tracking-widest">
                      <th className="text-left px-5 py-2.5">Hráč / Klub</th>
                      <th className="text-left px-3 py-2.5 hidden md:table-cell">Dôvod</th>
                      <th className="text-center px-3 py-2.5">Kolá</th>
                      <th className="text-left px-3 py-2.5">Stav</th>
                      <th className="w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSusp.map((s) => (
                      <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                        <td className="px-5 py-3">
                          <p className="font-bold text-slate-900">{s.playerName}</p>
                          <p className="text-xs text-slate-400">{s.club}</p>
                        </td>
                        <td className="px-3 py-3 text-slate-500 hidden md:table-cell text-xs">{reasonLabel(s.reason)}</td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-xs font-bold text-slate-700">{s.fromRound}–{s.toRound}</span>
                          <span className="text-xs text-slate-400 ml-1">({s.matchesBanned}z)</span>
                        </td>
                        <td className="px-3 py-3"><StatusBadge status={s.status} type="suspension" /></td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setSuspModal(s)} className="text-slate-400 hover:text-slate-700 transition-colors"><Pencil size={13} /></button>
                            <button onClick={() => { if (window.confirm(`Odstrániť suspenziu?`)) deleteRecord('disciplinary_suspensions', s.id, setSuspensions) }}
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

        {/* ── FINES ── */}
        {tab === 'fines' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {[['all', 'Všetky'], ['unpaid', 'Nezaplatené'], ['paid', 'Zaplatené']].map(([v, l]) => (
                  <button key={v} onClick={() => setFineFilter(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${fineFilter === v ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    {l}
                  </button>
                ))}
              </div>
              <button onClick={() => setFineModal('new')}
                className="flex items-center gap-2 bg-yellow-400 text-slate-950 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-yellow-300 transition-colors">
                <Plus size={13} /> Nová pokuta
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-slate-300 text-sm animate-pulse">Načítavam...</div>
              ) : filteredFines.length === 0 ? (
                <div className="py-14 text-center text-slate-300 text-sm font-bold">Žiadne záznamy</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-400 font-bold uppercase tracking-widest">
                      <th className="text-left px-5 py-2.5">Klub / Hráč</th>
                      <th className="text-left px-3 py-2.5 hidden sm:table-cell">Dôvod</th>
                      <th className="text-right px-3 py-2.5">Suma</th>
                      <th className="text-left px-3 py-2.5">Stav</th>
                      <th className="w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFines.map((f) => (
                      <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                        <td className="px-5 py-3">
                          <p className="font-bold text-slate-900">{f.club}</p>
                          {f.playerName && <p className="text-xs text-slate-400">{f.playerName}</p>}
                        </td>
                        <td className="px-3 py-3 text-slate-500 text-xs hidden sm:table-cell">{f.reason}</td>
                        <td className="px-3 py-3 text-right font-black text-slate-900">{f.amount} €</td>
                        <td className="px-3 py-3"><StatusBadge status={f.status} type="fine" /></td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setFineModal(f)} className="text-slate-400 hover:text-slate-700 transition-colors"><Pencil size={13} /></button>
                            <button onClick={() => { if (window.confirm('Odstrániť pokutu?')) deleteRecord('disciplinary_fines', f.id, setFines) }}
                              className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {filteredFines.length > 0 && (
              <div className="flex justify-end">
                <div className="bg-white border border-slate-100 rounded-xl px-5 py-3 text-sm">
                  <span className="text-slate-400 font-bold">Celkovo nezaplatené: </span>
                  <span className="font-black text-red-600">{unpaidTotal} €</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CARD WATCH ── */}
        {tab === 'cards' && (
          <CardWatchPanel players={playerStats} loading={loading} />
        )}

        {/* ── DECISIONS ── */}
        {tab === 'decisions' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setDecModal('new')}
                className="flex items-center gap-2 bg-yellow-400 text-slate-950 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-yellow-300 transition-colors">
                <Plus size={13} /> Nové rozhodnutie
              </button>
            </div>

            <div className="space-y-2">
              {loading ? (
                <div className="bg-white rounded-xl border border-slate-100 p-8 text-center text-slate-300 text-sm animate-pulse">Načítavam...</div>
              ) : decisions.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-100 py-14 text-center text-slate-300 text-sm font-bold">Žiadne rozhodnutia</div>
              ) : (
                decisions.map((d) => (
                  <div key={d.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                    <div
                      className="flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors group"
                      onClick={() => setExpandedDec(expandedDec === d.id ? null : d.id)}
                    >
                      <ChevronRight size={14} className={`text-slate-400 mt-0.5 shrink-0 transition-transform ${expandedDec === d.id ? 'rotate-90' : ''}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm">{d.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-slate-400">{d.club}</span>
                          {d.playerName && <><span className="text-slate-300 text-xs">·</span><span className="text-xs text-slate-400">{d.playerName}</span></>}
                          {d.round && <><span className="text-slate-300 text-xs">·</span><span className="text-xs text-slate-400">{d.round}. kolo</span></>}
                          {d.date && <><span className="text-slate-300 text-xs">·</span><span className="text-xs text-slate-400">{d.date}</span></>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); setDecModal(d) }} className="text-slate-400 hover:text-slate-700 transition-colors"><Pencil size={13} /></button>
                        <button onClick={(e) => { e.stopPropagation(); if (window.confirm('Odstrániť rozhodnutie?')) deleteRecord('disciplinary_decisions', d.id, setDecisions) }}
                          className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    {expandedDec === d.id && (
                      <div className="px-5 pb-4 pt-0 border-t border-slate-50">
                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{d.decision}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {suspModal && (
        <SuspensionModal season={season} entry={suspModal === 'new' ? null : suspModal}
          onClose={() => setSuspModal(null)} onSaved={() => { setSuspModal(null); loadAll() }} />
      )}
      {fineModal && (
        <FineModal season={season} entry={fineModal === 'new' ? null : fineModal}
          onClose={() => setFineModal(null)} onSaved={() => { setFineModal(null); loadAll() }} />
      )}
      {decModal && (
        <DecisionModal season={season} entry={decModal === 'new' ? null : decModal}
          onClose={() => setDecModal(null)} onSaved={() => { setDecModal(null); loadAll() }} />
      )}
    </AdminLayout>
  )
}
