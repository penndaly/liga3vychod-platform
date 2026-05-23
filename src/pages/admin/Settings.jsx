import { useState, useEffect } from 'react'
import { Calendar, Shield, Scale, Download } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { db } from '../../services/firebase'
import AdminLayout from '../../components/admin/AdminLayout'
import SeasonSection from '../../components/admin/settings/SeasonSection'
import LeagueSection from '../../components/admin/settings/LeagueSection'
import RulesSection from '../../components/admin/settings/RulesSection'
import ExportSection from '../../components/admin/settings/ExportSection'

const NAV = [
  { id: 'season', label: 'Sezóna',    icon: Calendar, desc: 'Aktuálna sezóna, kolá a dátumy' },
  { id: 'league', label: 'Liga',      icon: Shield,   desc: 'Identita, logo a sociálne siete' },
  { id: 'rules',  label: 'Pravidlá',  icon: Scale,    desc: 'Bodovanie a zóny tabuľky' },
  { id: 'export', label: 'Export',    icon: Download, desc: 'Stiahnuť dáta vo formáte CSV' },
]

export default function Settings() {
  const [active, setActive] = useState('season')
  const [data, setData] = useState({ season: null, league: null, rules: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [seasonSnap, leagueSnap, rulesSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'season')),
          getDoc(doc(db, 'settings', 'league')),
          getDoc(doc(db, 'settings', 'rules')),
        ])
        setData({
          season: seasonSnap.exists() ? seasonSnap.data() : null,
          league: leagueSnap.exists() ? leagueSnap.data() : null,
          rules:  rulesSnap.exists()  ? rulesSnap.data()  : null,
        })
      } catch {
        toast.error('Chyba pri načítaní nastavení')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const currentSeason = data.season?.currentSeason ?? '2025/26'

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-black text-slate-900">Nastavenia</h1>
          <p className="text-sm text-slate-400 mt-0.5">Konfigurácia sezóny a systému</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Vertical nav */}
          <nav className="lg:w-56 shrink-0">
            {/* Mobile: horizontal scroll */}
            <div className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
              {NAV.map(({ id, label, icon: Icon, desc }) => (
                <button
                  key={id}
                  onClick={() => setActive(id)}
                  className={`flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all whitespace-nowrap lg:whitespace-normal shrink-0 lg:shrink ${
                    active === id
                      ? 'bg-white border border-slate-200 shadow-sm'
                      : 'hover:bg-white/70 border border-transparent'
                  }`}
                >
                  <Icon size={16} className={`mt-0.5 shrink-0 ${active === id ? 'text-green-600' : 'text-slate-400'}`} />
                  <div className="hidden lg:block">
                    <p className={`text-sm font-bold ${active === id ? 'text-slate-900' : 'text-slate-600'}`}>{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-snug">{desc}</p>
                  </div>
                  <span className="lg:hidden text-sm font-bold text-slate-700">{label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-300 text-sm animate-pulse">
                Načítavam nastavenia...
              </div>
            ) : (
              <>
                {active === 'season' && <SeasonSection initialData={data.season} />}
                {active === 'league' && <LeagueSection initialData={data.league} />}
                {active === 'rules'  && <RulesSection  initialData={data.rules} />}
                {active === 'export' && <ExportSection season={currentSeason} />}
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
