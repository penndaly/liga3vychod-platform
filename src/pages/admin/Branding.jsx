import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Download, Upload, ExternalLink, Check, Loader } from 'lucide-react'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { db } from '../../services/firebase'
import { CLUBS } from '../../data/placeholder'
import AdminLayout from '../../components/admin/AdminLayout'

const PALETTE = [
  { name: 'Background',  cls: 'bg-slate-950',  hex: '#020617', text: 'text-slate-400',  label: 'bg-slate-950' },
  { name: 'Surface',     cls: 'bg-slate-900',  hex: '#0f172a', text: 'text-slate-400',  label: 'bg-slate-900' },
  { name: 'Card',        cls: 'bg-slate-800',  hex: '#1e293b', text: 'text-slate-400',  label: 'bg-slate-800' },
  { name: 'Active',      cls: 'bg-green-600',  hex: '#16a34a', text: 'text-white',       label: 'bg-green-600' },
  { name: 'Highlight',   cls: 'bg-yellow-400', hex: '#facc15', text: 'text-slate-950',  label: 'bg-yellow-400' },
]

async function downloadAsset(url, filename) {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error()
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(a.href)
  } catch {
    window.open(url, '_blank')
  }
}

function CopyChip({ value }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button onClick={handleCopy}
      className="font-mono text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition-colors flex items-center gap-1">
      {copied ? <><Check size={10} className="text-green-600" /> kopírované</> : value}
    </button>
  )
}

export default function Branding() {
  const [league,      setLeague]      = useState(null)
  const [clubsData,   setClubsData]   = useState({})
  const [loading,     setLoading]     = useState(true)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [leagueSnap, clubsSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'league')),
          getDocs(collection(db, 'clubs')),
        ])
        setLeague(leagueSnap.exists() ? leagueSnap.data() : null)
        const map = {}
        clubsSnap.docs.forEach((d) => { map[d.id] = d.data() })
        setClubsData(map)
      } catch {
        toast.error('Chyba pri načítaní')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleDownload(url, name, id) {
    setDownloading(id)
    await downloadAsset(url, `${name}.png`)
    setDownloading(null)
  }

  const logosUploaded = CLUBS.filter((c) => clubsData[String(c.id)]?.logoUrl).length

  return (
    <AdminLayout>
      <div className="p-6 space-y-8 max-w-5xl">
        <div>
          <h1 className="text-xl font-black text-slate-900">Branding</h1>
          <p className="text-sm text-slate-400 mt-0.5">Logo ligy a všetkých {CLUBS.length} klubov</p>
        </div>

        {/* ── League logo ── */}
        <section className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Logo ligy</h2>
          <div className="bg-white rounded-xl border border-slate-100 p-6 flex items-center gap-6">
            <div className="w-24 h-24 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
              {loading ? (
                <Loader size={18} className="text-slate-300 animate-spin" />
              ) : league?.logoUrl ? (
                <img src={league.logoUrl} alt="Liga logo" className="w-full h-full object-contain p-2" />
              ) : (
                <span className="text-xs font-black text-slate-300">LOGO</span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900">{league?.name ?? 'Liga'}</p>
              <p className="text-xs text-slate-400 mt-0.5">{league?.shortName ?? '—'}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Link to="/admin/settings"
                  className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">
                  <Upload size={12} /> Nahrať / zmeniť logo
                </Link>
                {league?.logoUrl && (
                  <button
                    onClick={() => handleDownload(league.logoUrl, 'liga-logo', 'league')}
                    disabled={downloading === 'league'}
                    className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    {downloading === 'league' ? <Loader size={12} className="animate-spin" /> : <Download size={12} />}
                    Stiahnuť
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Club logos ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Logá klubov</h2>
            <span className="text-xs font-bold text-slate-400">
              {logosUploaded} / {CLUBS.length} nahratých
            </span>
          </div>

          {/* Progress */}
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${(logosUploaded / CLUBS.length) * 100}%` }} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {CLUBS.map((club) => {
              const data    = clubsData[String(club.id)]
              const logoUrl = data?.logoUrl ?? null
              const isDown  = downloading === club.id

              return (
                <div key={club.id}
                  className="bg-white rounded-xl border border-slate-100 p-3 flex flex-col items-center gap-2 group hover:border-slate-200 transition-colors">
                  {/* Logo */}
                  <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
                    {loading ? (
                      <div className="w-full h-full bg-slate-100 animate-pulse rounded-lg" />
                    ) : logoUrl ? (
                      <img src={logoUrl} alt={club.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-xs font-black text-slate-300">{club.short}</span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-slate-600 text-center leading-tight line-clamp-2">{club.name}</p>

                  {/* Status + actions */}
                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    {logoUrl ? (
                      <span className="text-xs bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded">✓</span>
                    ) : (
                      <span className="text-xs bg-slate-100 text-slate-400 font-bold px-1.5 py-0.5 rounded">—</span>
                    )}
                  </div>

                  {/* Hover actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/admin/clubs/${club.id}/edit`}
                      className="p-1 text-slate-400 hover:text-slate-700 transition-colors" title="Upraviť profil">
                      <Upload size={11} />
                    </Link>
                    {logoUrl && (
                      <button
                        onClick={() => handleDownload(logoUrl, club.short.toLowerCase(), club.id)}
                        disabled={isDown}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-50 transition-colors"
                        title="Stiahnuť logo"
                      >
                        {isDown ? <Loader size={11} className="animate-spin" /> : <Download size={11} />}
                      </button>
                    )}
                    {logoUrl && (
                      <a href={logoUrl} target="_blank" rel="noopener noreferrer"
                        className="p-1 text-slate-400 hover:text-slate-700 transition-colors" title="Otvoriť">
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Colour palette ── */}
        <section className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Farebná paleta</h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {PALETTE.map((token) => (
              <div key={token.name} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className={`${token.cls} h-16 flex items-end p-2`}>
                  <span className={`text-xs font-black ${token.text}`}>{token.hex}</span>
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold text-slate-900">{token.name}</p>
                  <div className="mt-1.5">
                    <CopyChip value={token.label} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            Kliknite na class name pre skopírovanie. Tokeny sú definované v{' '}
            <code className="font-mono bg-slate-100 px-1 rounded">tailwind.config.js</code>.
          </p>
        </section>
      </div>
    </AdminLayout>
  )
}
