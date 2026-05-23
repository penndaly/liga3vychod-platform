export const CLUBS_2025_26 = [
  { id: 1,  name: 'FK Humenné',             short: 'HMN', slug: 'humenne'           },
  { id: 2,  name: 'FK Spišská Nová Ves',    short: 'SNV', slug: 'spisska-nova-ves'  },
  { id: 3,  name: 'ŠK Odeva Lipany',        short: 'LIP', slug: 'lipany'            },
  { id: 4,  name: 'MŠK Tesla Stropkov',     short: 'STR', slug: 'stropkov'          },
  { id: 5,  name: 'FK Poprad',              short: 'POP', slug: 'poprad'            },
  { id: 6,  name: 'OFK SIM Raslavice',      short: 'RAS', slug: 'raslavice'         },
  { id: 7,  name: 'Spartak Medzev',         short: 'MED', slug: 'medzev'            },
  { id: 8,  name: '1. MFK Kežmarok',        short: 'KEŽ', slug: 'kezmarok'          },
  { id: 9,  name: 'FC Lokomotíva',          short: 'LOK', slug: 'lokomotiva'        },
  { id: 10, name: 'FC Košice B',            short: 'KSB', slug: 'kosice-b'          },
  { id: 11, name: 'MFK Snina',              short: 'SNA', slug: 'snina'             },
  { id: 12, name: 'MFK Vranov nad Topľou',  short: 'VNT', slug: 'vranov'            },
  { id: 13, name: 'MFK Slovan Sabinov',     short: 'SAB', slug: 'sabinov'           },
  { id: 14, name: 'MŠK Spišské Podhradie',  short: 'SPP', slug: 'spisske-podhradie' },
]

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
