import { AlertTriangle, ShieldAlert } from 'lucide-react'

export default function CardWatchPanel({ players, loading }) {
  const warning  = players.filter((p) => (p.yellowCards ?? 0) === 4)
    .sort((a, b) => (b.yellowCards ?? 0) - (a.yellowCards ?? 0))
  const danger   = players.filter((p) => (p.yellowCards ?? 0) >= 5)
    .sort((a, b) => (b.yellowCards ?? 0) - (a.yellowCards ?? 0))
  const clean    = warning.length === 0 && danger.length === 0

  const Row = ({ player, variant }) => (
    <tr className="border-b border-slate-50 last:border-0">
      <td className="px-5 py-3">
        <p className="text-sm font-bold text-slate-900">{player.name}</p>
        <p className="text-xs text-slate-400">{player.club}</p>
      </td>
      <td className="px-4 py-3 text-right">
        <span className={`inline-flex items-center gap-1 text-sm font-black px-2.5 py-1 rounded-lg ${
          variant === 'danger'
            ? 'bg-red-50 text-red-600'
            : 'bg-yellow-50 text-yellow-600'
        }`}>
          {player.yellowCards} ŽK
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
          variant === 'danger'
            ? 'bg-red-100 text-red-700'
            : 'bg-yellow-100 text-yellow-700'
        }`}>
          {variant === 'danger' ? 'Suspendovať' : '1 od zákazu'}
        </span>
      </td>
    </tr>
  )

  return (
    <div className="space-y-5">
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-100 p-8 text-center text-slate-300 text-sm animate-pulse">
          Načítavam...
        </div>
      ) : clean ? (
        <div className="bg-white rounded-xl border border-slate-100 flex flex-col items-center justify-center py-16 text-slate-300">
          <ShieldAlert size={36} className="mb-2" />
          <p className="text-sm font-bold">Žiadni hráči na sledovaní</p>
          <p className="text-xs mt-1">Pridajte štatistiky hráčov v sekcii Ocenenia &amp; Štatistiky</p>
        </div>
      ) : (
        <>
          {danger.length > 0 && (
            <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-red-50 border-b border-red-100">
                <ShieldAlert size={14} className="text-red-500" />
                <p className="text-xs font-black uppercase tracking-widest text-red-600">
                  Vyžadujú suspenziu — 5+ ŽK ({danger.length})
                </p>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {danger.map((p) => <Row key={p.id} player={p} variant="danger" />)}
                </tbody>
              </table>
            </div>
          )}

          {warning.length > 0 && (
            <div className="bg-white rounded-xl border border-yellow-200 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-yellow-50 border-b border-yellow-100">
                <AlertTriangle size={14} className="text-yellow-500" />
                <p className="text-xs font-black uppercase tracking-widest text-yellow-600">
                  Na hranici zákazu — 4 ŽK ({warning.length})
                </p>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {warning.map((p) => <Row key={p.id} player={p} variant="warning" />)}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-slate-400 text-center">
            Dáta z modulu Ocenenia &amp; Štatistiky · Podprahovú hodnotu určuje súťažný poriadok
          </p>
        </>
      )}
    </div>
  )
}
