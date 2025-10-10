// src/components/MusicButton.ts
import {
  getTrackIndex, setTrackIndex,
  getVolume, setVolume,
  isMuted, setMuted
} from '../custom/prefs';

export function MusicButton(compact = true): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = compact ? 'inline-flex items-center gap-2' : 'flex items-center gap-3';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'music-btn';
  btn.className = 'px-2 py-1 rounded bg-black/30 hover:bg-black/50 text-xs font-medium';
  btn.setAttribute('aria-label', 'Cambiar música de fondo');

  const vol = document.createElement('input');
  vol.type = 'range';
  vol.min = '0';
  vol.max = '1';
  vol.step = '0.01';
  vol.className = 'w-24 accent-sky-400';

  const mute = document.createElement('button');
  mute.type = 'button';
  mute.className = 'px-2 py-1 rounded bg-black/30 hover:bg-black/50 text-xs font-medium';
  mute.setAttribute('aria-label', 'Silenciar o activar sonido');

  // aviso discreto si el autoplay falla
  const hint = document.createElement('span');
  hint.className = 'text-[11px] opacity-80 px-2 py-1 rounded bg-black/30';
  hint.style.display = 'none';
  hint.textContent = 'Pulsa para activar sonido';

  wrap.append(btn, vol, mute, hint);

  const tracks = [
    new URL('/src/assets/music/music1.mp3', import.meta.url).href,
    new URL('/src/assets/music/music2.mp3', import.meta.url).href,
    new URL('/src/assets/music/music3.mp3', import.meta.url).href,
  ];
  const labels = ['🎵 Pista 1', '🎵 Pista 2', '🎵 Pista 3', '🔇 Silencio'];

  let audio: HTMLAudioElement | null = null;

  // Defaults: pista 0, volumen 0.3, SIN mute (salvo preferencia previa explícita)
  let idx = (() => {
    const saved = getTrackIndex();
    return Number.isFinite(saved) ? saved : 0;
  })();
  let volume = (() => {
    const saved = getVolume();
    return Number.isFinite(saved) ? saved : 0.3;
  })();
  let muted = isMuted(); // si el user guardó mute, respetamos

  const ensureAudio = () => {
    if (!audio) {
      audio = new Audio();
      audio.loop = true;
      audio.preload = 'auto';
    }
    audio.volume = muted ? 0 : volume;
  };

  const setUiText = () => {
    const labelIdx = (idx >= 0 && idx < tracks.length) ? idx : tracks.length;
    btn.textContent = labels[labelIdx];
    mute.textContent = muted ? '🔇 Mute' : '🔊 Sonido';
    mute.setAttribute('aria-pressed', muted ? 'true' : 'false');
  };

  const tryPlay = async () => {
    ensureAudio();
    if (!audio) return false;
    if (idx >= 0 && idx < tracks.length) {
      if (!audio.src) audio.src = tracks[idx];
      audio.volume = muted ? 0 : volume;
      try { await audio.play(); return true; }
      catch { return false; } // bloqueado por autoplay
    }
    return false;
  };

  const showHint = () => { hint.style.display = ''; };
  const hideHint = () => { hint.style.display = 'none'; };

  const armFirstInteract = () => {
    // si el navegador bloquea autoplay, activamos al primer gesto
    const handler = async () => {
      document.removeEventListener('pointerdown', handler, true);
      const ok = await tryPlay();
      if (ok) hideHint();
    };
    document.addEventListener('pointerdown', handler, true);
  };

  const applyTrack = async (i: number) => {
    idx = (i + (tracks.length + 1)) % (tracks.length + 1);
    setTrackIndex(idx);

    ensureAudio();
    audio!.pause();
    audio!.currentTime = 0;

    if (idx >= 0 && idx < tracks.length) {
      audio!.src = tracks[idx];
      audio!.volume = muted ? 0 : volume;
      try {
        await audio!.play();
        hideHint();
      } catch {
        showHint(); armFirstInteract();
      }
    } else {
      audio!.src = '';
      hideHint();
    }
    setUiText();
  };

  const applyMute = (m: boolean) => {
    muted = m;
    setMuted(muted);
    if (audio) audio.volume = muted ? 0 : volume;
    setUiText();
  };

  const applyVolume = (v: number) => {
    volume = Math.max(0, Math.min(1, v));
    setVolume(volume);
    if (audio && !muted) audio.volume = volume;
  };

  // Init UI
  ensureAudio();
  vol.value = String(volume);
  setUiText();

  // 👉 Autoplay inmediato por defecto
  (async () => {
    if (idx >= 0 && idx < tracks.length) {
      const ok = await tryPlay();
      if (!ok) { showHint(); armFirstInteract(); }
    }
  })();

  // Handlers
  btn.addEventListener('click', () => applyTrack(idx + 1));
  vol.addEventListener('input', () => applyVolume(Number(vol.value)));
  mute.addEventListener('click', () => applyMute(!muted));

  // Atajos: Alt+Shift+M cambia pista; Alt+Shift+↑/↓ volumen
  window.addEventListener('keydown', (e) => {
    if (!(e.altKey && e.shiftKey)) return;
    const k = e.key.toLowerCase();
    if (k === 'm') { e.preventDefault(); btn.click(); }
    if (k === 'arrowup')   { e.preventDefault(); vol.value = String(Math.min(1, Number(vol.value) + 0.05)); vol.dispatchEvent(new Event('input')); }
    if (k === 'arrowdown') { e.preventDefault(); vol.value = String(Math.max(0, Number(vol.value) - 0.05)); vol.dispatchEvent(new Event('input')); }
  });

  return wrap;
}
