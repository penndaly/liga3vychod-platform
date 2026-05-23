export const CLUBS_2025_26 = [
  { id: 1,  name: 'FK Bardejov',                        short: 'BDJ', slug: 'bardejov'          },
  { id: 2,  name: 'MFK Snina',                          short: 'SNA', slug: 'snina'             },
  { id: 3,  name: 'MFK Vranov nad Topľou',              short: 'VNT', slug: 'vranov'            },
  { id: 4,  name: 'FC Košice B',                        short: 'KSB', slug: 'kosice-b'          },
  { id: 5,  name: 'MŠK Spišské Podhradie',              short: 'SPP', slug: 'spisske-podhradie' },
  { id: 6,  name: 'FK Spišská Nová Ves',                short: 'SNV', slug: 'spisska-nova-ves'  },
  { id: 7,  name: 'MFK Slovan Sabinov',                 short: 'SAB', slug: 'sabinov'           },
  { id: 8,  name: 'FK Poprad',                          short: 'POP', slug: 'poprad'            },
  { id: 9,  name: 'OFK Baník Lehota pod Vtáčnikom',     short: 'LEH', slug: 'lehota'            },
  { id: 10, name: '1. MFK Kežmarok',                   short: 'KEŽ', slug: 'kezmarok'          },
  { id: 11, name: 'MFK Stará Ľubovňa',                 short: 'STĽ', slug: 'stara-lubovna'     },
  { id: 12, name: 'FK Slavoj Trebišov',                 short: 'TRB', slug: 'trebisov'          },
  { id: 13, name: 'MFK Tatran Liptovský Mikuláš',       short: 'LMK', slug: 'liptovsky-mikulas' },
  { id: 14, name: 'MŠK Rimavská Sobota',                short: 'RSB', slug: 'rimavska-sobota'   },
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
