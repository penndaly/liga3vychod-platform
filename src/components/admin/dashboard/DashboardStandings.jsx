import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '../../../services/firebase'
import { getClubByName } from '../../../config/clubs-config'

const FORM_COLOR = { W: 'bg-green-500', D: 'bg-yellow-400', L: 'bg-red-400' }

export default function DashboardStandings() {
  const [top5,    setTop5]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'standings'), orderBy('pos', 'asc')),
      (snap) => {
        setTop5(snap.docs.filter((d) => d.id !== '_meta').slice(0, 5).map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-yellow-500" />
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
            Tabuľka — Top 5
          </h2>
        </div>
        <Link to="/admin/standings" className="text-xs text-slate-400 hover:text-slate-700 uppercase tracking-wide transition-colors">
          Celá →
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 text-center py-6">Načítavam...</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs border-b border-slate-100">
              <th className="text-left pb-2 w-8 font-bold">#</th>
              <th className="text-left pb-2 font-bold">Klub</th>
              <th className="text-center pb-2 w-10 font-bold">Body</th>
              <th className="text-center pb-2 font-bold">Forma</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {top5.map((row) => {
              const cfg = getClubByName(row.club)
              return (
                <tr key={row.pos} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5">
                    <span className={`w-5 h-5 flex items-center justify-center text-xs font-black rounded ${row.pos === 1 ? 'bg-yellow-400 text-slate-950' : 'text-slate-400'}`}>
                      {row.pos}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      {cfg && (
                        <span
                          className="w-4 h-4 rounded-full shrink-0 inline-flex items-center justify-center text-[7px] font-black text-white"
                          style={{ background: cfg.color }}
                        />
                      )}
                      <span className="font-medium text-slate-800 truncate">{row.club}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-center font-black text-slate-900">{row.finalPts}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1 justify-center">
                      {row.form.map((r, i) => (
                        <span key={i} className={`w-3 h-3 rounded-full ${FORM_COLOR[r] ?? 'bg-slate-200'}`} />
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
