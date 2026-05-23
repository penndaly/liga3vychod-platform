import { useState } from 'react'
import { Download, Loader } from 'lucide-react'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { db } from '../../../services/firebase'

function downloadCsv(filename, rows, headers) {
  const escape = (v) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const lines = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function ExportCard({ title, description, filename, onExport }) {
  const [loading, setLoading] = useState(false)

  async function handle() {
    setLoading(true)
    try {
      await onExport()
      toast.success(`${filename} stiahnutý`)
    } catch {
      toast.error('Chyba pri exporte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-5 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        <p className="text-xs text-slate-300 mt-0.5 font-mono">{filename}</p>
      </div>
      <button onClick={handle} disabled={loading}
        className="flex items-center gap-2 border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors shrink-0 ml-4">
        {loading ? <Loader size={14} className="animate-spin" /> : <Download size={14} />}
        {loading ? 'Exportujem...' : 'Stiahnuť'}
      </button>
    </div>
  )
}

export default function ExportSection({ season }) {
  async function exportFixtures() {
    const snap = await getDocs(collection(db, 'fixtures'))
    const rows = snap.docs.map((d) => d.data())
    downloadCsv('fixtures.csv', rows, ['round', 'date', 'time', 'home', 'away', 'homeGoals', 'awayGoals', 'status'])
  }

  async function exportStandings() {
    const snap = await getDocs(query(collection(db, 'standings'), orderBy('pos', 'asc')))
    const standings = snap.docs.filter((d) => d.id !== '_meta').map((d) => d.data())
    downloadCsv('standings.csv', standings, ['pos', 'club', 'p', 'w', 'd', 'l', 'gf', 'ga', 'gd', 'deduction', 'finalPts'])
  }

  async function exportPlayers() {
    const snap = await getDocs(query(collection(db, 'player_stats'), where('season', '==', season)))
    const rows = snap.docs.map((d) => d.data())
    downloadCsv('players.csv', rows, ['name', 'club', 'season', 'goals', 'assists', 'yellowCards', 'redCards'])
  }

  async function exportReferees() {
    const snap = await getDocs(collection(db, 'referees'))
    const rows = snap.docs.map((d) => d.data())
    downloadCsv('referees.csv', rows, ['name', 'grade', 'region', 'phone', 'email', 'active'])
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-3">
        <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Exportovať dáta (CSV)</p>

        <ExportCard
          title="Zápasy"
          description="Všetky zápasy — kolo, dátumy, skóre, stav"
          filename="fixtures.csv"
          onExport={exportFixtures}
        />
        <ExportCard
          title="Tabuľka"
          description={`Vypočítaná tabuľka vrátane odpočtov — sezóna ${season}`}
          filename="standings.csv"
          onExport={exportStandings}
        />
        <ExportCard
          title="Hráčske štatistiky"
          description={`Góly, asistencie, karty — sezóna ${season}`}
          filename="players.csv"
          onExport={exportPlayers}
        />
        <ExportCard
          title="Rozhodcovia"
          description="Register rozhodcov — meno, licencia, kontakt"
          filename="referees.csv"
          onExport={exportReferees}
        />
      </div>

      <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
        <p className="text-xs text-slate-400 font-bold">
          Exporty sú generované priamo z Firestore v reálnom čase. Súbory sú kompatibilné s Excel / Numbers / Google Sheets.
        </p>
      </div>
    </div>
  )
}
