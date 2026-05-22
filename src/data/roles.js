export const ROLES = [
  {
    value: 'SUPERADMIN',
    label: 'Superadmin',
    cls: 'bg-yellow-400 text-slate-950',
    desc: 'Plný prístup k lige a všetkým 14 klubom',
  },
  {
    value: 'CLUB_ADMIN',
    label: 'Club Admin',
    cls: 'bg-blue-600 text-white',
    desc: 'Plný prístup k priradeným klubom',
  },
  {
    value: 'EDITOR',
    label: 'Editor',
    cls: 'bg-purple-600 text-white',
    desc: 'Vytváranie a úprava obsahu, bez publikovania',
  },
  {
    value: 'CONTRIBUTOR',
    label: 'Contributor',
    cls: 'bg-indigo-500 text-white',
    desc: 'Len vytváranie konceptov',
  },
  {
    value: 'BROADCAST_OPERATOR',
    label: 'Broadcast',
    cls: 'bg-orange-500 text-white',
    desc: 'Ovládanie živého prenosu',
  },
  {
    value: 'VIEWER',
    label: 'Viewer',
    cls: 'bg-slate-400 text-white',
    desc: 'Len čítanie',
  },
]

export const ROLE_MAP = Object.fromEntries(ROLES.map((r) => [r.value, r]))
