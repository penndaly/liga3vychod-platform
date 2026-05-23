import { useState } from 'react'
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { db } from '../../../services/firebase'
import { CLUBS } from '../../../data/placeholder'

const CLUB_NAMES = new Set(CLUBS.map((c) => c.name))

const TEMPLATE = `kolo,domaci,hostia,datum,cas
1,FK Humenné,FC Košice B,10.8.2025,16:30
1,FK Poprad,MFK Vranov nad Topľou,10.8.2025,16:30
2,MFK Slovan Sabinov,FK Humenné,17.8.2025,16:30`

function parseCSV(text) {
  const lines = text.trim().split('\n').filter((l) => l.trim())
  const valid = []
  const errors = []

  lines.slice(1).forEach((line, i) => {
    const lineNum = i + 2
    const parts = line.split(',').map((p) => p.trim())
    if (parts.length < 5) {
      errors.push({ line: lineNum, msg: 'Nesprávny formát — očakáva sa 5 stĺpcov (kolo,domaci,hostia,datum,cas)' })
      return
    }
    const [kolo, domaci, hostia, datum, cas] = parts
    const round = Number(kolo)
    if (!Number.isInteger(round) || round < 1 || round > 46) {
      errors.push({ line: lineNum, msg: `Kolo "${kolo}" nie je platné (musí byť 1–46)` })
      return
    }
    if (!CLUB_NAMES.has(domaci)) {
      errors.push({ line: lineNum, msg: `Tím domácich "${domaci}" nebol nájdený v zozname klubov` })
      return
    }
    if (!CLUB_NAMES.has(hostia)) {
      errors.push({ line: lineNum, msg: `Tím hostí "${hostia}" nebol nájdený v zozname klubov` })
      return
    }
    if (domaci === hostia) {
      errors.push({ line: lineNum, msg: 'Domáci a hostia nemôžu byť rovnaký tím' })
      return
    }
    valid.push({ round, home: domaci, away: hostia, date: datum, time: cas, status: 'scheduled', homeGoals: null, awayGoals: null })
  })

  return { valid, errors }
}

export default function BulkImportModal({ onClose, onSaved }) {
  const [csv, setCsv] = useState('')
  const [parsed, setParsed] = useState(null)
  const [importing, setImporting] = useState(false)

  function handleParse() {
    if (!csv.trim()) return
    setParsed(parseCSV(csv))
  }

  async function handleImport() {
    if (!parsed?.valid.length) return
    setImporting(true)
    try {
      // Firestore batch limit is 500 — chunk if needed
      const CHUNK = 499
      for (let i = 0; i < parsed.valid.length; i += CHUNK) {
        const batch = writeBatch(db)
        parsed.valid.slice(i, i + CHUNK).forEach((f) => {
          batch.set(doc(collection(db, 'fixtures')), {
            ...f,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        })
        await batch.commit()
      }
      toast.success(`${parsed.valid.length} zápasov úspešne importovaných`)
      onSaved()
    } catch {
      toast.error('Chyba pri importe — skontrolujte konzolu')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
            Hromadný import zápasov
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Formát CSV</p>
            <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 overflow-x-auto font-mono leading-relaxed">
              {TEMPLATE}
            </pre>
            <p className="text-xs text-slate-400 mt-2">
              Názvy tímov musia zodpovedať presne názvom 14 klubov (napr. <code className="font-mono bg-slate-100 px-1 rounded">FK Humenné</code>).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
              Vložte CSV
            </label>
            <textarea
              value={csv}
              onChange={(e) => { setCsv(e.target.value); setParsed(null) }}
              rows={8}
              className="w-full border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-700 focus:outline-none focus:border-yellow-400 transition-colors resize-none"
              placeholder={TEMPLATE}
            />
          </div>

          {!parsed && (
            <button
              onClick={handleParse}
              disabled={!csv.trim()}
              className="w-full py-2.5 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              Analyzovať
            </button>
          )}

          {parsed && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm font-bold text-green-700">
                  <CheckCircle size={14} /> {parsed.valid.length} platných
                </div>
                {parsed.errors.length > 0 && (
                  <div className="flex items-center gap-1.5 text-sm font-bold text-red-600">
                    <AlertCircle size={14} /> {parsed.errors.length} chýb
                  </div>
                )}
                <button
                  onClick={() => setParsed(null)}
                  className="ml-auto text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Upraviť CSV
                </button>
              </div>

              {parsed.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1 max-h-32 overflow-y-auto">
                  {parsed.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-700">
                      <span className="font-bold">Riadok {e.line}:</span> {e.msg}
                    </p>
                  ))}
                </div>
              )}

              {parsed.valid.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Náhľad — prvých {Math.min(parsed.valid.length, 5)} z {parsed.valid.length}
                    </p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {parsed.valid.slice(0, 5).map((m, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-xs text-slate-600">
                        <span className="text-slate-400 w-10 shrink-0">K{m.round}</span>
                        <span className="flex-1 text-right font-medium">{m.home}</span>
                        <span className="text-slate-300 px-2">vs</span>
                        <span className="flex-1 font-medium">{m.away}</span>
                        <span className="text-slate-400 shrink-0">{m.date} {m.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors"
          >
            Zrušiť
          </button>
          {parsed?.valid.length > 0 && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex-1 py-2.5 bg-yellow-400 text-slate-950 text-sm font-black rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={14} />
              {importing ? 'Importujem...' : `Importovať ${parsed.valid.length} zápasov`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
