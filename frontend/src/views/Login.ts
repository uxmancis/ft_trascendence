// src/views/Login.ts
import { createUser, NewUser } from '../api';
import { setCurrentUser } from '../session';
import { t } from '../i18n/i18n';
import { UnifiedControlPanel } from '../components/UnifiedControlPanel';

function randInt(min: number, max: number) {return Math.floor(Math.random() * (max - min + 1)) + min;}

function randomColorHex(): string 
{
  const h = randInt(0, 359);
  const s = 80;
  const l = 45;

  const s1 = s / 100;
  const l1 = l / 100;
  const c = (1 - Math.abs(2 * l1 - 1)) * s1;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l1 - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; }

  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export async function renderLogin(root: HTMLElement, onSuccess: () => void) 
{
  UnifiedControlPanel("login");
  root.innerHTML = `
    <section class="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
      <div class="w-full max-w-xl p-8 rounded-2xl
                  bg-neutral-800/70 backdrop-blur
                  border border-white/10 shadow-xl">

        <h1 class="text-3xl font-bold tracking-wide mb-2">
          FT_TRANSCENDENCE
        </h1>

        <p class="text-sm opacity-70 mb-6">
          ${t('login.subtitle')}
        </p>

        <div class="text-sm opacity-80 mb-6 space-y-1">
          <p>• Pong AI, 1v1, 4v4 & tournaments</p>
          <p>• IDE-inspired interface (VSCode style)</p>
          <p>• Accessibility, themes & language built-in</p>
        </div>

        <form id="login-form" class="space-y-3">
          <input
            id="nick"
            class="w-full px-3 py-2 rounded bg-neutral-900 border border-white/10
                   focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            placeholder="${t('login.nick.placeholder')}"
            data-i18n-attr="placeholder:login.nick.placeholder"
            required minlength="2" maxlength="20"
          />

          <button
            class="w-full py-2 rounded bg-blue-600 hover:bg-blue-500
                   transition font-medium"
            data-i18n="login.submit">
            ${t('login.submit')}
          </button>

          <div id="error" class="text-red-400 text-sm hidden"></div>
        </form>
      </div>
    </section>
  `;

  const form = root.querySelector<HTMLFormElement>('#login-form')!;
  const errBox = root.querySelector<HTMLDivElement>('#error')!;

  form.onsubmit = async (e) => {
    e.preventDefault();
    errBox.classList.add('hidden');

    const nickInput = root.querySelector<HTMLInputElement>('#nick')!;
    const nick = nickInput.value.trim();

    const initial = encodeURIComponent((nick[0] || 'P').toUpperCase());
    const bg = randomColorHex();
    const avatar = `https://dummyimage.com/96x96/${bg}/ffffff&text=${initial}`;

    const payload: NewUser = { nick, avatar };

    try {
      const created = await createUser(payload);
      setCurrentUser({
        id: created.id,
        nick: created.nick,
        avatar: created.avatar
      });
      onSuccess();
    } catch (err: any) {
      errBox.textContent = err?.message || t('login.error');
      errBox.classList.remove('hidden');
    }
  };
}
