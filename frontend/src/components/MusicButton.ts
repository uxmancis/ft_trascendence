// src/components/MusicButton.ts
import {
  getTrackIndex, setTrackIndex,
  getVolume, setVolume,
  isMuted as isPausedPref, setMuted as setPausedPref
} from '../custom/prefs';
import { t, onLangChange } from '../i18n/i18n';

export function MusicButton(compact = true): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = compact ? 'inline-flex items-center gap-2' : 'flex items-center gap-3';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'music-btn';
  btn.className = 'px-2 py-1 rounded bg-black/30 hover:bg-black/50 text-xs font-medium';
  btn.setAttribute('aria-label', t('panel.music'));

  const vol = document.createElement('input');
  vol.type = 'range';
  vol.min = '0';
  vol.max = '1';
  vol.step = '0.01';
  vol.className = 'w-24 accent-sky-400';

  // ▶️ / ⏸ control (antes “mute”)
  const playback = document.createElement('button');
  playback.type = 'button';
  playback.className = 'px-2 py-1 rounded bg-black/30 hover:bg-black/50 text-xs font-medium';
  playback.setAttribute('aria-label', t('music.playback'));

  // aviso discreto si el autoplay falla
  const hint = document.createElement('span');
  hint.className = 'text-[11px] opacity-80 px-2 py-1 rounded bg-black/30';
  hint.style.display = 'none';
  hint.textContent = t('music.hint');

  wrap.append(btn, vol, playback, hint);

  const tracks = [
    new URL('/src/assets/music/music1.mp3', import.meta.url).href,
    new URL('/src/assets/music/music2.mp3', import.meta.url).href,
    new URL('/src/assets/music/music3.mp3', import.meta.url).href,
  ];

  let audio: HTMLAudioElement | null = null;

  // Defaults
  let idx = (() => {
    const saved = getTrackIndex();
    return Number.isFinite(saved) ? (saved as number) : 0;
  })();
  let volume = (() => {
    const saved = getVolume();
    return Number.isFinite(saved) ? (saved as number) : 0.3;
  })();
  // Reutilizamos la preferencia “muted” como “paused”
  let paused = !!isPausedPref();

  const ensureAudio = () => {
    if (!audio) {
      audio = new Audio();
      audio.loop = true;
      audio.preload = 'auto';
    }
    if (audio) audio.volume = volume;
  };

  const labelForIndex = (i: number) => {
    if (i >= 0 && i < tracks.length) {
      return [t('music.track1'), t('music.track2'), t('music.track3')][i];
    }
    return t('music.silence');
  };

  const setUiText = () => {
    const labelIdx = (idx >= 0 && idx < tracks.length) ? idx : tracks.length;
    btn.textContent = labelForIndex(labelIdx);
    // Botón muestra la ACCIÓN: si está reproduciendo → “Pausar”; si está en pausa → “Reproducir”
    playback.textContent = paused ? `▶️ ${t('music.play')}` : `⏸ ${t('music.pause')}`;
    playback.setAttribute('aria-pressed', paused ? 'true' : 'false');
  };

  const tryPlay = async () => {
    ensureAudio();
    if (!audio) return false;
    if (idx >= 0 && idx < tracks.length) {
      if (!audio.src) audio.src = tracks[idx];
      audio.volume = volume;
      try {
        if (!paused) await audio.play();
        return true;
      } catch {
        return false; // bloqueo de autoplay
      }
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
      audio!.volume = volume;
      try {
        if (!paused) await audio!.play();
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

  const applyPause = async (p: boolean) => {
    paused = p;
    setPausedPref(paused); // guardamos como si fuera “muted”, así no tocamos prefs.ts
    if (!audio) return setUiText();

    if (paused) {
      audio.pause();
    } else {
      try { await audio.play(); hideHint(); }
      catch { showHint(); armFirstInteract(); }
    }
    setUiText();
  };

  const applyVolume = (v: number) => {
    volume = Math.max(0, Math.min(1, v));
    setVolume(volume);
    if (audio && !paused) audio.volume = volume;
  };

  // Init UI
  ensureAudio();
  vol.value = String(volume);
  setUiText();

  // Autoplay si hay pista y NO está en pausa
  (async () => {
    if (idx >= 0 && idx < tracks.length) {
      const ok = await tryPlay();
      if (!ok && !paused) { showHint(); armFirstInteract(); }
    }
  })();

  // Handlers
  btn.addEventListener('click', () => applyTrack(idx + 1));
  vol.addEventListener('input', () => applyVolume(Number(vol.value)));
  playback.addEventListener('click', () => applyPause(!paused));

  // Atajos: Alt+Shift+M cambia pista; Alt+Shift+K pausa/continúa; Alt+Shift+↑/↓ volumen
  window.addEventListener('keydown', (e) => {
    if (!(e.altKey && e.shiftKey)) return;
    const k = e.key.toLowerCase();
    if (k === 'm') { e.preventDefault(); btn.click(); }
    if (k === 'k') { e.preventDefault(); playback.click(); } // como YouTube
    if (k === 'arrowup')   { e.preventDefault(); vol.value = String(Math.min(1, Number(vol.value) + 0.05)); vol.dispatchEvent(new Event('input')); }
    if (k === 'arrowdown') { e.preventDefault(); vol.value = String(Math.max(0, Number(vol.value) - 0.05)); vol.dispatchEvent(new Event('input')); }
  });

  // Update UI texts on language change
  const off = onLangChange(() => {
    btn.setAttribute('aria-label', t('panel.music'));
    playback.setAttribute('aria-label', t('music.playback'));
    hint.textContent = t('music.hint');
    setUiText();
  });
  (wrap as any)._cleanup = () => off();

  return wrap;
}
