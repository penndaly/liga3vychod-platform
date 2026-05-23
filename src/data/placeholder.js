export const CLUBS = [
  { id: 1,  name: 'FK Bardejov',                      short: 'BDJ', slug: 'bardejov'        },
  { id: 2,  name: 'MFK Vranov nad Topľou',             short: 'VNT', slug: 'vranov'          },
  { id: 3,  name: 'TJ Slavoj Trebišov',                short: 'TRB', slug: 'trebisov'        },
  { id: 4,  name: 'FK Humenné',                        short: 'HMN', slug: 'humenne'         },
  { id: 5,  name: 'FK Gelnica',                        short: 'GEL', slug: 'gelnica'         },
  { id: 6,  name: 'TJ Partizán Bardejovská Nová Ves',  short: 'PBV', slug: 'partizan-bnv'   },
  { id: 7,  name: 'FC Košice B',                       short: 'KSB', slug: 'kosice-b'        },
  { id: 8,  name: 'FK Sabinov',                        short: 'SAB', slug: 'sabinov'         },
  { id: 9,  name: 'TJ Spišská Nová Ves',               short: 'SNV', slug: 'spisska-nova-ves'},
  { id: 10, name: 'TJ Sokol Stará Ľubovňa',            short: 'STĽ', slug: 'stara-lubovna'  },
  { id: 11, name: 'FK Rešov',                          short: 'REŠ', slug: 'resov'           },
  { id: 12, name: 'TJ Čeľovce',                        short: 'ČEĽ', slug: 'celovce'         },
  { id: 13, name: 'MFK Michalovce B',                  short: 'MCB', slug: 'michalovce-b'   },
  { id: 14, name: 'TJ Dynamo Prešov',                  short: 'DPR', slug: 'dynamo-presov'  },
]

// form: W=výhra, D=remíza, L=prehra (newest last)
export const STANDINGS = [
  { pos: 1, club: 'FK Bardejov',            p: 22, w: 15, d: 4, l: 3, gf: 48, ga: 21, gd: 27, pts: 49, form: ['W','W','D','W','W'] },
  { pos: 2, club: 'MFK Vranov nad Topľou',  p: 22, w: 14, d: 3, l: 5, gf: 41, ga: 25, gd: 16, pts: 45, form: ['W','L','W','W','D'] },
  { pos: 3, club: 'FC Košice B',            p: 22, w: 12, d: 6, l: 4, gf: 39, ga: 22, gd: 17, pts: 42, form: ['D','W','W','D','W'] },
  { pos: 4, club: 'FK Humenné',             p: 22, w: 11, d: 5, l: 6, gf: 35, ga: 28, gd:  7, pts: 38, form: ['L','W','D','W','W'] },
  { pos: 5, club: 'TJ Slavoj Trebišov',     p: 22, w: 10, d: 6, l: 6, gf: 32, ga: 30, gd:  2, pts: 36, form: ['D','D','W','L','W'] },
]

export const RECENT_MATCHES = [
  { round: 22, home: 'FK Bardejov',           homeGoals: 3, awayGoals: 1, away: 'FK Humenné',          date: '18.5.2025' },
  { round: 22, home: 'FC Košice B',           homeGoals: 2, awayGoals: 2, away: 'TJ Slavoj Trebišov',  date: '18.5.2025' },
  { round: 22, home: 'MFK Vranov nad Topľou', homeGoals: 4, awayGoals: 0, away: 'FK Sabinov',          date: '17.5.2025' },
]

export const UPCOMING_FIXTURES = [
  { round: 23, home: 'TJ Slavoj Trebišov',    away: 'FK Bardejov',           date: '25.5.2025', time: '16:30' },
  { round: 23, home: 'FK Humenné',            away: 'FC Košice B',           date: '25.5.2025', time: '16:30' },
  { round: 23, home: 'FK Gelnica',            away: 'MFK Vranov nad Topľou', date: '25.5.2025', time: '16:30' },
]

export const NEWS = [
  {
    id: 1,
    title: 'Bardejov potvrdil pozíciu lídra tabuľky',
    excerpt: 'FK Bardejov víťazstvom 3:1 nad Humenným potvrdil svoju pozíciu lídra TIPOS III. Ligy Východ.',
    date: '18.5.2025',
    club: 'FK Bardejov',
    category: 'Výsledky',
  },
  {
    id: 2,
    title: 'Program 23. kola: Víkendové derby',
    excerpt: 'Najbližšie kolo prinesie zaujímavé súboje. Kľúčovým zápasom bude stretnutie Trebišova s Bardejovom.',
    date: '20.5.2025',
    club: 'Liga',
    category: 'Program',
  },
  {
    id: 3,
    title: 'Vranov rozdrtil Sabinov 4:0',
    excerpt: 'MFK Vranov nad Topľou predviedol presvedčivý výkon a rozdrtil FK Sabinov 4:0, čím si upevnil druhé miesto.',
    date: '17.5.2025',
    club: 'MFK Vranov nad Topľou',
    category: 'Výsledky',
  },
]

export const TOP_SCORERS = [
  { rank: 1, name: 'Marek Kováč',    club: 'FK Bardejov',           goals: 18 },
  { rank: 2, name: 'Tomáš Novák',    club: 'MFK Vranov nad Topľou', goals: 14 },
  { rank: 3, name: 'Lukáš Horváth',  club: 'FC Košice B',           goals: 12 },
  { rank: 4, name: 'Juraj Baláž',    club: 'FK Humenné',            goals: 10 },
  { rank: 5, name: 'Peter Šimko',    club: 'TJ Slavoj Trebišov',    goals:  9 },
]
