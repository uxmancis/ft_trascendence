import { createUser, NewUser } from '../api';
import { getCurrentUser, getLocalP2, setLocalP2 } from '../session';
import { navigate } from '../router';
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

export async function renderPlay1v1(root: HTMLElement){
  const me = getCurrentUser();
  const p2 = getLocalP2();

  root.innerHTML = `
    <section class="mx-auto max-w-6xl p-6 grow space-y-6">
      <h1 class="text-2xl font-bold" data-i18n="pvp.title">${t('pvp.title')}</h1>
      <div class="grid md:grid-cols-2 gap-4">
        <div class="rounded-2xl bg-white/10 p-4">
          <h2 class="font-semibold mb-2" data-i18n="pvp.player1">${t('pvp.player1')}</h2>
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
          <h2 class="font-semibold mb-2" data-i18n="pvp.player2">${t('pvp.player2')}</h2>

          <div id="p2-view">
            ${
              p2
                ? `<div class="flex items-center justify-between">
                     <div class="flex items-center gap-3">
                       <img src="${p2.avatar}" class="w-10 h-10 rounded-full"/>
                       <div>
                         <div class="font-medium">${p2.nick}</div>
                         <div class="text-xs opacity-80">${t('common.id')} ${p2.id}</div>
                       </div>
                     </div>
                     <button id="changeP2" class="text-xs px-2 py-1 rounded bg-black/30 hover:bg-black/50" data-i18n="pvp.changePlayer">
                       ${t('pvp.changePlayer')}
                     </button>
                   </div>`
                : `<form id="p2-form" class="grid gap-3">
                     <input id="p2-nick" class="px-3 py-2 rounded text-black" placeholder="${t('pvp.nickP2.placeholder')}" data-i18n-attr="placeholder:pvp.nickP2.placeholder"
                            required minlength="2" maxlength="20" />
                     <button class="px-4 py-2 rounded bg-black/40 hover:bg-black/60 text-white" data-i18n="pvp.createAndContinue">
                       ${t('pvp.createAndContinue')}
                     </button>
                     <div id="err" class="text-red-300 text-sm hidden"></div>
                   </form>`
            }
          </div>
        </div>
      </div>

      <div id="start-area" class="rounded-2xl bg-white/10 p-4 ${p2 ? '' : 'opacity-50 pointer-events-none'}">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold" data-i18n="common.readyToPlay">${t('common.readyToPlay')}</h3>
            <p class="opacity-80 text-sm" data-i18n="common.whenBothReady">${t('common.whenBothReady')}</p>
          </div>
          <button id="startBtn" class="px-4 py-2 rounded bg-emerald-500/80 hover:bg-emerald-600 text-white" data-i18n="common.startMatch">
            ${t('common.startMatch')}
          </button>
        </div>
        <div id="canvas" class="mt-4 rounded-2xl bg-black/60 aspect-video grid place-items-center text-sm opacity-80">
          <span data-i18n="common.canvasHere">${t('common.canvasHere')}</span>
        </div>
      </div>
    </section>
  `;

  // cambiar P2
  const change = root.querySelector<HTMLButtonElement>('#changeP2');
  if (change){
    change.onclick = () => {
      localStorage.removeItem('pong:local:p2');
      renderPlay1v1(root);
    };
  }

  // crear P2 si no existe
  const form = root.querySelector<HTMLFormElement>('#p2-form');
  if (form){
    const errBox = form.querySelector<HTMLDivElement>('#err')!;
    form.onsubmit = async (e) => {
      e.preventDefault();
      errBox.classList.add('hidden');
      const nick = (form.querySelector('#p2-nick') as HTMLInputElement).value.trim();
      const initial = encodeURIComponent((nick.charAt(0) || 'P').toUpperCase());
      const bg = randomColorHex();
      const avatar = `https://dummyimage.com/96x96/${bg}/ffffff&text=${initial}`;
      const payload: NewUser = { nick, avatar };

      try {
        const created = await createUser(payload);
        setLocalP2({ id: created.id, nick: created.nick, avatar: created.avatar });
        renderPlay1v1(root); // recargar vista con P2 ya listo
      } catch (err: any) {
        errBox.textContent = err?.message || t('pvp.err.createP2');
        errBox.classList.remove('hidden');
      }
    };
  }

  // empezar partido
  const startBtn = root.querySelector<HTMLButtonElement>('#startBtn')!;
  startBtn.onclick = () => {
    const p2Now = getLocalP2();
    if (!p2Now) return;
    // aquí iniciarías el engine; por ahora, te muevo a la vista de canvas (misma página)
    const canvas = root.querySelector<HTMLDivElement>('#canvas')!;
    canvas.innerHTML = `<div>Iniciando partida: <b>${me?.nick}</b> <span data-i18n="common.vs">${t('common.vs')}</span> <b>${p2Now.nick}</b>...</div>`;
    // si quieres ir a otra ruta de "live":
    // navigate('#/live/1v1'); // y allí pintas tu canvas
  };
}
