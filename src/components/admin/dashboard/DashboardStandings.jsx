import { Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCollection } from '../../../hooks/useFirestore'
import { STANDINGS } from '../../../data/placeholder'

const FORM_COLOR = { W: 'bg-green-500', D: 'bg-yellow-400', L: 'bg-red-400' }

export default function DashboardStandings() {
  const { data, loading } = useCollection('standings')

  // Fall back to placeholder while DB is empty
  const rows = data.length > 0 ? data.slice(0, 5) : STANDINGS

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-yellow-500" />
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
            Tabuľka — Top 5
          </h2>
        </div>
        <Link
          to="/admin/standings"
          className="text-xs text-slate-400 hover:text-slate-700 uppercase tracking-wide transition-colors"
        >
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
            {rows.map((row) => (
              <tr key={row.pos} className="hover:bg-slate-50 transition-colors">
                <td className="py-2.5">
                  <span
                    className={`w-5 h-5 flex items-center justify-center text-xs font-black rounded ${
                      row.pos === 1 ? 'bg-yellow-400 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    {row.pos}
                  </span>
                </td>
                <td className="py-2.5 font-medium text-slate-800">{row.club}</td>
                <td className="py-2.5 text-center font-black text-slate-900">{row.pts}</td>
                <td className="py-2.5">
                  <div className="flex items-center gap-1 justify-center">
                    {row.form?.map((r, i) => (
                      <span key={i} className={`w-3 h-3 rounded-full ${FORM_COLOR[r] ?? 'bg-slate-200'}`} />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
