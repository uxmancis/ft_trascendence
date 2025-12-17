// src/views/Stats.ts

/* ************************************************************************** */
/*                                IMPORTS                                     */
/* ************************************************************************** */

import { getStatsByUserId, getMatches, getUsers, Match, User } from '../api';
import { getCurrentUser } from '../session';
import { t } from '../i18n/i18n';
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
export async function renderStats(root: HTMLElement)
{
  logTerminal('Rendered Stats view');

  const me = getCurrentUser();
  if (!me)
  {
    root.innerHTML = `
      <section class="p-6">
        <p>${t('stats.loginFirst')}</p>
      </section>
    `;
    return;
  }

  /* Responsive donut sizes */
  const narrow = root.clientWidth < 768;
  const donutMain  = narrow ? 130 : 160;
  const donutMinor = narrow ? 120 : 140;

  /* Base layout */
  root.innerHTML = `
    <section class="mx-auto max-w-6xl p-6 grow">
      <h1 class="text-2xl md:text-3xl font-bold mb-4">
        ${t('stats.title')}
      </h1>

      <div class="grid gap-4 md:grid-cols-2
                  lg:grid-cols-[1.1fr_1.1fr_1.6fr]">
        <article id="card-profile"  class="card"></article>
        <article id="card-summary"  class="card"></article>
        <article id="card-history"  class="card lg:row-span-3"></article>
        <article id="card-accuracy" class="card"></article>
        <article id="card-streaks"  class="card"></article>
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
    <div class="flex items-center gap-4">
      <img src="${me.avatar}" class="w-16 h-16 rounded-xl object-cover" />
      <div>
        <div class="text-lg font-semibold">${me.nick}</div>
        <div class="text-sm opacity-80">ID #${me.id}</div>
      </div>
    </div>
  `;

  /* ================= SUMMARY ================= */

  elSummary.innerHTML = `
    <h2 class="font-semibold mb-3">${t('stats.summary')}</h2>
    ${donut(winrate, { size: donutMain })}
  `;

  /* ================= HISTORY ================= */

  const userById = new Map<number, User>();
  users.forEach(u => userById.set(u.id, u));

  const lastMatches = matches.filter(m => m.player1_id === me.id || m.player2_id === me.id).slice(-5).reverse();

  elHistory.innerHTML = `
    <h2 class="font-semibold mb-3">${t('stats.history')}</h2>
    <ul class="space-y-2">
      ${lastMatches.map(m => {
        const oppId = whoIsOpponent(me.id, m);
        const opp = userById.get(oppId);
        return `
          <li class="rounded-lg bg-black/20 p-3 flex justify-between">
            ${badgeWinLoss(me.id, m)}
            <span>${t('stats.vs', { nick: opp?.nick ?? '#' + oppId })}</span>
          </li>
        `;
      }).join('')}
    </ul>
  `;

  /* ================= ACCURACY ================= */

  const shots = stats.goals_scored + stats.shots_on_target;
  const goalAcc = shots ? stats.goals_scored / shots : 0;

  elAccuracy.innerHTML = `
    <h2 class="font-semibold mb-3">${t('stats.precision')}</h2>
    ${donut(goalAcc, {
      size: donutMinor,
      color: '#60a5fa',
      sublabel: `${stats.goals_scored}/${shots}`
    })}
  `;

  /* ================= STREAKS ================= */

  elStreaks.innerHTML = `
    <h2 class="font-semibold mb-3">${t('stats.streaks')}</h2>
    <div class="text-3xl font-bold">${d.streak}</div>
    <div class="text-sm opacity-80">
      ${t('stats.bestStreak')}: ${d.best}
    </div>
  `;
}
