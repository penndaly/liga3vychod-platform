import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { Shield, Search, MapPin, Calendar } from 'lucide-react'
import { db } from '../../services/firebase'
import { CLUBS_2025_26 } from '../../config/clubs-config'
import Navbar from '../../components/public/Navbar'
import Footer from '../../components/public/Footer'

export default function ClubsPage() {
  const [firestoreMap, setFirestoreMap] = useState({})
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, 'clubs'))
        const map = {}
        snap.docs.forEach((d) => { map[d.id] = d.data() })
        setFirestoreMap(map)
      } catch {
        // silently fail — show static data only
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const clubs = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return CLUBS_2025_26
    return CLUBS_2025_26.filter(
      (c) => c.name.toLowerCase().includes(q) || c.short.toLowerCase().includes(q)
    )
  }, [search])

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      {/* Hero strip */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={13} className="text-yellow-400" />
            <span className="text-xs font-black uppercase tracking-widest text-yellow-400">Kluby</span>
          </div>
          <h1 className="text-3xl font-black text-white">Sezóna 2025/26</h1>
          <p className="text-sm text-slate-500 mt-1">{CLUBS_2025_26.length} klubov v súťaži</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Search */}
        <div className="relative max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hľadať klub..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-yellow-400 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition-colors"
          />
        </div>

        {/* Grid */}
        {clubs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-600">
            <Shield size={36} className="mb-3 opacity-30" />
            <p className="text-sm font-bold">Žiadny klub nezodpovedá hľadaniu</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {clubs.map((club) => {
              const fs = firestoreMap[String(club.id)]
              const logoUrl = fs?.logoUrl ?? null
              const city    = fs?.city    ?? null
              const founded = fs?.founded ?? null

              return (
                <Link
                  key={club.id}
                  to={`/kluby/${club.id}`}
                  className="group bg-slate-900 border border-slate-800 hover:border-yellow-400/40 rounded-2xl overflow-hidden transition-all"
                >
                  {/* Color accent bar */}
                  <div className="h-1" style={{ background: club.color }} />

                  <div className="p-5 flex flex-col gap-4">
                    {/* Logo + name row */}
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-slate-700/40"
                        style={{ background: logoUrl ? '#1e293b' : club.color + '22' }}
                      >
                        {loading ? (
                          <div className="w-full h-full bg-slate-800 animate-pulse rounded-xl" />
                        ) : logoUrl ? (
                          <img src={logoUrl} alt={club.name} className="w-full h-full object-contain p-1.5" />
                        ) : (
                          <span className="text-lg font-black" style={{ color: club.color }}>
                            {club.short}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="font-black text-white group-hover:text-yellow-400 transition-colors leading-tight">
                          {club.name}
                        </p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                          {club.short}
                        </p>
                      </div>
                    </div>

                    {/* Meta info */}
                    {(city || founded) && (
                      <div className="flex flex-wrap gap-3">
                        {city && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin size={10} className="text-slate-600" /> {city}
                          </span>
                        )}
                        {founded && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar size={10} className="text-slate-600" /> Zal. {founded}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
