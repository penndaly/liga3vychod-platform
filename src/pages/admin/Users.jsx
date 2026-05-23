import { useState, useEffect, useMemo } from 'react'
import { Search, Pencil, Trash2, UserPlus, Info } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import AdminLayout from '../../components/admin/AdminLayout'
import RoleBadge from '../../components/admin/users/RoleBadge'
import ClubPill from '../../components/admin/users/ClubPill'
import UserModal from '../../components/admin/users/UserModal'
import PermissionMatrix from '../../components/admin/users/PermissionMatrix'
import { ROLES } from '../../data/roles'
import { CLUB_NAME_LIST } from '../../config/clubs-config'
import { fetchCollection, deleteDocument } from '../../services/api'
import { createFirebaseUser } from '../../services/adminAuth'
import { useAuth } from '../../hooks/useAuth'
import { db } from '../../services/firebase'

const TABS = [
  { key: 'users',  label: 'Všetci používatelia' },
  { key: 'roles',  label: 'Roly a oprávnenia' },
  { key: 'create', label: 'Vytvoriť používateľa' },
]

const LABEL = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5'
const INPUT  = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition-colors bg-white'

function initials(name) {
  return (name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

// ─── Tab 1: User list ────────────────────────────────────────────────────────

function UserRow({ user, onEdit, onDelete }) {
  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      <td className="py-3 pl-5">
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
          <span className="text-xs font-black text-slate-600">{initials(user.name)}</span>
        </div>
      </td>
      <td className="py-3 pr-3">
        <p className="text-sm font-medium text-slate-900">{user.name ?? '—'}</p>
      </td>
      <td className="py-3 pr-3 hidden md:table-cell">
        <p className="text-sm text-slate-500">{user.email}</p>
      </td>
      <td className="py-3 pr-3">
        <RoleBadge role={user.role} />
      </td>
      <td className="py-3 pr-3 hidden lg:table-cell">
        <div className="flex flex-wrap gap-1">
          {user.role === 'SUPERADMIN' ? (
            <span className="text-xs text-slate-400 italic">Všetky kluby</span>
          ) : user.clubs?.length ? (
            user.clubs.slice(0, 2).map((c) => <ClubPill key={c} club={c} />)
          ) : (
            <span className="text-xs text-slate-300">—</span>
          )}
          {user.clubs?.length > 2 && (
            <span className="text-xs text-slate-400">+{user.clubs.length - 2}</span>
          )}
        </div>
      </td>
      <td className="py-3 pr-5">
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
          <button
            onClick={() => onEdit(user)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded transition-colors"
            title="Upraviť"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(user)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded transition-colors"
            title="Odstrániť"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}

function UsersTab({ users, loading, onEdit, onDelete }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return q
      ? users.filter(
          (u) =>
            u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q)
        )
      : users
  }, [users, search])

  const counts = {
    total:      users.length,
    superadmin: users.filter((u) => u.role === 'SUPERADMIN').length,
    clubAdmin:  users.filter((u) => u.role === 'CLUB_ADMIN').length,
    editor:     users.filter((u) => u.role === 'EDITOR').length,
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Celkovo',     value: counts.total,      color: 'text-slate-900' },
          { label: 'Superadmin',  value: counts.superadmin, color: 'text-yellow-600' },
          { label: 'Club admin',  value: counts.clubAdmin,  color: 'text-blue-600' },
          { label: 'Editor',      value: counts.editor,     color: 'text-purple-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Hľadať podľa mena alebo emailu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-yellow-400 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        {loading ? (
          <p className="text-center py-16 text-sm text-slate-400">Načítavam používateľov...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-16 text-sm text-slate-400">
            {users.length === 0 ? 'Žiadni používatelia v databáze.' : 'Žiadne výsledky pre hľadaný výraz.'}
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                <th className="text-left py-3 pl-5 w-10"></th>
                <th className="text-left py-3 pr-3">Meno</th>
                <th className="text-left py-3 pr-3 hidden md:table-cell">Email</th>
                <th className="text-left py-3 pr-3">Rola</th>
                <th className="text-left py-3 pr-3 hidden lg:table-cell">Kluby</th>
                <th className="py-3 pr-5 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((u) => (
                <UserRow key={u.id} user={u} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Tab 2: Roles & permissions ───────────────────────────────────────────────

function RolesTab({ users }) {
  const countByRole = (role) => users.filter((u) => u.role === role).length

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Hierarchia rôl</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
              <th className="text-left py-3 pl-6">Rola</th>
              <th className="text-left py-3 hidden md:table-cell">Popis</th>
              <th className="text-center py-3 pr-6 w-28">Používatelia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {ROLES.map((role, i) => (
              <tr key={role.value} className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 pl-6">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-300 font-bold w-4">{i + 1}</span>
                    <RoleBadge role={role.value} />
                  </div>
                </td>
                <td className="py-3.5 text-sm text-slate-500 hidden md:table-cell">{role.desc}</td>
                <td className="py-3.5 pr-6 text-center">
                  <span className="text-sm font-black text-slate-900">{countByRole(role.value)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
            Matica oprávnení
          </h3>
          <RoleBadge role="CLUB_ADMIN" />
        </div>
        <PermissionMatrix role="CLUB_ADMIN" />
      </div>
    </div>
  )
}

// ─── Tab 3: Create user ───────────────────────────────────────────────────────

function CreateTab({ onCreated }) {
  const { user: currentUser } = useAuth()
  const CLUB_NAMES = CLUB_NAME_LIST

  const [form, setForm] = useState({
    name:  '',
    email: '',
    role:  'CLUB_ADMIN',
    clubs: [],
  })
  const [saving, setSaving] = useState(false)

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  function toggleClub(name) {
    setForm((f) => ({
      ...f,
      clubs: f.clubs.includes(name)
        ? f.clubs.filter((c) => c !== name)
        : [...f.clubs, name],
    }))
  }

  const needsClubs = form.role !== 'SUPERADMIN' && form.role !== 'VIEWER'

  async function handleSubmit(e) {
    e.preventDefault()
    if (needsClubs && form.clubs.length === 0) {
      toast.error('Priraďte aspoň jeden klub')
      return
    }
    setSaving(true)
    try {
      const uid = await createFirebaseUser(form.email)
      await setDoc(doc(db, 'users', uid), {
        name:      form.name,
        email:     form.email,
        role:      form.role,
        clubs:     form.role === 'SUPERADMIN' ? [] : form.clubs,
        createdAt: serverTimestamp(),
        createdBy: currentUser?.uid ?? null,
      })
      toast.success(`Používateľ ${form.email} vytvorený — pozvánka odoslaná`)
      setForm({ name: '', email: '', role: 'CLUB_ADMIN', clubs: [] })
      onCreated()
    } catch (err) {
      const msg = err?.code === 'auth/email-already-in-use'
        ? 'Tento email je už zaregistrovaný'
        : 'Chyba pri vytváraní používateľa'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="bg-white rounded-xl border border-slate-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={LABEL}>Celé meno</label>
            <input
              type="text" required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={INPUT}
              placeholder="Ján Novák"
            />
          </div>

          <div>
            <label className={LABEL}>Email</label>
            <input
              type="email" required
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className={INPUT}
              placeholder="jan@klub.sk"
            />
          </div>

          <div>
            <label className={LABEL}>Rola</label>
            <select
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              className={INPUT}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label} — {r.desc}
                </option>
              ))}
            </select>
          </div>

          {needsClubs && (
            <div>
              <label className={LABEL}>Priradené kluby</label>
              <div className="grid grid-cols-2 gap-1.5 border border-slate-200 rounded-lg p-3 max-h-52 overflow-y-auto">
                {CLUB_NAMES.map((name) => (
                  <label
                    key={name}
                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded p-1"
                  >
                    <input
                      type="checkbox"
                      checked={form.clubs.includes(name)}
                      onChange={() => toggleClub(name)}
                      className="accent-green-600"
                    />
                    <span className="text-xs text-slate-700 leading-tight">{name}</span>
                  </label>
                ))}
              </div>
              {needsClubs && form.clubs.length === 0 && (
                <p className="text-xs text-red-400 mt-1">Vyberte aspoň jeden klub</p>
              )}
            </div>
          )}

          {/* Info notice */}
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              Používateľovi bude odoslaný email s pozvánkou na nastavenie vlastného hesla.
            </p>
          </div>

          <button
            type="submit" disabled={saving}
            className="w-full py-3 bg-yellow-400 text-slate-950 text-sm font-black uppercase tracking-widest rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus size={16} />
            {saving ? 'Vytváram...' : 'Vytvoriť používateľa'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState(null)

  async function loadUsers() {
    setLoading(true)
    try {
      const data = await fetchCollection('users')
      setUsers(data.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')))
    } catch {
      toast.error('Chyba pri načítaní používateľov')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  async function handleDelete(user) {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Odstrániť používateľa ${user.email}?\nTento krok vymaže len Firestore záznam — Firebase Auth účet musí byť odstránený manuálne cez konzolu.`)) return
    try {
      await deleteDocument('users', user.id)
      toast.success('Používateľ odstránený')
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
    } catch {
      toast.error('Chyba pri odstraňovaní')
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-xl font-black text-slate-900">Používatelia & Oprávnenia</h1>
          <p className="text-sm text-slate-400 mt-0.5">{users.length} používateľov · 6 úrovní rôl</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 gap-0.5 w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${
                tab === t.key
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'users' && (
          <UsersTab
            users={users}
            loading={loading}
            onEdit={setEditUser}
            onDelete={handleDelete}
          />
        )}
        {tab === 'roles' && <RolesTab users={users} />}
        {tab === 'create' && (
          <CreateTab onCreated={() => { loadUsers(); setTab('users') }} />
        )}
      </div>

      {editUser && (
        <UserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => { setEditUser(null); loadUsers() }}
        />
      )}
    </AdminLayout>
  )
}
