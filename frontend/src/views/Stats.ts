// src/views/Stats.ts
import { getStatsByUserId, getMatches, getUsers, UserStats, Match, User } from '../api';
import { getCurrentUser } from '../session';
import { t } from '../i18n/i18n';

type RatioOptions = {
  size?: number;      // px del svg
  stroke?: number;    // grosor del anillo
  color?: string;     // color principal
  bg?: string;        // color de fondo del anillo
  label?: string;     // texto centrado
  sublabel?: string;  // texto pequeño debajo
};

function clamp01(n: number){ return Math.max(0, Math.min(1, n)); }
function fmtPct(n: number){ return `${Math.round(n*100)}%`; }

function donut(ratio: number, opts: RatioOptions = {}): string {
  const size   = opts.size ?? 140;
  const stroke = opts.stroke ?? 12;
  const color  = opts.color ?? '#22c55e'; // green-500
  const bg     = opts.bg ?? 'rgba(255,255,255,0.2)';
  const r = (size/2) - stroke/2;
  const c = 2*Math.PI*r;
  const dash = c * clamp01(ratio);
  const gap  = c - dash;

  const label = opts.label ?? fmtPct(ratio);
  const sub   = opts.sublabel ? `<text x="50%" y="62%" text-anchor="middle" font-size="11" fill="rgba(255,255,255,.75)">${opts.sublabel}</text>` : '';

  return `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${bg}" stroke-width="${stroke}" />
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none"
            stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
            stroke-dasharray="${dash} ${gap}" transform="rotate(-90 ${size/2} ${size/2})" />
    <text x="50%" y="52%" text-anchor="middle" font-size="18" font-weight="700" fill="#fff">${label}</text>
    ${sub}
  </svg>`;
}

function badgeWinLoss(meId: number, m: Match){
  const iWon = m.winner_id === meId;
  return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs ${iWon ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}">
    ${iWon ? t('stats.victory') : t('stats.defeat')}
  </span>`;
}
function whoIsOpponent(meId: number, m: Match){ return (m.player1_id === meId) ? m.player2_id : m.player1_id; }

export async function renderStats(root: HTMLElement){
  const me = getCurrentUser();
  if (!me) {
    root.innerHTML = `<section class="p-6"><p data-i18n="login.title">${t('login.title')}</p></section>`;
    return;
  }

  // tamaños "responsivos" para donuts: algo menores en móviles
  const isNarrow = root.clientWidth < 768; // ~md breakpoint
  const donutMain = isNarrow ? 130 : 160;
  const donutMinor = isNarrow ? 120 : 140;

  // layout nuevo: grid fluida
  root.innerHTML = `
    <section class="mx-auto max-w-6xl p-6 grow">
      <h1 class="text-2xl md:text-3xl font-bold mb-4" data-i18n="stats.my">${t('stats.my')}</h1>

      <!-- Grid responsiva:
           - móvil: 1 col
           - md: 2 cols
           - lg: 3 cols con la última (historial) más ancha -->
      <div class="grid gap-4
                  md:grid-cols-2
                  lg:grid-cols-[1.1fr_1.1fr_1.6fr]">
        <!-- PERFIL -->
        <article id="card-profile" class="rounded-2xl bg-white/10 p-4 min-h-[140px]"></article>

        <!-- RESUMEN + WINRATE -->
        <article id="card-summary" class="rounded-2xl bg-white/10 p-4 min-h-[140px]"></article>

        <!-- HISTORIAL: en lg ocupa la 3ª col y varias filas -->
        <article id="card-history"
                 class="rounded-2xl bg-white/10 p-4 overflow-hidden flex flex-col
                        md:col-span-2 lg:col-span-1
                        lg:row-span-3 min-h-[260px]"></article>

        <!-- ACCURACY -->
        <article id="card-accuracy" class="rounded-2xl bg-white/10 p-4 min-h-[180px]"></article>

        <!-- RACHAS -->
        <article id="card-streaks" class="rounded-2xl bg-white/10 p-4 min-h-[180px]"></article>
      </div>
    </section>
  `;

  const elProfile  = root.querySelector('#card-profile') as HTMLElement;
  const elSummary  = root.querySelector('#card-summary') as HTMLElement;
  const elHistory  = root.querySelector('#card-history') as HTMLElement;
  const elAccuracy = root.querySelector('#card-accuracy') as HTMLElement;
  const elStreaks  = root.querySelector('#card-streaks') as HTMLElement;

  // datos en paralelo
  const [stats, matches, users] = await Promise.all([
    getStatsByUserId(me.id),
    getMatches(),
    getUsers(),
  ]);

  // --- Perfil
  elProfile.innerHTML = `
    <div class="flex items-center gap-4">
      <img src="${me.avatar}" alt="${me.nick}" class="w-16 h-16 rounded-xl ring-1 ring-white/20 object-cover" />
      <div>
        <div class="text-lg font-semibold">${me.nick}</div>
        <div class="text-sm opacity-80">ID #${me.id}</div>
      </div>
    </div>
    <div class="mt-4 grid grid-cols-3 gap-3 text-center">
      <div class="rounded-lg bg-black/20 p-3">
        <div class="text-xl font-bold">${stats.games_played}</div>
        <div class="text-xs opacity-80" data-i18n="stats.matches">${t('stats.matches')}</div>
      </div>
      <div class="rounded-lg bg-black/20 p-3">
        <div class="text-xl font-bold text-emerald-300">${stats.wins}</div>
        <div class="text-xs opacity-80" data-i18n="stats.wins">${t('stats.wins')}</div>
      </div>
      <div class="rounded-lg bg-black/20 p-3">
        <div class="text-xl font-bold text-rose-300">${stats.losses}</div>
        <div class="text-xs opacity-80" data-i18n="stats.losses">${t('stats.losses')}</div>
      </div>
    </div>
  `;

  // --- Resumen + WinRate
  const total = Math.max(0, stats.wins + stats.losses);
  const winrate = total ? stats.wins / total : 0;
  elSummary.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-semibold" data-i18n="stats.summary">${t('stats.summary')}</h2>
      <span class="text-xs opacity-80" data-i18n="stats.date">${t('stats.date')}</span>
    </div>
    <div class="grid sm:grid-cols-2 gap-4 items-center">
      <div class="grid gap-2">
        <div class="rounded-lg bg-black/20 p-3">
          <div class="text-sm opacity-80" data-i18n="stats.played">${t('stats.played')}</div>
          <div class="text-2xl font-bold">${stats.games_played}</div>
        </div>
        <div class="rounded-lg bg-black/20 p-3">
          <div class="text-sm opacity-80" data-i18n="stats.goalsSplit">${t('stats.goalsSplit')}</div>
          <div class="text-2xl font-bold">${stats.goals_scored} <span class="opacity-60">/</span> ${stats.goals_received}</div>
        </div>
      </div>
      <div class="grid place-items-center">
        <div class="text-sm mb-2 opacity-80" data-i18n="stats.winRate">${t('stats.winRate')}</div>
        <div class="select-none" title="${fmtPct(winrate)}">
          ${donut(winrate, { size: donutMain, stroke: 12, color: '#22c55e', bg: 'rgba(255,255,255,.15)' })}
        </div>
      </div>
    </div>
  `;

  // --- Historial últimos 5
  const myMatches = matches
    .filter(m => m.player1_id === me.id || m.player2_id === me.id)
    .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const userById = new Map<number, User>();
  users.forEach(u => userById.set(u.id, u));

  elHistory.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <h2 class="font-semibold" data-i18n="stats.history.title">${t('stats.history.title')}</h2>
      <span class="text-xs opacity-80">${myMatches.length ? t('stats.history.last5') : t('stats.history.empty')}</span>
    </div>
    <!-- max-height con scroll para evitar solapamientos -->
    <div class="flex-1 overflow-auto -m-2 p-2 max-h-[50vh] lg:max-h-[60vh]">
      <ul class="space-y-2">
        ${myMatches.map(m => {
          const oppId = whoIsOpponent(me.id, m);
          const opp   = userById.get(oppId);
          const myScore = (m.player1_id === me.id) ? m.score_p1 : m.score_p2;
          const oppScore= (m.player1_id === me.id) ? m.score_p2 : m.score_p1;
          const dateStr = new Date(m.created_at).toLocaleString();
          return `
            <li class="rounded-lg bg-black/20 p-3 flex items-center justify-between">
              <div class="flex items-center gap-3 min-w-0">
                <div class="shrink-0">${badgeWinLoss(me.id, m)}</div>
                <div class="text-sm truncate">
                  <div class="font-medium truncate">${myScore} - ${oppScore}
                    <span class="opacity-70" data-i18n="common.vs">${t('common.vs')}</span>
                    <span class="opacity-90">${opp?.nick ?? ('#' + oppId)}</span>
                  </div>
                  <div class="text-xs opacity-70">${dateStr}</div>
                </div>
              </div>
              <div class="flex items-center gap-2 opacity-80 text-xs">
                <span class="whitespace-nowrap">${t('common.id')} ${m.id}</span>
                ${opp?.avatar ? `<img src="${opp.avatar}" class="w-6 h-6 rounded-full object-cover">` : ''}
              </div>
            </li>
          `;
        }).join('')}
      </ul>
    </div>
  `;

  // --- Accuracy
  const shotAttempts = Math.max(0, stats.goals_scored + stats.shots_on_target);
  const goalAcc = shotAttempts ? stats.goals_scored / shotAttempts : 0;
  const facedShots = Math.max(0, stats.saves + stats.goals_received);
  const saveAcc = facedShots ? stats.saves / facedShots : 0;

  elAccuracy.innerHTML = `
    <h2 class="font-semibold mb-4" data-i18n="stats.precision">${t('stats.precision')}</h2>
    <div class="grid grid-cols-2 gap-4 items-center">
      <div class="text-center">
        <div class="text-sm mb-2 opacity-80" data-i18n="stats.goalAcc">${t('stats.goalAcc')}</div>
        <div class="select-none" title="${fmtPct(goalAcc)}">
          ${donut(goalAcc, { size: donutMinor, color: '#60a5fa', bg: 'rgba(255,255,255,.15)', sublabel: `${stats.goals_scored}/${shotAttempts}` })}
        </div>
      </div>
      <div class="text-center">
        <div class="text-sm mb-2 opacity-80" data-i18n="stats.saveAcc">${t('stats.saveAcc')}</div>
        <div class="select-none" title="${fmtPct(saveAcc)}">
          ${donut(saveAcc, { size: donutMinor, color: '#f59e0b', bg: 'rgba(255,255,255,.15)', sublabel: `${stats.saves}/${facedShots}` })}
        </div>
      </div>
    </div>
    <p class="mt-3 text-xs opacity-70" data-i18n="stats.formulas">${t('stats.formulas')}</p>
  `;

  // --- Rachas
  elStreaks.innerHTML = `
    <h2 class="font-semibold mb-4" data-i18n="stats.streaks">${t('stats.streaks')}</h2>
    <div class="grid sm:grid-cols-2 gap-4">
      <div class="rounded-xl bg-black/20 p-4">
        <div class="text-sm opacity-80 mb-1" data-i18n="stats.currentStreak">${t('stats.currentStreak')}</div>
        <div class="text-3xl font-bold">${stats.win_streak}</div>
      </div>
      <div class="rounded-xl bg-black/20 p-4">
        <div class="text-sm opacity-80 mb-1" data-i18n="stats.bestStreak2">${t('stats.bestStreak2')}</div>
        <div class="text-3xl font-bold">${stats.best_streak}</div>
      </div>
    </div>
    <div class="mt-4 rounded-xl bg-black/10 p-4 text-sm opacity-85" data-i18n="stats.streaks.tip">${t('stats.streaks.tip')}</div>
  `;
}
