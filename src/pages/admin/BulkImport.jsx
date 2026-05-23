import { useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Papa from 'papaparse'
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import {
  Download, Upload, CheckCircle, AlertCircle, AlertTriangle,
  FileText, ChevronRight, Calendar, ArrowLeft,
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { db } from '../../services/firebase'
import { validateFixtures } from '../../utils/fixtureValidation'

// ── CSV template ──────────────────────────────────────────────────────────────

const TEMPLATE_HEADERS = ['round', 'date', 'time', 'home_team', 'away_team', 'venue', 'competition']

const TEMPLATE_ROWS = [
  { round: 1, date: '2025-08-10', time: '16:30', home_team: 'FK Humenné',            away_team: 'MFK Vranov nad Topľou', venue: 'Humenné', competition: 'III. liga Východ' },
  { round: 1, date: '2025-08-10', time: '16:30', home_team: 'FK Poprad',              away_team: 'MFK Slovan Sabinov',    venue: 'Poprad',   competition: 'III. liga Východ' },
  { round: 2, date: '2025-08-17', time: '16:30', home_team: 'MFK Vranov nad Topľou',  away_team: 'FK Humenné',            venue: 'Vranov',   competition: 'III. liga Východ' },
]

function makeTemplateCsv() {
  const header = TEMPLATE_HEADERS.join(',')
  const rows   = TEMPLATE_ROWS.map((r) => TEMPLATE_HEADERS.map((h) => r[h] ?? '').join(','))
  return [header, ...rows].join('\n')
}

function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}

// ── Step indicators ───────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: 'Šablóna'  },
  { n: 2, label: 'Nahranie' },
  { n: 3, label: 'Validácia'},
  { n: 4, label: 'Hotovo'   },
]

function StepBar({ step }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
              step > s.n   ? 'bg-green-600 text-white'
              : step === s.n ? 'bg-yellow-400 text-slate-950'
              : 'bg-slate-100 text-slate-400'
            }`}>
              {step > s.n ? <CheckCircle size={14} /> : s.n}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${
              step === s.n ? 'text-slate-900' : 'text-slate-400'
            }`}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px w-12 sm:w-20 mx-1 mb-5 transition-colors ${
              step > s.n ? 'bg-green-600' : 'bg-slate-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Step 1: Template ──────────────────────────────────────────────────────────

function Step1({ onNext }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-slate-900 mb-1">Stiahnite si šablónu CSV</h2>
        <p className="text-sm text-slate-500">Vyplňte šablónu podľa popisu nižšie a potom pokračujte na nahranie.</p>
      </div>

      {/* Template preview */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <FileText size={13} className="text-slate-400" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Formát CSV</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {TEMPLATE_HEADERS.map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-black text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TEMPLATE_ROWS.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  {TEMPLATE_HEADERS.map((h) => (
                    <td key={h} className="px-4 py-2.5 text-slate-600 font-mono whitespace-nowrap">{row[h] ?? ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Column guide */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {[
          { col: 'round',       req: true,  desc: 'Číslo kola (1–46)' },
          { col: 'date',        req: true,  desc: 'Dátum vo formáte YYYY-MM-DD' },
          { col: 'time',        req: true,  desc: 'Čas vo formáte HH:MM (24h)' },
          { col: 'home_team',   req: true,  desc: 'Presný názov domáceho tímu' },
          { col: 'away_team',   req: true,  desc: 'Presný názov hostujúceho tímu' },
          { col: 'venue',       req: false, desc: 'Miesto konania (voliteľné)' },
          { col: 'competition', req: false, desc: 'Súťaž (voliteľné)' },
        ].map(({ col, req, desc }) => (
          <div key={col} className="flex items-start gap-3 border border-slate-200 rounded-xl px-4 py-3">
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded mt-0.5 shrink-0 ${
              req ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'
            }`}>
              {req ? 'PV' : 'NEP'}
            </span>
            <div>
              <p className="text-xs font-black text-slate-800 font-mono">{col}</p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <button
          onClick={() => downloadCsv('zapasy-sablona.csv', makeTemplateCsv())}
          className="flex items-center justify-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
        >
          <Download size={14} /> Stiahnuť šablónu (.csv)
        </button>
        <button
          onClick={onNext}
          className="flex items-center justify-center gap-2 bg-yellow-400 text-slate-950 text-sm font-black px-5 py-2.5 rounded-xl hover:bg-yellow-300 transition-colors"
        >
          Pokračovať <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Step 2: Upload ────────────────────────────────────────────────────────────

function Step2({ onBack, onParsed }) {
  const [dragging,   setDragging]   = useState(false)
  const [fileName,   setFileName]   = useState(null)
  const [parseError, setParseError] = useState(null)
  const inputRef = useRef()

  const processFile = useCallback((file) => {
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      setParseError('Prosím nahrávajte iba súbory s príponou .csv')
      return
    }
    setFileName(file.name)
    setParseError(null)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, errors }) => {
        if (errors.length && data.length === 0) {
          setParseError(`Chyba pri čítaní CSV: ${errors[0].message}`)
          return
        }
        if (data.length === 0) {
          setParseError('Súbor neobsahuje žiadne riadky')
          return
        }
        onParsed(data)
      },
      error: (err) => setParseError(err.message),
    })
  }, [onParsed])

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    processFile(e.dataTransfer.files[0])
  }, [processFile])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-slate-900 mb-1">Nahrajte CSV súbor</h2>
        <p className="text-sm text-slate-500">Presuňte súbor sem alebo kliknite pre výber.</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
          dragging
            ? 'border-yellow-400 bg-yellow-50'
            : 'border-slate-200 hover:border-slate-300 bg-slate-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => processFile(e.target.files[0])}
        />
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
          dragging ? 'bg-yellow-100' : 'bg-white border border-slate-200'
        }`}>
          <Upload size={22} className={dragging ? 'text-yellow-500' : 'text-slate-400'} />
        </div>
        {fileName ? (
          <div className="text-center">
            <p className="text-sm font-black text-slate-900">{fileName}</p>
            <p className="text-xs text-slate-400 mt-1">Analyzujem…</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-bold text-slate-700">Presuňte CSV súbor sem</p>
            <p className="text-xs text-slate-400 mt-1">alebo kliknite pre výber súboru</p>
          </div>
        )}
      </div>

      {parseError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700 font-bold">{parseError}</p>
        </div>
      )}

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={13} /> Späť
      </button>
    </div>
  )
}

// ── Step 3: Validate ──────────────────────────────────────────────────────────

function Step3({ rows, onBack, onImport, importing }) {
  const { valid, errors, warnings } = validateFixtures(rows)
  const canImport = errors.length === 0 && valid.length > 0

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-slate-900 mb-1">Validácia dát</h2>
        <p className="text-sm text-slate-500">{rows.length} riadkov analyzovaných z nahratého súboru.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Spolu',     value: rows.length,    color: 'text-slate-700'  },
          { label: 'Platné',    value: valid.length,   color: 'text-green-600'  },
          { label: 'Chyby',     value: errors.length,  color: errors.length   ? 'text-red-600'    : 'text-slate-400' },
          { label: 'Varovania', value: warnings.length, color: warnings.length ? 'text-yellow-600' : 'text-slate-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="border border-slate-200 rounded-xl p-4 text-center">
            <p className={`text-3xl font-black ${color}`}>{value}</p>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-red-200 flex items-center gap-2">
            <AlertCircle size={13} className="text-red-500" />
            <span className="text-xs font-black uppercase tracking-widest text-red-600">
              Chyby — import blokovaný ({errors.length})
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-red-100">
            {errors.map((e, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                <span className="text-[10px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                  R{e.line}
                </span>
                <p className="text-xs text-red-700">{e.msg}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-yellow-200 flex items-center gap-2">
            <AlertTriangle size={13} className="text-yellow-600" />
            <span className="text-xs font-black uppercase tracking-widest text-yellow-700">
              Varovania — môžete pokračovať ({warnings.length})
            </span>
          </div>
          <div className="divide-y divide-yellow-100">
            {warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                <AlertTriangle size={12} className="text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700">{w.msg}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview table */}
      {valid.length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">
              Náhľad — prvých {Math.min(valid.length, 5)} z {valid.length} platných
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-black uppercase tracking-wide">
                  <th className="text-left px-4 py-2.5 w-12">Kolo</th>
                  <th className="text-left px-3 py-2.5">Dátum</th>
                  <th className="text-left px-3 py-2.5">Čas</th>
                  <th className="text-right px-3 py-2.5">Domáci</th>
                  <th className="text-center px-3 py-2.5 w-8" />
                  <th className="text-left px-3 py-2.5">Hostia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {valid.slice(0, 5).map((f, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-bold text-slate-500">{f.round}</td>
                    <td className="px-3 py-2.5 text-slate-500 font-mono">{f.date}</td>
                    <td className="px-3 py-2.5 text-green-600 font-mono font-bold">{f.time}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-800">{f.home}</td>
                    <td className="px-3 py-2.5 text-center text-slate-300 text-[10px] font-black">vs</td>
                    <td className="px-3 py-2.5 font-bold text-slate-800">{f.away}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {valid.length > 5 && (
            <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-400 text-center">
              … a ďalších {valid.length - 5} zápasov
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap pt-1">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={13} /> Iný súbor
        </button>
        <button
          onClick={() => onImport(valid)}
          disabled={!canImport || importing}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-black px-6 py-2.5 rounded-xl transition-colors ml-auto"
        >
          {importing ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importujem…</>
          ) : (
            <><Upload size={14} /> Importovať {valid.length} zápasov</>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Step 4: Success ───────────────────────────────────────────────────────────

function Step4({ count }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center text-center py-12 gap-6">
      <div className="w-20 h-20 rounded-full bg-green-100 border border-green-200 flex items-center justify-center">
        <CheckCircle size={36} className="text-green-600" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-slate-900">Import dokončený</h2>
        <p className="text-slate-500 mt-2">
          Úspešne importovaných{' '}
          <span className="text-green-600 font-black">{count}</span>{' '}
          zápasov do Firestore.
        </p>
      </div>
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={() => navigate('/admin/fixtures')}
          className="flex items-center gap-2 bg-yellow-400 text-slate-950 text-sm font-black px-6 py-2.5 rounded-xl hover:bg-yellow-300 transition-colors"
        >
          <Calendar size={14} /> Zobraziť všetky zápasy
        </button>
        <Link
          to="/admin"
          className="flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-bold px-6 py-2.5 rounded-xl transition-colors"
        >
          Dashboard
        </Link>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BulkImport() {
  const [step,      setStep]      = useState(1)
  const [rows,      setRows]      = useState([])
  const [imported,  setImported]  = useState(0)
  const [importing, setImporting] = useState(false)

  async function handleImport(valid) {
    setImporting(true)
    try {
      const CHUNK = 499
      for (let i = 0; i < valid.length; i += CHUNK) {
        const batch = writeBatch(db)
        valid.slice(i, i + CHUNK).forEach((f) => {
          batch.set(doc(collection(db, 'fixtures')), {
            ...f,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        })
        await batch.commit()
      }
      setImported(valid.length)
      setStep(4)
      toast.success(`${valid.length} zápasov importovaných`)
    } catch {
      toast.error('Chyba pri importe — skontrolujte konzolu')
    } finally {
      setImporting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="p-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
          <Link to="/admin/fixtures" className="hover:text-slate-700 font-medium transition-colors">
            Zápasy
          </Link>
          <ChevronRight size={13} />
          <span className="font-bold text-slate-700">Hromadný import</span>
        </div>

        <div className="mb-6">
          <h1 className="text-xl font-black text-slate-900">Hromadný import zápasov</h1>
          <p className="text-sm text-slate-500 mt-0.5">Nahrajte celý program sezóny naraz pomocou CSV súboru</p>
        </div>

        <div className="max-w-3xl">
          <StepBar step={step} />

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            {step === 1 && (
              <Step1 onNext={() => setStep(2)} />
            )}
            {step === 2 && (
              <Step2
                onBack={() => setStep(1)}
                onParsed={(data) => { setRows(data); setStep(3) }}
              />
            )}
            {step === 3 && (
              <Step3
                rows={rows}
                onBack={() => { setRows([]); setStep(2) }}
                onImport={handleImport}
                importing={importing}
              />
            )}
            {step === 4 && (
              <Step4 count={imported} />
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
