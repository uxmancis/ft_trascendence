import { createUser, NewUser } from '../api';
import { getCurrentUser, getLocalP2, setLocalP2 } from '../session';
import { navigate } from '../router';
import { t, bindI18n } from '../i18n/i18n';

const LIVE_ROUTE = '#/live/1v1'; // cambia si usas otra ruta

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomColorHex(): string {
  const h = randInt(0, 359), s = 80, l = 45;
  const s1 = s / 100, l1 = l / 100;
  const c = (1 - Math.abs(2 * l1 - 1)) * s1;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l1 - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  const toHex = (n:number)=>Math.round((n+m)*255).toString(16).padStart(2,'0');
  return `${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export async function renderPlay1v1(root: HTMLElement) {
  const me = getCurrentUser();
  const p2 = getLocalP2();

  root.innerHTML = `
    <section class="mx-auto max-w-6xl p-6 grow space-y-6">
      <h1 class="text-2xl font-bold" data-i18n="pvp.title">${t('pvp.title')}</h1>

      <!-- GRID 1x2 (en móvil 1x1) -->
      <div class="rounded-2xl bg-white/10 p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Izquierda: tú -->
          ${me ? youCard(me.nick, me.id, me.avatar) : waitingCard()}

          <!-- Derecha: P2 login/confirmado -->
          ${p2 ? readyCard(p2.nick, p2.id, p2.avatar) : loginCard()}
        </div>
      </div>

      <!-- CTA iniciar -->
      <div id="start-area" class="rounded-2xl bg-white/10 p-4 ${p2 ? '' : 'opacity-50 pointer-events-none'}">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold" data-i18n="common.readyToPlay">${t('common.readyToPlay')}</h3>
            <p class="opacity-80 text-sm" data-i18n="common.whenBothReady">${t('common.whenBothReady')}</p>
          </div>
          <button id="startBtn" class="px-4 py-2 rounded bg-emerald-500/80 hover:bg-emerald-600 text-white"
            data-i18n="common.startMatch">${t('common.startMatch')}</button>
        </div>
      </div>
    </section>
  `;

  bindI18n(root);

  // cambiar P2 (si estaba creado)
  const change = root.querySelector<HTMLButtonElement>('#changeP2');
  if (change) {
    change.onclick = () => {
      localStorage.removeItem('pong:local:p2');
      renderPlay1v1(root);
    };
  }

  // crear P2 si no existe
  const form = root.querySelector<HTMLFormElement>('#p2-form');
  if (form) {
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
        renderPlay1v1(root); // recarga con P2 listo
      } catch (err: any) {
        errBox.textContent = err?.message || t('pvp.err.createP2');
        errBox.classList.remove('hidden');
      }
    };
  }

  // START → guarda pairing y navega a LIVE
  const startBtn = root.querySelector<HTMLButtonElement>('#startBtn')!;
  startBtn.onclick = () => {
    const p2Now = getLocalP2();
    if (!me || !p2Now) return;

    sessionStorage.setItem('pvp:players', JSON.stringify([me, p2Now]));
    navigate(LIVE_ROUTE);
  };
}

/* ============ helpers (tarjetas con el mismo estilo que AI) ============ */
function baseCard(inner: string) {
  return `
    <div
      class="group relative rounded-2xl bg-white/10 p-4 aspect-video flex items-center justify-center text-center
             hover:bg-white/20 focus-within:ring-4 focus-within:ring-sky-400 transition ring-0"
    >
      <div class="absolute top-2 right-3 text-2xl mark" aria-hidden="true"></div>
      ${inner}
    </div>
  `;
}

function youCard(nick: string, id: number, avatar: string) {
  return baseCard(`
    <div class="text-center">
      <div class="text-6xl mb-2">✅</div>
      <div class="flex items-center gap-3 justify-center">
        <img src="${avatar}" class="w-10 h-10 rounded-full"/>
        <div>
          <div class="font-semibold">${nick}</div>
          <div class="text-xs opacity-80">${t('common.id')} ${id}</div>
        </div>
      </div>
    </div>
  `);
}

function readyCard(nick: string, id: number, avatar: string) {
  return baseCard(`
    <div class="text-center">
      <div class="text-6xl mb-2">✅</div>
      <div class="flex items-center gap-3 justify-center">
        <img src="${avatar}" class="w-10 h-10 rounded-full"/>
        <div>
          <div class="font-semibold">${nick}</div>
          <div class="text-xs opacity-80">${t('common.id')} ${id}</div>
        </div>
      </div>
      <button id="changeP2" class="mt-3 text-xs px-2 py-1 rounded bg-black/30 hover:bg-black/50" data-i18n="pvp.changePlayer">
        ${t('pvp.changePlayer')}
      </button>
    </div>
  `);
}

function waitingCard() {
  return baseCard(`
    <div class="text-center opacity-80">
      <div class="text-4xl mb-2">⏳</div>
      <div class="px-2 py-1 rounded bg-red-600/80 text-white text-xs font-semibold">LOGIN</div>
    </div>
  `);
}

function loginCard() {
  return baseCard(`
    <form id="p2-form" class="w-60 bg-white/90 rounded-xl p-4 shadow flex flex-col gap-2">
      <div class="text-center text-black font-semibold mb-1" data-i18n="login.title">${t('login.title')}</div>
      <input id="p2-nick" class="px-3 py-2 rounded border text-black"
             placeholder="${t('login.nick')}"
             data-i18n-attr="placeholder:login.nick"
             minlength="2" maxlength="20" required />
      <button class="px-3 py-2 rounded bg-black/80 hover:bg-black text-white text-sm"
              data-i18n="login.submit">${t('login.submit')}</button>
      <div id="err" class="text-red-600 text-xs hidden"></div>
    </form>
  `);
}
