export const CLUBS_2025_26 = [
  { id: 1,  name: 'FK Humenné',             short: 'HMN', slug: 'humenne',           color: '#1d4ed8' },
  { id: 2,  name: 'FK Spišská Nová Ves',    short: 'SNV', slug: 'spisska-nova-ves',  color: '#dc2626' },
  { id: 3,  name: 'MŠK Tesla Stropkov',     short: 'STR', slug: 'stropkov',          color: '#ea580c' },
  { id: 4,  name: 'OFK SIM Raslavice',      short: 'RAS', slug: 'raslavice',         color: '#16a34a' },
  { id: 5,  name: 'ŠK Odeva Lipany',        short: 'LIP', slug: 'lipany',            color: '#7c3aed' },
  { id: 6,  name: 'MFK Spartak Medzev',     short: 'MED', slug: 'medzev',            color: '#b91c1c' },
  { id: 7,  name: 'MFK Snina',              short: 'SNA', slug: 'snina',             color: '#0369a1' },
  { id: 8,  name: 'FC Košice B',            short: 'KSB', slug: 'kosice-b',          color: '#1e3a8a' },
  { id: 9,  name: '1. MFK Kežmarok',        short: 'KEŽ', slug: 'kezmarok',          color: '#d97706' },
  { id: 10, name: 'MFK Vranov nad Topľou',  short: 'VNT', slug: 'vranov',            color: '#15803d' },
  { id: 11, name: 'FK Poprad',              short: 'POP', slug: 'poprad',            color: '#be123c' },
  { id: 12, name: 'MFK Slovan Sabinov',     short: 'SAB', slug: 'sabinov',           color: '#2563eb' },
  { id: 13, name: 'FC Lokomotíva Košice',   short: 'LOK', slug: 'lokomotiva-kosice', color: '#9f1239' },
  { id: 14, name: 'MŠK Spišské Podhradie',  short: 'SPP', slug: 'spisske-podhradie', color: '#6366f1' },
]

/** Set of all valid club names — use for O(1) validation. */
export const VALID_CLUB_NAMES = new Set(CLUBS_2025_26.map((c) => c.name))

/** Ordered array of club names — use for dropdowns and option lists. */
export const CLUB_NAME_LIST = CLUBS_2025_26.map((c) => c.name)

/** Look up a club entry by its URL slug. Returns undefined if not found. */
export function getClubBySlug(slug) {
  return CLUBS_2025_26.find((c) => c.slug === slug)
}

/** Look up a club entry by its numeric id. Returns undefined if not found. */
export function getClubById(id) {
  return CLUBS_2025_26.find((c) => c.id === id)
}

/** Look up a club entry by its full name. Returns undefined if not found. */
export function getClubByName(name) {
  return CLUBS_2025_26.find((c) => c.name === name)
}
