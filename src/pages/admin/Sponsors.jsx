import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, Globe, RefreshCw, ExternalLink } from 'lucide-react'
import { collection, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { db } from '../../services/firebase'
import AdminLayout from '../../components/admin/AdminLayout'
import SponsorModal, { TIERS } from '../../components/admin/sponsors/SponsorModal'

const TIER_ORDER = { title: 0, gold: 1, silver: 2, partner: 3 }
const TIER_MAP   = Object.fromEntries(TIERS.map((t) => [t.value, t]))

function TierBadge({ value }) {
  const t = TIER_MAP[value]
  if (!t) return null
  return <span className={`text-xs font-bold px-2 py-0.5 rounded ${t.cls}`}>{t.label}</span>
}

function SectionChips({ sections = [] }) {
  const labels = { homepage: 'Domov', fixtures: 'Zápasy', standings: 'Tabuľka' }
  return (
    <div className="flex flex-wrap gap-1">
      {sections.map((s) => (
        <span key={s} className="text-xs bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded">
          {labels[s] ?? s}
        </span>
      ))}
    </div>
  )
}

export default function Sponsors() {
  const [sponsors, setSponsors] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)

  async function load() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'sponsors'))
      setSponsors(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch {
      toast.error('Chyba pri načítaní')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(sponsor) {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Odstrániť sponzora ${sponsor.name}?`)) return
    try {
      await deleteDoc(doc(db, 'sponsors', sponsor.id))
      setSponsors((p) => p.filter((s) => s.id !== sponsor.id))
      toast.success('Sponzor odstránený')
    } catch {
      toast.error('Chyba pri odstraňovaní')
    }
  }

  async function toggleActive(sponsor) {
    try {
      await updateDoc(doc(db, 'sponsors', sponsor.id), {
        active: !sponsor.active,
        updatedAt: serverTimestamp(),
      })
      setSponsors((p) => p.map((s) => s.id === sponsor.id ? { ...s, active: !s.active } : s))
    } catch {
      toast.error('Chyba')
    }
  }

  const grouped = useMemo(() => {
    const sorted = [...sponsors].sort((a, b) => {
      const td = (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9)
      return td !== 0 ? td : (a.order ?? 99) - (b.order ?? 99)
    })
    const map = {}
    sorted.forEach((s) => {
      const t = s.tier ?? 'partner'
      if (!map[t]) map[t] = []
      map[t].push(s)
    })
    return TIERS.filter((t) => map[t.value]).map((t) => ({ tier: t, items: map[t.value] }))
  }, [sponsors])

  const activeCount = sponsors.filter((s) => s.active).length

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900">Sponzori</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {sponsors.length} sponzorov · {activeCount} aktívnych
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={load} disabled={loading}
              className="flex items-center gap-2 border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-bold hover:bg-white transition-colors disabled:opacity-50">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setModal('new')}
              className="flex items-center gap-2 bg-yellow-400 text-slate-950 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-yellow-300 transition-colors">
              <Plus size={15} /> Pridať sponzora
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 animate-pulse">
                <div className="h-4 w-24 bg-slate-100 rounded mb-4" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[1, 2, 3].map((j) => <div key={j} className="h-28 bg-slate-50 rounded-xl" />)}
                </div>
              </div>
            ))}
          </div>
        ) : sponsors.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 flex flex-col items-center justify-center py-20 text-slate-300">
            <p className="text-sm font-bold">Žiadni sponzori</p>
            <button onClick={() => setModal('new')} className="mt-3 text-sm text-yellow-500 font-bold hover:text-yellow-600 transition-colors">
              Pridať prvého sponzora →
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(({ tier, items }) => (
              <div key={tier.value}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${tier.cls}`}>{tier.label}</span>
                  <span className="text-xs text-slate-400 font-bold">{items.length} sponzor{items.length !== 1 ? 'i' : ''}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map((sponsor) => (
                    <div key={sponsor.id}
                      className={`bg-white rounded-xl border p-5 transition-all group ${
                        sponsor.active ? 'border-slate-100 hover:border-slate-200 hover:shadow-sm' : 'border-slate-100 opacity-60'
                      }`}
                    >
                      {/* Logo */}
                      <div className="w-full h-20 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden mb-4 border border-slate-100">
                        {sponsor.logoUrl
                          ? <img src={sponsor.logoUrl} alt={sponsor.name} className="max-h-full max-w-full object-contain p-2" />
                          : <span className="text-xs font-black text-slate-300">{sponsor.name.slice(0, 4).toUpperCase()}</span>}
                      </div>

                      {/* Info */}
                      <p className="text-sm font-bold text-slate-900 truncate">{sponsor.name}</p>

                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <button
                          onClick={() => toggleActive(sponsor)}
                          title={sponsor.active ? 'Kliknúť pre deaktiváciu' : 'Kliknúť pre aktiváciu'}
                          className={`text-xs font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                            sponsor.active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {sponsor.active ? 'Aktívny' : 'Neaktívny'}
                        </button>
                        <span className="text-xs text-slate-300">#{sponsor.order}</span>
                      </div>

                      {(sponsor.sections?.length ?? 0) > 0 && (
                        <div className="mt-2">
                          <SectionChips sections={sponsor.sections} />
                        </div>
                      )}

                      {sponsor.website && (
                        <a href={sponsor.website} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-green-600 mt-2 transition-colors">
                          <Globe size={10} />
                          <span className="truncate">{sponsor.website.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink size={9} className="shrink-0" />
                        </a>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setModal(sponsor)}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 border border-slate-200 rounded-lg py-1.5 hover:bg-slate-50 transition-colors">
                          <Pencil size={11} /> Upraviť
                        </button>
                        <button onClick={() => handleDelete(sponsor)}
                          className="flex items-center justify-center border border-slate-200 rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <SponsorModal
          entry={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </AdminLayout>
  )
}
