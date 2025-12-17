// src/components/MusicButton.ts
import {
  getTrackIndex, setTrackIndex,
  getVolume, setVolume,
  isMuted as isPausedPref, setMuted as setPausedPref
} from '../../custom/prefs';
import { t, onLangChange } from '../../i18n/i18n';

export function MusicButton(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'flex items-center gap-1';

  /* ================= ICON BUTTONS ================= */

  const btnTrack = document.createElement('button');
  btnTrack.className = 'w-8 h-8 flex items-center justify-center rounded hover:bg-white/10';
  btnTrack.setAttribute('aria-label', t('music.track'));

  btnTrack.innerHTML = `
    <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current opacity-80">
      <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z"/>
    </svg>
  `;

  const btnPlay = document.createElement('button');
  btnPlay.className = 'w-8 h-8 flex items-center justify-center rounded hover:bg-white/10';
  btnPlay.setAttribute('aria-label', t('music.playback'));

  const setPlayIcon = (paused: boolean) => {
    btnPlay.innerHTML = paused
      ? `<svg viewBox="0 0 24 24" class="w-4 h-4 fill-current opacity-80">
           <path d="M8 5v14l11-7z"/>
         </svg>`
      : `<svg viewBox="0 0 24 24" class="w-4 h-4 fill-current opacity-80">
           <path d="M6 5h4v14H6zm8 0h4v14h-4z"/>
         </svg>`;
  };

  wrap.append(btnTrack, btnPlay);

  /* ================= AUDIO LOGIC ================= */

  const tracks = [
    new URL('/assets/customization/music/music1.mp3', import.meta.url).href,
    new URL('/assets/customization/music/music2.mp3', import.meta.url).href,
    new URL('/assets/customization/music/music3.mp3', import.meta.url).href,
  ];

  let audio: HTMLAudioElement | null = null;

  let idx = Number.isFinite(getTrackIndex()) ? getTrackIndex() : 0;
  let volume = Number.isFinite(getVolume()) ? getVolume() : 0.3;
  let paused = !!isPausedPref();

  const ensureAudio = () => {
    if (!audio) {
      audio = new Audio();
      audio.loop = true;
      audio.preload = 'auto';
    }
    audio.volume = volume;
  };

  const tryPlay = async () => {
    ensureAudio();
    if (!audio) return;
    try {
      if (!paused) await audio.play();
    } catch {
      // autoplay blocked, ignore silently
    }
  };

  const applyTrack = async (i: number) => {
    idx = (i + tracks.length) % tracks.length;
    setTrackIndex(idx);

    ensureAudio();
    audio!.pause();
    audio!.currentTime = 0;
    audio!.src = tracks[idx];

    if (!paused) await tryPlay();
  };

  const togglePause = async () => {
    paused = !paused;
    setPausedPref(paused);
    setPlayIcon(paused);

    if (!audio) return;
    if (paused) audio.pause();
    else await tryPlay();
  };

  /* ================= INIT ================= */

  ensureAudio();
  audio!.src = tracks[idx];
  setPlayIcon(paused);

  if (!paused) tryPlay();

  /* ================= EVENTS ================= */

  btnTrack.onclick = () => applyTrack(idx + 1);
  btnPlay.onclick = () => togglePause();

  // Shortcuts
  window.addEventListener('keydown', (e) => {
    if (!(e.altKey && e.shiftKey)) return;
    if (e.key.toLowerCase() === 'm') btnTrack.click();
    if (e.key.toLowerCase() === 'k') btnPlay.click();
  });

  /* ================= I18N ================= */

  const off = onLangChange(() => {
    btnTrack.setAttribute('aria-label', t('music.track'));
    btnPlay.setAttribute('aria-label', t('music.playback'));
  });

  (wrap as any)._cleanup = () => off();

  return wrap;
}
