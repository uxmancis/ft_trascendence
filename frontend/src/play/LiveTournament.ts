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

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = 900;
  canvas.height = 500;

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
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  /* ----------------------------------------------------------------------- */
  /* Update                                                                  */
  /* ----------------------------------------------------------------------- */

  function update() {
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

  /* ----------------------------------------------------------------------- */
  /* Win logic                                                               */
  /* ----------------------------------------------------------------------- */

  function finishMatch(winner: typeof player, loser: typeof player2) {
    logTerminal(`🏆 ${winner.nick} wins tournament match`);

    createMatch(
      sanitizeMatch({
        p1_id: player.id,
        p2_id: player2.id,
        winner_id: winner.id,
        score_p1: player.score,
        score_p2: player2.score,
      }),
    );

    // 🔑 CONTRACT WITH TOURNAMENT VIEW
    sessionStorage.setItem(
      T_LAST_RESULT_KEY,
      JSON.stringify({ winner_id: winner.id }),
    );

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
  }

  loop();
}
