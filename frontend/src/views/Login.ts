// src/views/Login.ts
import { createUser, NewUser } from '../api';
import { setCurrentUser } from '../session';
import { t } from '../i18n/i18n';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
// Genera un color vistoso aleatorio (en hex sin # para dummyimage)
function randomColorHex(): string {
  // HSL -> Hex para colores saturados y con buena legibilidad en texto blanco
  const h = randInt(0, 359);
  const s = 80; // 0-100
  const l = 45; // 0-100
  const toHex = (n: number) => n.toString(16).padStart(2, '0');

  const s1 = s / 100;
  const l1 = l / 100;
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

  const R = Math.round((r + m) * 255);
  const G = Math.round((g + m) * 255);
  const B = Math.round((b + m) * 255);
  return `${toHex(R)}${toHex(G)}${toHex(B)}`; // sin '#'
}

export async function renderLogin(root: HTMLElement, onSuccess: () => void){
  root.innerHTML = `
    <section class="mx-auto max-w-md p-6 w-full">
      <div class="rounded-2xl bg-white/10 p-6 shadow-lg">
        <h1 class="text-2xl font-bold mb-4" data-i18n="login.welcome">${t('login.welcome')}</h1>
        <p class="opacity-80 mb-4 text-sm" data-i18n="login.subtitle">
          ${t('login.subtitle')}
        </p>
        <form id="login-form" class="grid gap-3">
          <input id="nick" class="px-3 py-2 rounded text-black" placeholder="${t('login.nick.placeholder')}" data-i18n-attr="placeholder:login.nick.placeholder"
                 required minlength="2" maxlength="20" />
          <button class="px-4 py-2 rounded bg-black/40 hover:bg-black/60 text-white" data-i18n="login.submit">${t('login.submit')}</button>
          <div id="error" class="text-red-300 text-sm hidden"></div>
        </form>
      </div>
    </section>
  `;

  const form = root.querySelector<HTMLFormElement>('#login-form')!;
  const errBox = root.querySelector<HTMLDivElement>('#error')!;

  form.onsubmit = async (e) => {
    e.preventDefault();
    errBox.classList.add('hidden');

    const nickInput = root.querySelector('#nick') as HTMLInputElement;
    const nick = nickInput.value.trim();

    const initial = encodeURIComponent((nick.charAt(0) || 'P').toUpperCase());
    const bg = randomColorHex(); // p.ej. "0ea5e9"
    // texto blanco fijo (ffffff) para buen contraste
    const avatar = `https://dummyimage.com/96x96/${bg}/ffffff&text=${initial}`;

    const payload: NewUser = { nick, avatar };

    try {
      const created = await createUser(payload);
      setCurrentUser({ id: created.id, nick: created.nick, avatar: created.avatar });
      onSuccess();
    } catch (err: any) {
      errBox.textContent = err?.message || t('login.error');
      errBox.classList.remove('hidden');
    }
  };
}
