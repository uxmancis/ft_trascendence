import { createUser, NewUser } from '../api';
import { getCurrentUser, getTournamentPlayers, setTournamentPlayers, clearTournamentPlayers } from '../session';
import { t } from '../i18n/i18n';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomColorHex(): string {
  const h = randInt(0, 359), s = 80, l = 45;
  const s1 = s/100, l1 = l/100;
  const c = (1 - Math.abs(2*l1 - 1)) * s1;
  const x = c * (1 - Math.abs(((h/60) % 2) - 1));
  const m = l1 - c/2;
  let r=0,g=0,b=0;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  const toHex = (n:number)=>Math.round((n+m)*255).toString(16).padStart(2,'0');
  return `${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export async function renderTournament(root: HTMLElement){
  const me = getCurrentUser();
  let locals = getTournamentPlayers(); // 3 jugadores locales extra
  if (locals.length > 3) locals = locals.slice(0,3);
  const missing = 3 - locals.length;

  root.innerHTML = `
    <section class="mx-auto max-w-6xl p-6 grow space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold" data-i18n="tour.title">${t('tour.title')}</h1>
        <button id="reset" class="text-xs px-2 py-1 rounded bg-black/30 hover:bg-black/50" data-i18n="tour.reset">${t('tour.reset')}</button>
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        <div class="rounded-2xl bg-white/10 p-4">
          <h2 class="font-semibold mb-2" data-i18n="tour.player1">${t('tour.player1')}</h2>
          ${
            me
              ? `<div class="flex items-center gap-3">
                   <img src="${me.avatar}" class="w-10 h-10 rounded-full"/>
                   <div>
                     <div class="font-medium">${me.nick}</div>
                     <div class="text-xs opacity-80">${t('common.id')} ${me.id}</div>
                   </div>
                 </div>`
              : `<p class="opacity-80 text-sm" data-i18n="common.noUser">${t('common.noUser')}</p>`
          }
        </div>

        <div class="rounded-2xl bg-white/10 p-4">
          <h2 class="font-semibold mb-2">${t('tour.missingN').replace('{n}', String(missing))}</h2>
          <div id="players-list" class="space-y-2 mb-3">
            ${locals.map(p => `
              <div class="flex items-center justify-between rounded bg-white/5 p-2">
                <div class="flex items-center gap-3">
                  <img src="${p.avatar}" class="w-8 h-8 rounded-full"/>
                  <div>
                    <div class="font-medium">${p.nick}</div>
                    <div class="text-xs opacity-80">${t('common.id')} ${p.id}</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          ${locals.length < 3 ? `
            <form id="add-form" class="grid gap-3">
              <input id="nick" class="px-3 py-2 rounded text-black" placeholder="${t('common.newNickPlaceholder')}" data-i18n-attr="placeholder:common.newNickPlaceholder"
                     required minlength="2" maxlength="20"/>
              <button class="px-4 py-2 rounded bg-black/40 hover:bg-black/60 text-white" data-i18n="tour.add">
                ${t('tour.add')}
              </button>
              <div id="err" class="text-red-300 text-sm hidden"></div>
            </form>
          ` : `<p class="opacity-80 text-sm" data-i18n="common.alreadyHave3">${t('common.alreadyHave3')}</p>`}
        </div>
      </div>

      <div id="start-area" class="rounded-2xl bg-white/10 p-4 ${locals.length === 3 ? '' : 'opacity-50 pointer-events-none'}">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold" data-i18n="tour.ready">${t('tour.ready')}</h3>
            <p class="opacity-80 text-sm" data-i18n="tour.schema">${t('tour.schema')}</p>
          </div>
          <button id="startBtn" class="px-4 py-2 rounded bg-emerald-500/80 hover:bg-emerald-600 text-white" data-i18n="common.startTournament">
            ${t('common.startTournament')}
          </button>
        </div>
        <div id="board" class="mt-4 rounded-2xl bg-black/60 aspect-video grid place-items-center text-sm opacity-80">
          <span data-i18n="common.boardHere">${t('common.boardHere')}</span>
        </div>
      </div>
    </section>
  `;

  // reiniciar
  root.querySelector<HTMLButtonElement>('#reset')!.onclick = () => {
    clearTournamentPlayers();
    renderTournament(root);
  };

  // añadir jugadores
  const addForm = root.querySelector<HTMLFormElement>('#add-form');
  if (addForm){
    const errBox = addForm.querySelector<HTMLDivElement>('#err')!;
    addForm.onsubmit = async (e) => {
      e.preventDefault();
      errBox.classList.add('hidden');

      const nick = (addForm.querySelector('#nick') as HTMLInputElement).value.trim();
      const initial = encodeURIComponent((nick.charAt(0) || 'P').toUpperCase());
      const bg = randomColorHex();
      const avatar = `https://dummyimage.com/96x96/${bg}/ffffff&text=${initial}`;
      const payload: NewUser = { nick, avatar };
      try {
        const created = await createUser(payload);
        const players = getTournamentPlayers();
        players.push({ id: created.id, nick: created.nick, avatar: created.avatar });
        setTournamentPlayers(players.slice(0,3));
        renderTournament(root);
      } catch (err: any) {
        errBox.textContent = err?.message || t('tour.err.create');
        errBox.classList.remove('hidden');
      }
    };
  }

  // empezar torneo
  root.querySelector<HTMLButtonElement>('#startBtn')!.onclick = () => 
    {
    const localsNow = getTournamentPlayers();
    if (localsNow.length !== 3 || !me) return;
    const players = [me, ...localsNow]; // [J1, J2, J3, J4]
    const board = root.querySelector<HTMLDivElement>('#board')!;
    board.innerHTML = `
      <div class="text-center">
        <div class="font-semibold mb-2" data-i18n="common.semis">${t('common.semis')}</div>
        <div class="mb-3">${players[0].nick} vs ${players[1].nick}</div>
        <div class="mb-3">${players[2].nick} vs ${players[3].nick}</div>
        <div class="font-semibold mt-4" data-i18n="common.begins">${t('common.begins')}</div>
      </div>`;
    // aquí iniciarías los partidos en el canvas con el engine
  };
}
