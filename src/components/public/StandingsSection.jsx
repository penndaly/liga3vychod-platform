import { Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { STANDINGS } from '../../data/placeholder'

const FORM_STYLE = {
  W: 'bg-green-600',
  D: 'bg-yellow-400',
  L: 'bg-red-500',
}

function FormDot({ result }) {
  return (
    <span
      className={`w-3.5 h-3.5 rounded-full inline-block ${FORM_STYLE[result]}`}
      title={result}
    />
  )
}

export default function StandingsSection() {
  return (
    <section className="bg-slate-900 border-y border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-yellow-400" />
            <h2 className="text-xs font-black uppercase tracking-widest text-yellow-400">
              Tabuľka — Top 5
            </h2>
          </div>
          <Link
            to="/tabulka"
            className="text-xs text-slate-600 hover:text-slate-300 uppercase tracking-wide transition-colors"
          >
            Celá tabuľka →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-600 text-xs uppercase tracking-wider border-b border-slate-800">
                <th className="text-left pb-3 w-8 font-bold">#</th>
                <th className="text-left pb-3 font-bold">Klub</th>
                <th className="text-center pb-3 w-10 font-bold">Z</th>
                <th className="text-center pb-3 w-10 font-bold">V</th>
                <th className="text-center pb-3 w-10 font-bold">R</th>
                <th className="text-center pb-3 w-10 font-bold">P</th>
                <th className="text-center pb-3 w-16 font-bold">G</th>
                <th className="text-center pb-3 w-12 font-bold">+/-</th>
                <th className="text-center pb-3 w-14 font-bold text-yellow-400">Body</th>
                <th className="text-center pb-3 font-bold">Forma</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {STANDINGS.map((row) => (
                <tr
                  key={row.pos}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="py-3">
                    <span
                      className={`w-6 h-6 flex items-center justify-center text-xs font-black rounded ${
                        row.pos === 1
                          ? 'bg-yellow-400 text-slate-950'
                          : 'text-slate-500'
                      }`}
                    >
                      {row.pos}
                    </span>
                  </td>
                  <td className="py-3 font-medium text-white group-hover:text-yellow-400 transition-colors">
                    {row.club}
                  </td>
                  <td className="py-3 text-center text-slate-400">{row.p}</td>
                  <td className="py-3 text-center text-slate-400">{row.w}</td>
                  <td className="py-3 text-center text-slate-400">{row.d}</td>
                  <td className="py-3 text-center text-slate-400">{row.l}</td>
                  <td className="py-3 text-center text-slate-400">
                    {row.gf}:{row.ga}
                  </td>
                  <td
                    className={`py-3 text-center font-medium ${
                      row.gd > 0
                        ? 'text-green-500'
                        : row.gd < 0
                        ? 'text-red-500'
                        : 'text-slate-400'
                    }`}
                  >
                    {row.gd > 0 ? '+' : ''}
                    {row.gd}
                  </td>
                  <td className="py-3 text-center font-black text-yellow-400">
                    {row.pts}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1 justify-center">
                      {row.form.map((r, i) => (
                        <FormDot key={i} result={r} />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
