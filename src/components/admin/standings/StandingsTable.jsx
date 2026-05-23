import { RefreshCw } from 'lucide-react'

const ZONES = {
  1: 'promotion', 2: 'promotion',
  13: 'playoff',
  14: 'relegation',
}

const FORM_COLOR = { W: 'bg-green-500', D: 'bg-yellow-400', L: 'bg-red-400' }

const ZONE_ROW = {
  promotion:  'border-l-4 border-green-500',
  playoff:    'border-l-4 border-amber-400',
  relegation: 'border-l-4 border-red-500',
}
const ZONE_POS = {
  promotion:  'bg-green-100 text-green-800',
  playoff:    'bg-amber-100 text-amber-700',
  relegation: 'bg-red-100 text-red-600',
}

function FormDots({ form }) {
  return (
    <div className="flex items-center gap-1">
      {form.length === 0
        ? <span className="text-xs text-slate-300">—</span>
        : form.map((r, i) => (
            <span
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${FORM_COLOR[r] ?? 'bg-slate-200'}`}
              title={r}
            />
          ))}
    </div>
  )
}

export default function StandingsTable({ standings, hasDeductions, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-20 text-center">
        <RefreshCw size={20} className="mx-auto text-slate-300 animate-spin mb-2" />
        <p className="text-sm text-slate-400">Vypočítavam tabuľku...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
          Tabuľka — automatický výpočet
        </h2>
        <span className="text-xs text-slate-400">{standings.length} tímov</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
              <th className="text-center py-3 pl-5 w-10">#</th>
              <th className="text-left py-3 pl-3">Klub</th>
              <th className="text-center py-3 w-9">Z</th>
              <th className="text-center py-3 w-9">V</th>
              <th className="text-center py-3 w-9">R</th>
              <th className="text-center py-3 w-9">P</th>
              <th className="text-center py-3 w-14 hidden sm:table-cell">G</th>
              <th className="text-center py-3 w-12">+/-</th>
              <th className="text-center py-3 w-12">Body</th>
              {hasDeductions && (
                <th className="text-center py-3 w-14 text-red-400">Odp.</th>
              )}
              {hasDeductions && (
                <th className="text-center py-3 w-14 text-yellow-600">Body*</th>
              )}
              <th className="text-center py-3 pr-5 hidden md:table-cell">Forma</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {standings.map((row) => {
              const zone = ZONES[row.pos] ?? null
              return (
                <tr
                  key={row.club}
                  className={`hover:bg-slate-50 transition-colors ${zone ? ZONE_ROW[zone] : 'border-l-4 border-transparent'}`}
                >
                  <td className="py-3 pl-3 text-center">
                    <span className={`w-6 h-6 flex items-center justify-center text-xs font-black rounded mx-auto ${
                      zone ? ZONE_POS[zone] : 'text-slate-400'
                    }`}>
                      {row.pos}
                    </span>
                  </td>
                  <td className="py-3 pl-3 font-medium text-slate-900 max-w-[160px] truncate">
                    {row.club}
                  </td>
                  <td className="py-3 text-center text-slate-500">{row.p}</td>
                  <td className="py-3 text-center text-slate-500">{row.w}</td>
                  <td className="py-3 text-center text-slate-500">{row.d}</td>
                  <td className="py-3 text-center text-slate-500">{row.l}</td>
                  <td className="py-3 text-center text-slate-500 hidden sm:table-cell">
                    {row.gf}:{row.ga}
                  </td>
                  <td className={`py-3 text-center font-medium ${
                    row.gd > 0 ? 'text-green-600' : row.gd < 0 ? 'text-red-500' : 'text-slate-400'
                  }`}>
                    {row.gd > 0 ? '+' : ''}{row.gd}
                  </td>
                  <td className="py-3 text-center font-black text-slate-900">{row.pts}</td>
                  {hasDeductions && (
                    <td className="py-3 text-center">
                      {row.deduction !== 0 ? (
                        <span className="text-xs font-bold text-red-500">
                          {row.deduction > 0 ? '-' : '+'}{Math.abs(row.deduction)}
                        </span>
                      ) : (
                        <span className="text-slate-200">—</span>
                      )}
                    </td>
                  )}
                  {hasDeductions && (
                    <td className="py-3 text-center font-black text-yellow-600">{row.finalPts}</td>
                  )}
                  <td className="py-3 pr-5 hidden md:table-cell">
                    <FormDots form={row.form} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap items-center gap-4">
        {[
          { color: 'bg-green-500', label: 'Postup' },
          { color: 'bg-amber-400', label: 'Barážová' },
          { color: 'bg-red-500',   label: 'Zostup' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${color}`} />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
        {hasDeductions && (
          <span className="text-xs text-slate-400 ml-auto">* po odpočte bodov</span>
        )}
      </div>
    </div>
  )
}
