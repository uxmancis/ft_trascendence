/* ************************************************************************** */
/*                                                                            */
/*                            LiveTournament.ts                               */
/*                                                                            */
/*   Tournament Pong Engine                                                    */
/*   - Owns canvas + game loop                                                 */
/*   - Saves match                                                             */
/*   - Writes tournament:lastResult                                            */
/*                                                                            */
/* ************************************************************************** */

import { createMatch, sanitizeMatch } from '../api';
import { logTerminal } from '../components/IDEComponets/Terminal';

const T_MATCH_PLAYERS_KEY = 'tournament:matchPlayers';
const T_LAST_RESULT_KEY = 'tournament:lastResult';

const SCORE_POINTS = 5;

export function setupTournamentPong(): void {
  const canvas = document.getElementById('live_pong') as HTMLCanvasElement;
  if (!canvas) {
    console.error('[LiveTournament] canvas not found');
    return;
  }

  // Prevent double initialization (multiple loops / duplicated listeners)
  if ((canvas as any)._pong2dBound) {
    console.warn('[LiveTournament] already initialized on this canvas');
    return;
  }
  (canvas as any)._pong2dBound = true;

  // ===== UI/FS restore =====
  const rect = canvas.getBoundingClientRect();
  const initialSizePx = { width: Math.round(rect.width), height: Math.round(rect.height) };
  const initialOverflow = {
    html: document.documentElement.style.overflow,
    body: document.body.style.overflow,
  };

  function enterFullscreen(el: HTMLElement) {
    const anyEl = el as any;
    (anyEl.requestFullscreen || anyEl.webkitRequestFullscreen || anyEl.mozRequestFullScreen || anyEl.msRequestFullscreen)?.call(anyEl);
  }
  function exitFullscreen() {
    const d: any = document;
    (document.exitFullscreen || d.webkitExitFullscreen || d.mozCancelFullScreen || d.msExitFullscreen)?.call(document);
  }
  function isFullscreen(): boolean {
    const d: any = document;
    return !!(document.fullscreenElement || d.webkitFullscreenElement || d.mozFullScreenElement || d.msFullscreenElement);
  }
  function applyCanvasFullscreenStyle(active: boolean) {
    if (active) {
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      canvas.style.width = `${initialSizePx.width}px`;
      canvas.style.height = `${initialSizePx.height}px`;
      document.documentElement.style.overflow = initialOverflow.html;
      document.body.style.overflow = initialOverflow.body;
    }
  }

  const ctx = canvas.getContext('2d')!;

  // initial explicit size (keeps behavior consistent)
  canvas.width = 900;
  canvas.height = 500;

  // ===== Game state & timing (copied semantics from Live1v1) =====
  type GameState = 'READY' | 'COUNTDOWN' | 'SERVE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';
  let state: GameState = 'READY';
  let matchStartedAt = 0;
  let postedResult = 0;

  function drawOverlay(text: string, sub = '') {
    // simple centered text overlay
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.max(20, Math.floor(canvas.height * 0.06))}px monospace`;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 - 10);
    if (sub) {
      ctx.font = `${Math.max(12, Math.floor(canvas.height * 0.03))}px monospace`;
      ctx.fillText(sub, canvas.width / 2, canvas.height / 2 + 30);
    }
    ctx.restore();
  }

  function centerAndServe(initial = false) {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    const dirX = Math.random() < 0.5 ? -1 : 1;
    const dirY = Math.random() < 0.5 ? 1 : -1;
    const speed = initial ? 5 : Math.min(5 + 1.2, 8);
    ball.vx = dirX * speed;
    ball.vy = dirY * speed * 0.6;
  }

  function startNewMatch() {
    player.score = 0;
    player2.score = 0;
    matchStartedAt = Date.now();
    postedResult = 0;
    centerAndServe(true);
    state = 'PLAYING';
  }

  function pauseGame() {
    if (state === 'PLAYING') {
      state = 'PAUSED';
    }
  }
  function resumeGame() {
    if (state === 'PAUSED') {
      state = 'PLAYING';
    }
  }

  /* ----------------------------------------------------------------------- */
  /* Match context                                                           */
  /* ----------------------------------------------------------------------- */

  const raw = sessionStorage.getItem(T_MATCH_PLAYERS_KEY);
  if (!raw) {
    console.error('[LiveTournament] no match context');
    return;
  }

  const { p1, p2 } = JSON.parse(raw);

  const player = {
    id: p1.id,
    nick: p1.nick,
    x: 20,
    y: canvas.height / 2 - 40,
    w: 10,
    h: 80,
    score: 0,
  };

  const player2 = {
    id: p2.id,
    nick: p2.nick,
    x: canvas.width - 30,
    y: canvas.height / 2 - 40,
    w: 10,
    h: 80,
    score: 0,
  };

  /* ----------------------------------------------------------------------- */
  /* Ball                                                                    */
  /* ----------------------------------------------------------------------- */

  const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: 6,
    vx: 5 * (Math.random() > 0.5 ? 1 : -1),
    vy: 3 * (Math.random() > 0.5 ? 1 : -1),
  };

  function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.vx *= -1;
    ball.vy = 3 * (Math.random() > 0.5 ? 1 : -1);
  }

  /* ----------------------------------------------------------------------- */
  /* Input                                                                   */
  /* ----------------------------------------------------------------------- */

  const keys: Record<string, boolean> = {};
  function onKeyDown(e: KeyboardEvent) {
    // movement keys
    if (e.key in keys) { keys[e.key] = true; e.preventDefault && e.preventDefault(); }
    // Escape: exit fullscreen and pause
    if (e.key === 'Escape') {
      if (isFullscreen()) exitFullscreen();
      if (state === 'PLAYING') pauseGame();
    }
    // Space: start / pause / resume
    if (e.code === 'Space') {
      if (state === 'READY' || state === 'GAMEOVER') { startNewMatch(); return; }
      if (state === 'PAUSED') { resumeGame(); return; }
      if (state === 'PLAYING') { pauseGame(); return; }
    }
  }
  function onKeyUp(e: KeyboardEvent) { if (e.key in keys) keys[e.key] = false; }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // Canvas click: enter fullscreen for better experience
  const onCanvasClick = () => {
    if (!isFullscreen()) {
      enterFullscreen(canvas);
      applyCanvasFullscreenStyle(true);
    }
    // click behavior mirrors Live1v1: start/pause/resume
    if (state === 'READY' || state === 'GAMEOVER') { startNewMatch(); return; }
    if (state === 'PLAYING') { pauseGame(); return; }
    if (state === 'PAUSED') { resumeGame(); return; }
  };
  canvas.addEventListener('click', onCanvasClick);

  // fullscreen change -> adjust canvas style and, if exiting, restore size
  const onFsChange = () => {
    const active = isFullscreen();
    applyCanvasFullscreenStyle(active);
    if (!active) {
      // ensure canvas returns to initial display size if needed
      canvas.width = initialSizePx.width;
      canvas.height = initialSizePx.height;
    }
  };
  document.addEventListener('fullscreenchange', onFsChange);

  // window resize -> keep canvas layout consistent (CSS size handled, but adjust internal buffer if needed)
  const onResize = () => {
    // try to respect CSS size; adjust backing buffer to match client size if necessary
    const rect2 = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(rect2.width * dpr);
    const h = Math.round(rect2.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w || canvas.width;
      canvas.height = h || canvas.height;
    }
  };
  window.addEventListener('resize', onResize);

  /* ----------------------------------------------------------------------- */
  /* Update                                                                  */
  /* ----------------------------------------------------------------------- */

  function update() {
    // movement only when playing
    if (state === 'PLAYING') {
      if (keys['w']) player.y -= 6;
      if (keys['s']) player.y += 6;
      if (keys['ArrowUp']) player2.y -= 6;
      if (keys['ArrowDown']) player2.y += 6;

      player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));
      player2.y = Math.max(0, Math.min(canvas.height - player2.h, player2.y));

      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.y <= ball.r || ball.y >= canvas.height - ball.r) {
        ball.vy *= -1;
      }

      if (
        ball.x - ball.r < player.x + player.w &&
        ball.y > player.y &&
        ball.y < player.y + player.h
      ) {
        ball.vx *= -1;
      }

      if (
        ball.x + ball.r > player2.x &&
        ball.y > player2.y &&
        ball.y < player2.y + player2.h
      ) {
        ball.vx *= -1;
      }

      if (ball.x < 0) {
        player2.score++;
        checkWin();
        resetBall();
      }

      if (ball.x > canvas.width) {
        player.score++;
        checkWin();
        resetBall();
      }
    }
  }

  /* ----------------------------------------------------------------------- */
  /* Win logic                                                               */
  /* ----------------------------------------------------------------------- */

  function finishMatch(winner: typeof player, loser: typeof player2) {
  function finishMatch(winner: typeof player, _loser: typeof player2) {
    logTerminal(`🏆 ${winner.nick} wins tournament match`);
    // 🔑 CONTRACT WITH TOURNAMENT VIEW — save result first so UI can proceed even if API fails
    try {
      sessionStorage.setItem(T_LAST_RESULT_KEY, JSON.stringify({ winner_id: winner.id }));
    } catch (err) {
      console.error('[LiveTournament] could not set last result', err);
    }

    // Emit a DOM event so the Tournament view can react immediately and reliably
    try {
      window.dispatchEvent(new Event('tournament:match:end'));
    } catch (err) {
      // ignore dispatch errors on older environments
    }

    // send match to API in background (do not block UI). Use canonical field names.
    (async () => {
      try {
        await createMatch(
          sanitizeMatch({
            player1_id: player.id,
            player2_id: player2.id,
            winner_id: winner.id,
            score_p1: player.score,
            score_p2: player2.score,
          }),
        );
      } catch (err) {
        console.error('[LiveTournament] createMatch failed', err);
      }
    })();

    state = 'GAMEOVER';
    stop();
  }

  function checkWin() {
    if (player.score === SCORE_POINTS) {
      finishMatch(player, player2);
    }
    if (player2.score === SCORE_POINTS) {
      finishMatch(player2, player);
    }
  }

  /* ----------------------------------------------------------------------- */
  /* Render                                                                  */
  /* ----------------------------------------------------------------------- */

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#555';
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.fillRect(canvas.width / 2 - 1, y, 2, 10);
    }

    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.fillRect(player2.x, player2.y, player2.w, player2.h);

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '20px monospace';
    ctx.fillText(String(player.score), canvas.width / 2 - 40, 30);
    ctx.fillText(String(player2.score), canvas.width / 2 + 25, 30);

    // overlay when not playing
    if (state === 'READY') {
      drawOverlay('CLICK OR PRESS SPACE TO START', '');
    } else if (state === 'PAUSED') {
      drawOverlay('PAUSED', 'Press Space to resume');
    } else if (state === 'GAMEOVER') {
      drawOverlay('MATCH OVER', 'Click or press Space for a new match');
    }
  }

  /* ----------------------------------------------------------------------- */
  /* Loop                                                                    */
  /* ----------------------------------------------------------------------- */

  let running = true;

  function loop() {
    if (!running) return;
    update();
    render();
    requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    // remove global listeners to avoid leaks / duplicates on subsequent matches
    try {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('click', onCanvasClick);
      document.removeEventListener('fullscreenchange', onFsChange);
      window.removeEventListener('resize', onResize);
    } catch (err) {
      // ignore
    }
    // restore document overflow and canvas size
    try {
      document.documentElement.style.overflow = initialOverflow.html;
      document.body.style.overflow = initialOverflow.body;
      canvas.style.width = `${initialSizePx.width}px`;
      canvas.style.height = `${initialSizePx.height}px`;
    } catch (err) {}
    // mark canvas as free to be re-initialized and remove cleanup handle
    try {
      (canvas as any)._pong2dBound = false;
      delete (canvas as any)._cleanup;
    } catch (err) {}
  }

  // expose cleanup handle on the canvas (similar to the 3D engine pattern)
  try {
    (canvas as any)._cleanup = () => {
      stop();
    };
  } catch (err) {}

  loop();
}
}
