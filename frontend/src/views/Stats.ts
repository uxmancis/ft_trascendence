// src/views/Stats.ts

/* ************************************************************************** */
/*                                IMPORTS                                     */
/* ************************************************************************** */

import { getStatsByUserId, getMatches, getUsers, Match, User } from '../api';
import { getCurrentUser } from '../session';
import { t, bindI18n, onLangChange } from '../i18n/i18n';
import { logTerminal } from '../components/IDEComponets/Terminal';

/* ************************************************************************** */
/*                                TYPES                                       */
/* ************************************************************************** */

type RatioOptions = 
{
  size?: number;
  stroke?: number;
  color?: string;
  bg?: string;
  label?: string;
  sublabel?: string;
};

/* ************************************************************************** */
/*                          SMALL UTILS (C-ish)                                */
/* ************************************************************************** */

/* Clamp a number between 0 and 1 */
function clamp01(n: number): number
{
  if (n < 0) 
    return 0;
  if (n > 1) 
    return 1;
  return n;
}

/* Format ratio as percentage string */
function fmtPct(n: number): string
{
  return `${Math.round(n * 100)}%`;
}

/* ************************************************************************** */
/*                         SVG DONUT GENERATOR                                 */
/* ************************************************************************** */
/*
** Generates a donut SVG representing a ratio (0..1)
** Used for winrate, accuracy, save precision, etc.
*/
function donut(ratio: number, opts: RatioOptions = {}): string
{
  const size   = opts.size   ?? 140;
  const stroke = opts.stroke ?? 12;
  const color  = opts.color  ?? '#22c55e';
  const bg     = opts.bg     ?? 'rgba(255,255,255,0.2)';

  const r = (size / 2) - stroke / 2;
  const c = 2 * Math.PI * r;

  const dash = c * clamp01(ratio);
  const gap  = c - dash;

  const label = opts.label ?? fmtPct(ratio);

  const sub = opts.sublabel
    ? `<text x="50%" y="62%" text-anchor="middle"
        font-size="11" fill="rgba(255,255,255,.75)">
        ${opts.sublabel}
       </text>`
    : '';

  return `
    <svg width="${size}" height="${size}"
         viewBox="0 0 ${size} ${size}"
         style="max-width:100%;height:auto;display:block">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}"
              fill="none" stroke="${bg}" stroke-width="${stroke}" />
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}"
              fill="none" stroke="${color}"
              stroke-width="${stroke}"
              stroke-linecap="round"
              stroke-dasharray="${dash} ${gap}"
              transform="rotate(-90 ${size / 2} ${size / 2})" />
      <text x="50%" y="52%" text-anchor="middle"
            font-size="18" font-weight="700" fill="#fff">
        ${label}
      </text>
      ${sub}
    </svg>
  `;
}

/* ************************************************************************** */
/*                         MATCH / USER HELPERS                                */
/* ************************************************************************** */

/* Return WIN or LOSS badge for a match */
function badgeWinLoss(meId: number, m: Match): string
{
  const win = m.winner_id === meId;

  return `
    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs
      ${win
        ? 'bg-emerald-500/20 text-emerald-300'
        : 'bg-rose-500/20 text-rose-300'}">
      ${win ? t('stats.win') : t('stats.loss')}
    </span>
  `;
}

/* Get opponent user id from a match */
function whoIsOpponent(meId: number, m: Match): number
{
  return (m.player1_id === meId)
    ? m.player2_id
    : m.player1_id;
}

/* ************************************************************************** */
/*                         STATS DERIVATION                                    */
/* ************************************************************************** */
/*
** Derive KPIs only from matches.
** Avoids race conditions with backend stats triggers.
*/
function computeFromMatches(meId: number, matches: Match[])
{
  const mine = matches.filter(m => m.player1_id === meId || m.player2_id === meId).sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));

  let wins = 0;
  let losses = 0;
  let gf = 0;
  let ga = 0;
  let streak = 0;
  let best = 0;

  for (const m of mine)
  {
    const win = m.winner_id === meId;

    if (win)
    {
      wins++;
      streak++;
      if (streak > best) 
        best = streak;
    }
    else
    {
      losses++;
      streak = 0;
    }

    if (m.player1_id === meId)
    {
      gf += m.score_p1;
      ga += m.score_p2;
    }
    else
    {
      gf += m.score_p2;
      ga += m.score_p1;
    }
  }

  return {games: mine.length, wins, losses, gf, ga, streak, best};
}

/* ************************************************************************** */
/*                              MAIN VIEW                                     */
/* ************************************************************************** */
/*
** Flow:
** 1. Check logged user
** 2. Render layout skeleton
** 3. Fetch stats, matches, users
** 4. Compute KPIs
** 5. Fill each card independently
*/

/* Actualiza solo textos traducibles sin re-renderizar datos */
function updateStatsI18n(root: HTMLElement)
{
  // Actualizar títulos y etiquetas estáticas
  const titleEl = root.querySelector('h1');
  if (titleEl) titleEl.textContent = t('stats.title') || 'Stats';
  
  // Actualizar todos los elementos con data-i18n
  root.querySelectorAll('[data-i18n]').forEach((el: Element) => {
    const key = el.getAttribute('data-i18n')!;
    (el as HTMLElement).textContent = t(key);
  });
}

export async function renderStats(root: HTMLElement)
{
  const me = getCurrentUser();
  logTerminal(`${t('log.statsViewing')}${me ? ` ${me.nick}` : ''}`);
  if (!me)
  {
    root.innerHTML = `
      <section class="p-6">
        <p>${t('stats.loginFirst')}</p>
      </section>
    `;
    return;
  }

  /* Responsive donut sizes - COMPACT */
  const narrow = root.clientWidth < 768;
  const donutMain  = narrow ? 80 : 100;
  const donutMinor = narrow ? 70 : 90;

  /* Base layout - Compact viewport (like canvas) */
  root.innerHTML = `
    <section class="w-full h-full flex items-center justify-center p-2 md:p-3 overflow-hidden">
      <div class="w-full h-full max-w-6xl">
        <div class="mb-2 md:mb-3 flex items-center justify-between">
          <h1 class="text-lg md:text-2xl font-bold bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent truncate">
            ${t('stats.title') || 'Stats'}
          </h1>
          <div class="text-xs opacity-40 hidden md:block">${new Date().toLocaleTimeString()}</div>
        </div>

        <div class="grid gap-2 md:gap-3 grid-cols-1 md:grid-cols-3 h-[calc(100%-2rem)] md:h-[calc(100%-2.5rem)]">
          <article id="card-profile"  class="card bg-linear-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/20 h-full overflow-hidden"></article>
          <article id="card-summary"  class="card bg-linear-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/20 h-full overflow-hidden"></article>
          <article id="card-history"  class="card bg-linear-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/20 h-full overflow-y-auto md:row-span-2"></article>
          <article id="card-accuracy" class="card bg-linear-to-br from-yellow-500/5 to-orange-500/5 border border-yellow-500/20 h-full overflow-hidden"></article>
          <article id="card-streaks"  class="card bg-linear-to-br from-red-500/5 to-pink-500/5 border border-red-500/20 h-full overflow-hidden"></article>
        </div>
      </div>
    </section>
  `;

  const elProfile  = root.querySelector('#card-profile')!;
  const elSummary  = root.querySelector('#card-summary')!;
  const elHistory  = root.querySelector('#card-history')!;
  const elAccuracy = root.querySelector('#card-accuracy')!;
  const elStreaks  = root.querySelector('#card-streaks')!;

  /* Fetch data */
  const [stats, matches, users] = await Promise.all([ getStatsByUserId(me.id), getMatches(), getUsers(),]);

  /* Derived KPIs */
  const d = computeFromMatches(me.id, matches);

  const winrate = (d.wins + d.losses)
    ? d.wins / (d.wins + d.losses)
    : 0;

  /* ================= PROFILE ================= */

  elProfile.innerHTML = `
    <div class="flex flex-col items-center text-center justify-center h-full">
      <div class="relative mb-2">
        <img src="${me.avatar}" class="w-12 h-12 rounded-lg object-cover border border-blue-500/50" />
        <div class="absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full p-0.5 text-xs">✓</div>
      </div>
      <div class="text-sm font-bold truncate max-w-[90%]">${me.nick}</div>
      <div class="text-xs opacity-60 font-mono">ID #${me.id}</div>
    </div>
  `;

  /* ================= SUMMARY ================= */

  const gf = d.gf;
  const ga = d.ga;
  const gd = gf - ga;
  const avgPerGame = d.games > 0 ? (gf / d.games).toFixed(1) : '0';

  elSummary.innerHTML = `
    <h2 class="font-semibold text-sm mb-2" data-i18n="stats.summary">${t('stats.summary')}</h2>
    <div class="flex flex-col gap-2 h-[calc(100%-1.5rem)]">
      <!-- Winrate Donut -->
      <div class="flex-1 flex items-center justify-center min-h-0">
        ${donut(winrate, { size: donutMain, color: '#10b981', label: fmtPct(winrate) })}
      </div>
      
      <!-- KPIs under donut -->
      <div class="grid grid-cols-3 gap-1 text-center text-xs">
        <div class="bg-black/20 rounded p-1">
          <div class="opacity-60 text-xs">W</div>
          <div class="font-bold text-emerald-400">${d.wins}</div>
        </div>
        <div class="bg-black/20 rounded p-1">
          <div class="opacity-60 text-xs">L</div>
          <div class="font-bold text-rose-400">${d.losses}</div>
        </div>
        <div class="bg-black/20 rounded p-1">
          <div class="opacity-60 text-xs">G</div>
          <div class="font-bold text-blue-400">${d.games}</div>
        </div>
      </div>
    </div>
  `;

  /* ================= HISTORY ================= */

  const userById = new Map<number, User>();
  users.forEach(u => userById.set(u.id, u));

  const lastMatches = matches.filter(m => m.player1_id === me.id || m.player2_id === me.id).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 6);

  const scoreBadge = (me_id: number, m: Match): string => {
    const myScore = m.player1_id === me_id ? m.score_p1 : m.score_p2;
    const oppScore = m.player1_id === me_id ? m.score_p2 : m.score_p1;
    const win = m.winner_id === me_id;
    return `<span class="font-mono text-xs font-bold ${win ? 'text-emerald-400' : 'text-rose-400'}">${myScore}-${oppScore}</span>`;
  };

  elHistory.innerHTML = `
    <h2 class="font-semibold text-sm mb-1" data-i18n="stats.history">${t('stats.history')}</h2>
    <div class="space-y-1 text-xs h-[calc(100%-1.5rem)] overflow-y-auto">
      ${lastMatches.length === 0 ? `<p class="opacity-50">${t('stats.noMatches')}</p>` : ''}
      ${lastMatches.map(m => {
        const oppId = whoIsOpponent(me.id, m);
        const opp = userById.get(oppId);
        const win = m.winner_id === me.id;
        
        return `
          <div class="rounded ${win ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-rose-500/10 border border-rose-500/30'} p-1.5 flex items-center gap-2 hover:bg-white/5 transition">
            <img src="${opp?.avatar || 'https://dummyimage.com/30x30/111827/ffffff&text=?'}" 
                 class="w-6 h-6 rounded shrink-0" 
                 title="${opp?.nick || '?'}" />
            <div class="flex-1 min-w-0">
              <div class="truncate font-semibold">${opp?.nick ?? '#' + oppId}</div>
            </div>
            <div class="text-right">
              ${scoreBadge(me.id, m)}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

    /* ================= ACCURACY (SIMPLIFIED) ================= */

  const goalsFor = d.gf;
  const goalsAgainst = d.ga;
  const totalGoals = goalsFor + goalsAgainst;
  const precision = totalGoals > 0 ? goalsFor / totalGoals : 0;

  elAccuracy.innerHTML = `
    <h2 class="font-semibold text-sm mb-2" data-i18n="stats.precision">
      ${t('stats.precision')}
    </h2>

    <div class="space-y-2 text-xs h-[calc(100%-1.5rem)] flex flex-col justify-center">
      
      <div class="flex items-center justify-between">
        <span class="opacity-80">${t('stats.goals')}</span>
        <span class="font-mono font-bold text-yellow-300">
          ${goalsFor} / ${goalsAgainst}
        </span>
      </div>

      <div class="h-2 bg-black/30 rounded-full overflow-hidden">
        <div
          class="h-full bg-yellow-400 transition-all"
          style="width: ${precision * 100}%">
        </div>
      </div>

      <div class="text-right text-xs opacity-60">
        ${fmtPct(precision)}
      </div>
    </div>
  `;


  /* ================= STREAKS ================= */

  elStreaks.innerHTML = `
    <h2 class="font-semibold text-sm mb-1" data-i18n="stats.streaks">${t('stats.streaks') || 'Streaks'}</h2>
    <div class="space-y-1 h-[calc(100%-1.5rem)] flex flex-col">
      <!-- Current Streak -->
      <div class="flex-1 bg-linear-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/30 rounded p-2 flex flex-col items-center justify-center min-h-0">
        <div class="text-xs opacity-70">🔥</div>
        <div class="text-2xl font-bold text-amber-300">${d.streak}</div>
        <div class="text-xs opacity-60">current</div>
      </div>

      <!-- Best Streak -->
      <div class="flex-1 bg-linear-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/30 rounded p-2 flex flex-col items-center justify-center min-h-0">
        <div class="text-xs opacity-70">🏆</div>
        <div class="text-2xl font-bold text-emerald-300">${d.best}</div>
        <div class="text-xs opacity-60">best</div>
      </div>
    </div>
  `;

  /* ================= I18N ================= */
  bindI18n(root);
  const offLang = onLangChange(() => {
    // Solo actualizar textos, SIN re-renderizar datos
    updateStatsI18n(root);
  });
  (root as any)._cleanup = () => offLang();
}
