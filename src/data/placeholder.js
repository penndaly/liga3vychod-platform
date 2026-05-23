export const CLUBS = [
  { id: 1,  name: 'FK Humenné',              short: 'HMN', slug: 'humenne'           },
  { id: 2,  name: 'FK Spišská Nová Ves',     short: 'SNV', slug: 'spisska-nova-ves'  },
  { id: 3,  name: 'ŠK Odeva Lipany',         short: 'LIP', slug: 'lipany'            },
  { id: 4,  name: 'MŠK Tesla Stropkov',      short: 'STR', slug: 'stropkov'          },
  { id: 5,  name: 'FK Poprad',               short: 'POP', slug: 'poprad'            },
  { id: 6,  name: 'OFK SIM Raslavice',       short: 'RAS', slug: 'raslavice'         },
  { id: 7,  name: 'Spartak Medzev',          short: 'MED', slug: 'medzev'            },
  { id: 8,  name: '1. MFK Kežmarok',         short: 'KEŽ', slug: 'kezmarok'          },
  { id: 9,  name: 'FC Lokomotíva',           short: 'LOK', slug: 'lokomotiva'        },
  { id: 10, name: 'FC Košice B',             short: 'KSB', slug: 'kosice-b'          },
  { id: 11, name: 'MFK Snina',               short: 'SNA', slug: 'snina'             },
  { id: 12, name: 'MFK Vranov nad Topľou',   short: 'VNT', slug: 'vranov'            },
  { id: 13, name: 'MFK Slovan Sabinov',      short: 'SAB', slug: 'sabinov'           },
  { id: 14, name: 'MŠK Spišské Podhradie',   short: 'SPP', slug: 'spisske-podhradie' },
]

// form: W=výhra, D=remíza, L=prehra (newest last)
export const STANDINGS = [
  { pos: 1, club: 'FC Košice B',           p: 24, w: 17, d: 3, l: 4, gf: 51, ga: 22, gd: 29, pts: 54, form: ['W','W','D','W','W'] },
  { pos: 2, club: 'FK Humenné',            p: 24, w: 15, d: 4, l: 5, gf: 44, ga: 25, gd: 19, pts: 49, form: ['W','L','W','W','D'] },
  { pos: 3, club: 'MFK Vranov nad Topľou', p: 24, w: 14, d: 5, l: 5, gf: 41, ga: 27, gd: 14, pts: 47, form: ['D','W','W','D','W'] },
  { pos: 4, club: 'FK Poprad',             p: 24, w: 12, d: 4, l: 8, gf: 37, ga: 30, gd:  7, pts: 40, form: ['L','W','D','W','W'] },
  { pos: 5, club: 'ŠK Odeva Lipany',       p: 24, w: 11, d: 5, l: 8, gf: 32, ga: 31, gd:  1, pts: 38, form: ['D','D','W','L','W'] },
]

export const RECENT_MATCHES = [
  { round: 24, home: 'FC Košice B',           homeGoals: 3, awayGoals: 1, away: 'FK Humenné',            date: '17.05.2026' },
  { round: 24, home: 'MFK Vranov nad Topľou', homeGoals: 2, awayGoals: 0, away: 'FK Poprad',             date: '17.05.2026' },
  { round: 24, home: 'ŠK Odeva Lipany',       homeGoals: 1, awayGoals: 1, away: 'Spartak Medzev',        date: '17.05.2026' },
]

export const UPCOMING_FIXTURES = [
  { round: 25, home: 'FK Humenné',            away: 'MFK Vranov nad Topľou', date: '24.05.2026', time: '16:30' },
  { round: 25, home: 'FC Košice B',           away: 'FK Poprad',             date: '24.05.2026', time: '16:30' },
  { round: 25, home: 'ŠK Odeva Lipany',       away: 'MŠK Tesla Stropkov',    date: '24.05.2026', time: '16:30' },
]

export const NEWS = [
  {
    id: 1,
    title: 'Košice B na čele tabuľky po 24. kole',
    excerpt: 'FC Košice B potvrdili vedenie v tabuľke víťazstvom 3:1 nad FK Humenné v 24. kole TIPOS III. Ligy Východ.',
    date: '17.05.2026',
    club: 'FC Košice B',
    category: 'Výsledky',
  },
  {
    id: 2,
    title: 'Program 25. kola: Kľúčové súboje víkendu',
    excerpt: 'Najbližšie kolo prinesie zaujímavé stretnutia. Kľúčovým zápasom bude duel Humenné vs Vranov.',
    date: '20.05.2026',
    club: 'Liga',
    category: 'Program',
  },
  {
    id: 3,
    title: 'Vranov rozdrtil Poprad 2:0',
    excerpt: 'MFK Vranov nad Topľou predviedol presvedčivý výkon a porazil FK Poprad 2:0, čím si upevnil tretie miesto.',
    date: '17.05.2026',
    club: 'MFK Vranov nad Topľou',
    category: 'Výsledky',
  },
]

export const TOP_SCORERS = [
  { rank: 1, name: 'Marek Kováč',    club: 'FC Košice B',           goals: 19 },
  { rank: 2, name: 'Tomáš Novák',    club: 'FK Humenné',            goals: 15 },
  { rank: 3, name: 'Lukáš Horváth',  club: 'MFK Vranov nad Topľou', goals: 13 },
  { rank: 4, name: 'Juraj Baláž',    club: 'FK Poprad',             goals: 11 },
  { rank: 5, name: 'Peter Šimko',    club: 'ŠK Odeva Lipany',       goals:  9 },
]
