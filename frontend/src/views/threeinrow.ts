// src/views/PlayThreeInRow.ts
import { createMatch, type NewMatch } from '../api';
import { createUser, type NewUser } from '../api';
import { getCurrentUser, getLocalP2, setLocalP2, clearLocalP2 } from '../session';
import { navigate } from '../router';
import { t, bindI18n } from '../i18n/i18n';
import { logTerminal } from '../components/IDEComponets/Terminal';

const LIVE_ROUTE = '#/live/threeinrow';

/* ============================================================
**  Guarda resultado del 3 en raya
** ============================================================ */
export function postThreeInRowResult( winner: 'X' | 'O' | 'draw', board: (string | null)[]) 
{
  const p1 = getCurrentUser();
  const p2 = getLocalP2();
  if (!p1 || !p2) 
    return;

  const payload: NewMatch = 
  {
    player1_id: p1.id,
    player2_id: p2.id,
    score_p1: winner === 'X' ? 1 : 0,
    score_p2: winner === 'O' ? 1 : 0,
    winner_id:
      winner === 'X' ? p1.id : winner === 'O' ? p2.id : 0,
    duration_seconds: 0,
    details: {
      mode: 'three-in-row',
      board,
      players: { p1: p1.nick, p2: p2.nick }
    } as any
  };

  createMatch(payload).catch(() => {});
}

/* ============================================================
**  Vista principal
** ============================================================ */
export async function renderPlayThreeInRow(root: HTMLElement) 
{
  logTerminal('Rendered ThreeInRow view');

  const me = getCurrentUser();
  const p2 = getLocalP2();

  root.innerHTML = `
    <section class="mx-auto max-w-6xl p-6 grow space-y-6">
      <h1 class="text-2xl font-bold" data-i18n="threeinrow.title">
        ${t('threeinrow.title')}
      </h1>

      <div class="rounded-2xl bg-white/10 p-4">
        <div class="grid md:grid-cols-2 gap-4">
          ${me ? youCard(me.nick, me.id, me.avatar) : waitingCard()}
          ${p2 ? readyCard(p2.nick, p2.id, p2.avatar) : loginCard()}
        </div>
      </div>

      <div
        class="rounded-2xl bg-white/10 p-4 ${
          p2 ? '' : 'opacity-50 pointer-events-none'
        }"
      >
        <div class="flex justify-between items-center">
          <div>
            <h3 class="font-semibold">
              ${t('common.readyToPlay')}
            </h3>
            <p class="text-sm opacity-80">
              ${t('common.whenBothReady')}
            </p>
          </div>
          <button
            id="startBtn"
            class="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            ${t('common.startMatch')}
          </button>
        </div>
      </div>
    </section>
  `;

  bindI18n(root);

  const changeBtn = root.querySelector('#changeP2');
  if (changeBtn) 
  {
    changeBtn.addEventListener('click', () => 
    {
      clearLocalP2();
      renderPlayThreeInRow(root);
    });
  }

  const form = root.querySelector<HTMLFormElement>('#p2-form');
  if (form) 
  {
    const err = form.querySelector('#err') as HTMLDivElement;
    form.onsubmit = async e => 
    {
      e.preventDefault();
      err.classList.add('hidden');

      const nick = (form.querySelector('#p2-nick') as HTMLInputElement).value.trim();

      const avatar = makeAvatar(nick);
      const payload: NewUser = { nick, avatar };

      try 
      {
        const u = await createUser(payload);
        setLocalP2({ id: u.id, nick: u.nick, avatar: u.avatar });
        renderPlayThreeInRow(root);
      } 
      catch 
      {
        err.textContent = t('pvp.err.createP2');
        err.classList.remove('hidden');
      }
    };
  }

  root.querySelector('#startBtn')?.addEventListener('click', () => 
  {
    if (!me || !getLocalP2()) 
      return;

    root.innerHTML = gameHTML(me.nick, getLocalP2()!.nick);

    document.getElementById('backBtn')?.addEventListener('click', () => navigate('#'));

    setupThreeInRow();
    navigate(LIVE_ROUTE);
  });
}

/* ============================================================
**  Juego (grid 100% estático)
** ============================================================ */
export function setupThreeInRow() 
{
  const board: (string | null)[] = Array(9).fill(null);
  let turn: 'X' | 'O' = 'X';

  const msg = document.getElementById('message')!;
  const cells = Array.from(document.querySelectorAll<HTMLDivElement>('.cell'));

  cells.forEach((cell, i) => 
  {
    cell.onclick = () => 
    {
      if (board[i] || msg.textContent) return;

      board[i] = turn;
      cell.textContent = turn;

      if (checkWin(board, turn)) 
      {
        msg.textContent = `${turn} gana! 🎉`;
        postThreeInRowResult(turn, board);
        return;
      }

      if (!board.includes(null)) 
      {
        msg.textContent = 'Empate 😐';
        postThreeInRowResult('draw', board);
        return;
      }
      turn = turn === 'X' ? 'O' : 'X';
    };
  });
}

/* ============================================================
**  HTML del juego (layout rígido)
** ============================================================ */
function gameHTML(p1: string, p2: string) 
{
  return `
  <section class="mx-auto max-w-6xl p-6 grow space-y-6 text-white">
    <div class="flex justify-between items-center bg-white/10 px-6 py-3 rounded-2xl">
      <span>${p1} = X · ${p2} = O</span>
      <button id="backBtn" class="bg-red-500 px-4 py-1 rounded">Salir</button>
    </div>

    <div class="flex justify-center">
      <div
        id="tic-tac-toe"
        class="grid grid-cols-3 grid-rows-3 gap-2
               w-64 h-64 place-items-stretch"
      >
        ${'<div class="cell"></div>'.repeat(9)}
      </div>
    </div>

    <div id="message" class="text-center text-xl font-bold"></div>
  </section>
  `;
}

/* ============================================================
**  Utils
** ============================================================ */
function checkWin(b: (string | null)[], p: string) 
{
  const w = 
  [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return w.some(l => l.every(i => b[i] === p));
}

function makeAvatar(nick: string) 
{
  const c = Math.floor(Math.random() * 16777215).toString(16);
  const i = encodeURIComponent((nick[0] || 'P').toUpperCase());
  return `https://dummyimage.com/96x96/${c}/ffffff&text=${i}`;
}

/* ============================================================
**  UI cards
** ============================================================ */
function baseCard(inner: string) 
{
  return `
  <div class="rounded-2xl bg-white/10 p-4 aspect-video
              flex items-center justify-center text-center">
    ${inner}
  </div>`;
}

function youCard(n: string, id: number, a: string) 
{
  return baseCard
  (`
    <div>
      <img src="${a}" class="w-10 h-10 rounded-full mx-auto mb-2">
      <div class="font-semibold">${n}</div>
      <div class="text-xs opacity-70">${id}</div>
    </div>
  `);
}

function readyCard(n: string, id: number, a: string) 
{
  return baseCard
  (`
    <div>
      <img src="${a}" class="w-10 h-10 rounded-full mx-auto mb-2">
      <div class="font-semibold">${n}</div>
      <div class="text-xs opacity-70">${id}</div>
      <button id="changeP2" class="mt-2 text-xs underline">
        Cambiar
      </button>
    </div>
  `);
}

function waitingCard() 
{
  return baseCard(`<div class="opacity-60">⏳ Esperando</div>`);
}

function loginCard() {
  return baseCard
  (`
    <form id="p2-form" class="bg-white p-3 rounded text-black space-y-2">
      <input id="p2-nick" required minlength="2"
        class="w-full border px-2 py-1 rounded" placeholder="Nick">
      <button class="w-full bg-black text-white rounded py-1">
        Crear
      </button>
      <div id="err" class="text-red-600 text-xs hidden"></div>
    </form>
  `);
}

/* ============================================================
**  ESTILO DE CELDA (CRÍTICO)
** ============================================================ */
const style = document.createElement('style');
style.textContent = `
  .cell {
    width: 100%;
    height: 100%;
    border: 2px solid white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1;
    user-select: none;
    cursor: pointer;
  }
`;
document.head.appendChild(style);
