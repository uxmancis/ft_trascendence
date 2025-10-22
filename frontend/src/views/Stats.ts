// src/views/Stats.ts
import { getStatsByUserId, getMatches, getUsers, Match, User } from '../api';
import { getCurrentUser } from '../session';
import { t } from '../i18n/i18n';

type RatioOptions = {
  size?: number;
  stroke?: number;
  color?: string;
  bg?: string;
  label?: string;
  sublabel?: string;
};

function clamp01(n: number){ return Math.max(0, Math.min(1, n)); }
function fmtPct(n: number){ return `${Math.round(n*100)}%`; }

function donut(ratio: number, opts: RatioOptions = {}): string {
  const size   = opts.size ?? 140;
  const stroke = opts.stroke ?? 12;
  const color  = opts.color ?? '#22c55e';
  const bg     = opts.bg ?? 'rgba(255,255,255,0.2)';
  const r = (size/2) - stroke/2;
  const c = 2*Math.PI*r;
  const dash = c * clamp01(ratio);
  const gap  = c - dash;

  const label = opts.label ?? fmtPct(ratio);
  const sub   = opts.sublabel ? `<text x="50%" y="62%" text-anchor="middle" font-size="11" fill="rgba(255,255,255,.75)">${opts.sublabel}</text>` : '';

  return `
  <svg
    width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"
    preserveAspectRatio="xMidYMid meet"
    style="max-width:100%;height:auto;display:block"
  >
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
    ${iWon ? t('stats.win') : t('stats.loss')}
  </span>`;
}

function whoIsOpponent(meId: number, m: Match){ return (m.player1_id === meId) ? m.player2_id : m.player1_id; }

/** Deriva KPIs visibles a partir de /matches para evitar condiciones de carrera con user_stats. */
function computeFromMatches(meId: number, all: Match[]){
  const mine = all
    .filter(m => m.player1_id===meId || m.player2_id===meId)
    .sort((a,b)=>+new Date(a.created_at) - +new Date(b.created_at));

  let wins=0, losses=0, gf=0, ga=0, cur=0, best=0;
  for (const m of mine){
    const iWon = m.winner_id === meId;
    if (iWon){ wins++; cur++; best = Math.max(best, cur); }
    else     { losses++; cur = 0; }

    if (m.player1_id===meId){ gf += m.score_p1; ga += m.score_p2; }
    else                    { gf += m.score_p2; ga += m.score_p1; }
  }
  return { games: mine.length, wins, losses, gf, ga, streak: cur, best };
}

export async function renderStats(root: HTMLElement){
  const me = getCurrentUser();
  if (!me) {
    root.innerHTML = `<section class="p-6"><p>${t('stats.loginFirst')}</p></section>`;
    return;
  }

  const isNarrow = root.clientWidth < 768;
  const donutMain = isNarrow ? 130 : 160;
  const donutMinor = isNarrow ? 120 : 140;

  root.innerHTML = `
    <section class="mx-auto max-w-6xl p-6 grow">
      <h1 class="text-2xl md:text-3xl font-bold mb-4">${t('stats.title')}</h1>

      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-[1.1fr_1.1fr_1.6fr]">
        <article id="card-profile"  class="rounded-2xl bg-white/10 p-4 min-h-[140px]"></article>
        <article id="card-summary"  class="rounded-2xl bg-white/10 p-4 min-h-[140px]"></article>
        <article id="card-history"  class="rounded-2xl bg-white/10 p-4 overflow-hidden flex flex-col md:col-span-2 lg:col-span-1 lg:row-span-3 min-h-[260px]"></article>
        <article id="card-accuracy" class="rounded-2xl bg-white/10 p-4 min-h-[180px]"></article>
        <article id="card-streaks"  class="rounded-2xl bg-white/10 p-4 min-h-[180px]"></article>
      </div>
    </section>
  `;

  const elProfile  = root.querySelector('#card-profile') as HTMLElement;
  const elSummary  = root.querySelector('#card-summary') as HTMLElement;
  const elHistory  = root.querySelector('#card-history') as HTMLElement;
  const elAccuracy = root.querySelector('#card-accuracy') as HTMLElement;
  const elStreaks  = root.querySelector('#card-streaks') as HTMLElement;

  // Cargamos datos
  const [stats, matches, users] = await Promise.all([
    getStatsByUserId(me.id),
    getMatches(),
    getUsers(),
  ]);

  // KPIs derivados (evita depender del timing de los triggers)
  const derived = computeFromMatches(me.id, matches);
  const gamesPlayed = derived.games;
  const wins        = derived.wins;
  const losses      = derived.losses;
  const goalsFor    = derived.gf;
  const goalsAgainst= derived.ga;
  const winrate     = (wins + losses) ? wins / (wins + losses) : 0;
  const winStreak   = derived.streak;
  const bestStreak  = derived.best;

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
        <div class="text-xl font-bold">${gamesPlayed}</div>
        <div class="text-xs opacity-80">${t('stats.played')}</div>
      </div>
      <div class="rounded-lg bg-black/20 p-3">
        <div class="text-xl font-bold text-emerald-300">${wins}</div>
        <div class="text-xs opacity-80">${t('stats.wins')}</div>
      </div>
      <div class="rounded-lg bg-black/20 p-3">
        <div class="text-xl font-bold text-rose-300">${losses}</div>
        <div class="text-xs opacity-80">${t('stats.losses')}</div>
      </div>
    </div>
  `;

  // --- Resumen + WinRate
  elSummary.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-semibold">${t('stats.summary')}</h2>
      <span class="text-xs opacity-80">${new Date().toLocaleDateString()}</span>
    </div>
    <div class="grid sm:grid-cols-2 gap-4 items-center">
      <div class="grid gap-2">
        <div class="rounded-lg bg-black/20 p-3">
          <div class="text-sm opacity-80">${t('stats.played')}</div>
          <div class="text-2xl font-bold">${gamesPlayed}</div>
        </div>
        <div class="rounded-lg bg-black/20 p-3">
          <div class="text-sm opacity-80">${t('stats.goalsPair')}</div>
          <div class="text-2xl font-bold">${goalsFor} <span class="opacity-60">/</span> ${goalsAgainst}</div>
        </div>
      </div>
      <div class="grid place-items-center">
        <div class="text-sm mb-2 opacity-80">${t('stats.winrate')}</div>
        <div class="select-none w-full max-w-[260px] md:max-w-[240px] lg:max-w-[260px] aspect-square overflow-hidden" title="${fmtPct(winrate)}">
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
      <h2 class="font-semibold">${t('stats.history')}</h2>
      <span class="text-xs opacity-80">${myMatches.length ? t('stats.historyLast5') : t('stats.historyEmpty')}</span>
    </div>
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
                    <span class="opacity-70">·</span>
                    <span class="opacity-90">${t('stats.vs', { nick: opp?.nick ?? ('#' + oppId) })}</span>
                  </div>
                  <div class="text-xs opacity-70">${dateStr}</div>
                </div>
              </div>
              <div class="flex items-center gap-2 opacity-80 text-xs">
                ${opp?.avatar ? `<img src="${opp.avatar}" class="w-6 h-6 rounded-full object-cover">` : ''}
              </div>
            </li>
          `;
        }).join('')}
      </ul>
    </div>
  `;

  // --- Accuracy (usa stats del backend si existen, pero no afectan al winrate mostrado)
  const shotAttempts = Math.max(0, stats.goals_scored + stats.shots_on_target);
  const goalAcc = shotAttempts ? stats.goals_scored / shotAttempts : 0;
  const facedShots = Math.max(0, stats.saves + stats.goals_received);
  const saveAcc = facedShots ? stats.saves / facedShots : 0;

  elAccuracy.innerHTML = `
    <h2 class="font-semibold mb-4">${t('stats.precision')}</h2>
    <div class="grid grid-cols-2 gap-4 items-center">
      <div class="text-center">
        <div class="text-sm mb-2 opacity-80">${t('stats.goalAcc')}</div>
        <div class="select-none w-full max-w-[220px] aspect-square overflow-hidden" title="${fmtPct(goalAcc)}">
          ${donut(goalAcc, { size: donutMinor, color: '#60a5fa', bg: 'rgba(255,255,255,.15)', sublabel: `${stats.goals_scored}/${shotAttempts}` })}
        </div>
      </div>
      <div class="text-center">
        <div class="text-sm mb-2 opacity-80">${t('stats.saveAcc')}</div>
        <div class="select-none w-full max-w-[220px] aspect-square overflow-hidden" title="${fmtPct(saveAcc)}">
          ${donut(saveAcc, { size: donutMinor, color: '#f59e0b', bg: 'rgba(255,255,255,.15)', sublabel: `${stats.saves}/${facedShots}` })}
        </div>
      </div>
    </div>
    <p class="mt-3 text-xs opacity-70">${t('stats.precisionHint')}</p>
  `;

  // --- Rachas (derivadas)
  elStreaks.innerHTML = `
    <h2 class="font-semibold mb-4">${t('stats.streaks')}</h2>
    <div class="grid sm:grid-cols-2 gap-4">
      <div class="rounded-xl bg-black/20 p-4">
        <div class="text-sm opacity-80 mb-1">${t('stats.streak')}</div>
        <div class="text-3xl font-bold">${winStreak}</div>
      </div>
      <div class="rounded-xl bg-black/20 p-4">
        <div class="text-sm opacity-80 mb-1">${t('stats.bestStreak')}</div>
        <div class="text-3xl font-bold">${bestStreak}</div>
      </div>
    </div>
    <div class="mt-4 rounded-xl bg-black/10 p-4 text-sm opacity-85">
      ${t('stats.streaksHint')}
    </div>
  `;
}
