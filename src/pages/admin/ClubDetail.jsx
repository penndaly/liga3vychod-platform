import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { db } from '../../services/firebase'
import { CLUBS } from '../../data/placeholder'
import AdminLayout from '../../components/admin/AdminLayout'
import ClubProfileForm from '../../components/admin/clubs/ClubProfileForm'
import RosterTable from '../../components/admin/clubs/RosterTable'

const TAB_CLS = (active) =>
  `px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
    active
      ? 'border-yellow-400 text-slate-900'
      : 'border-transparent text-slate-400 hover:text-slate-700'
  }`

const TABS = [
  { id: 'profile', label: 'Profil' },
  { id: 'roster',  label: 'Zostava' },
  { id: 'admins',  label: 'Admini' },
]

export default function ClubDetail() {
  const { clubId } = useParams()
  const club = CLUBS.find((c) => c.id === Number(clubId))

  const [tab, setTab] = useState('profile')
  const [firestoreData, setFirestoreData] = useState(null)
  const [players, setPlayers] = useState([])
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)

  const loadClub = useCallback(async () => {
    if (!club) return
    try {
      const snap = await getDoc(doc(db, 'clubs', String(clubId)))
      setFirestoreData(snap.exists() ? snap.data() : null)
    } catch {
      toast.error('Chyba pri načítaní profilu')
    }
  }, [clubId, club])

  const loadPlayers = useCallback(async () => {
    if (!club) return
    try {
      const snap = await getDocs(collection(db, 'clubs', String(clubId), 'players'))
      setPlayers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch {
      toast.error('Chyba pri načítaní hráčov')
    }
  }, [clubId, club])

  const loadAdmins = useCallback(async () => {
    if (!club) return
    try {
      const q = query(collection(db, 'users'), where('clubs', 'array-contains', club.name))
      const snap = await getDocs(q)
      setAdmins(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch {
      // users collection may not exist yet — not an error
    }
  }, [club])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadClub(), loadPlayers(), loadAdmins()]).finally(() => setLoading(false))
  }, [loadClub, loadPlayers, loadAdmins])

  if (!club) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-sm text-slate-500">Klub nebol nájdený.</p>
          <Link to="/admin/clubs" className="text-sm text-green-600 font-bold mt-2 inline-block">← Späť na kluby</Link>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-5 max-w-4xl">
        {/* Back + header */}
        <div>
          <Link
            to="/admin/clubs"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors mb-3"
          >
            <ChevronLeft size={13} /> Späť na kluby
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
              {firestoreData?.logoUrl ? (
                <img src={firestoreData.logoUrl} alt={club.name} className="w-full h-full object-contain p-1.5" />
              ) : (
                <span className="text-sm font-black text-slate-400">{club.short}</span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">{firestoreData?.name ?? club.name}</h1>
              {firestoreData?.city && (
                <p className="text-sm text-slate-400">{firestoreData.city}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-100 flex gap-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={TAB_CLS(tab === t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-sm text-slate-400 py-8 text-center">Načítavam...</div>
        ) : (
          <>
            {tab === 'profile' && (
              <ClubProfileForm
                clubId={clubId}
                club={club}
                initialData={firestoreData}
                onSaved={loadClub}
              />
            )}

            {tab === 'roster' && (
              <RosterTable
                clubId={clubId}
                players={players}
                onChanged={loadPlayers}
              />
            )}

            {tab === 'admins' && (
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Admini klubu</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Používatelia s prístupom k tomuto klubu
                  </p>
                </div>
                {admins.length === 0 ? (
                  <div className="px-5 py-8 text-center text-slate-400 text-sm">
                    Žiadni admini — pridajte ich v sekcii{' '}
                    <Link to="/admin/users" className="text-green-600 font-bold hover:underline">Používatelia</Link>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs text-slate-400 font-bold uppercase tracking-widest">
                        <th className="text-left px-5 py-2.5">Meno / Email</th>
                        <th className="text-left px-3 py-2.5">Rola</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((u) => (
                        <tr key={u.id} className="border-b border-slate-50">
                          <td className="px-5 py-3">
                            <p className="font-bold text-slate-900">{u.displayName || '—'}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {u.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
