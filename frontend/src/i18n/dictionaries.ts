export type Lang = 'es' | 'eu' | 'en';

export const LANGS: { id: Lang; label: string }[] = [
  { id: 'es', label: 'ES' },
  { id: 'eu', label: 'EU' },
  { id: 'en', label: 'EN' },
];

export const dict: Record<Lang, Record<string, string>> = {
  es: {
    // Navbar / rutas
    'nav.home': 'Inicio',
    'nav.ai': 'Partido vs IA',
    'nav.1v1': '1 vs 1',
    'nav.tournament': 'Torneo 4J',
    'nav.stats': 'Estadísticas',
    'nav.logout': 'Salir',

    // Login
    'login.title': 'Iniciar sesión',
    'login.nick': 'Nombre',
    'login.create': 'Crear usuario',
    'login.avatar': 'Avatar',
    'login.submit': 'Entrar',

    // Home
    'home.title': 'Elige un modo de juego',
    'home.ai': 'Partido vs IA',
    'home.1v1': '1 vs 1 Local',
    'home.tournament': 'Torneo 4 jugadores',

    // Stats
    'stats.title': 'Tus estadísticas',
    'stats.played': 'Partidos jugados',
    'stats.winrate': 'Ratio de victorias',
    'stats.goalsFor': 'Goles a favor',
    'stats.goalsAgainst': 'Goles en contra',
    'stats.streak': 'Racha actual',
    'stats.bestStreak': 'Mejor racha',
    'stats.history': 'Últimos partidos',
    'stats.vs': 'vs {nick}',

    // Paneles
    'panel.access': 'Accesibilidad:',
    'panel.theme': 'Tema:',
    'panel.music': 'Música:',
    'panel.lang': 'Idioma:',

    // Música
    'music.track1': '🎵 Pista 1',
    'music.track2': '🎵 Pista 2',
    'music.track3': '🎵 Pista 3',
    'music.silence': '🔇 Silencio',
    'music.hint': 'Pulsa para activar sonido',

    // Varios
    'common.loading': 'Cargando…',
    'common.notfound': 'No encontrado',
  },

  eu: {
    'nav.home': 'Hasiera',
    'nav.ai': 'Partida IA-ren aurka',
    'nav.1v1': '1 vs 1',
    'nav.tournament': 'Txapelketa 4J',
    'nav.stats': 'Estatistikak',
    'nav.logout': 'Irten',

    'login.title': 'Saioa hasi',
    'login.nick': 'Izena',
    'login.create': 'Erabiltzailea sortu',
    'login.avatar': 'Avatar-a',
    'login.submit': 'Sartu',

    'home.title': 'Aukeratu joko modua',
    'home.ai': 'Partida IA-ren aurka',
    'home.1v1': '1 vs 1 Lokala',
    'home.tournament': '4 jokalariko txapelketa',

    'stats.title': 'Zure estatistikak',
    'stats.played': 'Jokatutako partidak',
    'stats.winrate': 'Garaipen ratioa',
    'stats.goalsFor': 'Golak alde',
    'stats.goalsAgainst': 'Golak kontra',
    'stats.streak': 'Uneko racha',
    'stats.bestStreak': 'Racha onena',
    'stats.history': 'Azken partidak',
    'stats.vs': '{nick}-ren aurka',

    'panel.access': 'Irisgarritasuna:',
    'panel.theme': 'Gaia:',
    'panel.music': 'Musika:',
    'panel.lang': 'Hizkuntza:',

    'music.track1': '🎵 Pista 1',
    'music.track2': '🎵 Pista 2',
    'music.track3': '🎵 Pista 3',
    'music.silence': '🔇 Isilik',
    'music.hint': 'Sakatu soinua aktibatzeko',

    'common.loading': 'Kargatzen…',
    'common.notfound': 'Ez da aurkitu',
  },

  en: {
    'nav.home': 'Home',
    'nav.ai': 'Match vs AI',
    'nav.1v1': '1 vs 1',
    'nav.tournament': 'Tournament 4P',
    'nav.stats': 'Stats',
    'nav.logout': 'Logout',

    'login.title': 'Sign in',
    'login.nick': 'Name',
    'login.create': 'Create user',
    'login.avatar': 'Avatar',
    'login.submit': 'Enter',

    'home.title': 'Choose a game mode',
    'home.ai': 'Match vs AI',
    'home.1v1': 'Local 1 vs 1',
    'home.tournament': '4 players tournament',

    'stats.title': 'Your stats',
    'stats.played': 'Matches played',
    'stats.winrate': 'Win ratio',
    'stats.goalsFor': 'Goals for',
    'stats.goalsAgainst': 'Goals against',
    'stats.streak': 'Current streak',
    'stats.bestStreak': 'Best streak',
    'stats.history': 'Recent matches',
    'stats.vs': 'vs {nick}',

    'panel.access': 'Accessibility:',
    'panel.theme': 'Theme:',
    'panel.music': 'Music:',
    'panel.lang': 'Language:',

    'music.track1': '🎵 Track 1',
    'music.track2': '🎵 Track 2',
    'music.track3': '🎵 Track 3',
    'music.silence': '🔇 Silence',
    'music.hint': 'Tap to enable sound',

    'common.loading': 'Loading…',
    'common.notfound': 'Not found',
  },
};
