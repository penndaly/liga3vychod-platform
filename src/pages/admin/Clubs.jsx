import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { db } from '../../services/firebase'
import { CLUBS } from '../../data/placeholder'
import AdminLayout from '../../components/admin/AdminLayout'
import ClubCard from '../../components/admin/clubs/ClubCard'

export default function Clubs() {
  const [firestoreMap, setFirestoreMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, 'clubs'))
        const map = {}
        snap.docs.forEach((d) => { map[d.id] = d.data() })
        setFirestoreMap(map)
      } catch {
        toast.error('Chyba pri načítaní klubov')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const configured = Object.keys(firestoreMap).length
  const complete = Object.values(firestoreMap).filter((d) => d.logoUrl && d.ground).length

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900">Kluby</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {CLUBS.length} klubov · {complete} kompletných · {configured} nakonfigurovaných
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 h-36 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {CLUBS.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                firestoreData={firestoreMap[String(club.id)] ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
