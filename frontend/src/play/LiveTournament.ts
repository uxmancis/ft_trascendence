// src/game/setupLivePong.ts
import { createMatch, type NewMatch } from '../api';
import { getCurrentUser, getLocalP2 } from '../session';

export function setupTournamentPong() {
  const canvas = document.getElementById("live_pong") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;

  const paddleHeight = 80;
  const paddleWidth = 10;
  const ballRadius = 15;
  const scorepoints = 3;

  const ballImg = new Image();
  const backgroundGame = new Image();

  // ───────── NUEVO: contadores + control post ─────────
  let p1Hits = 0;
  let p2Hits = 0;
  let postedResult = false;
  let matchStartedAt = 0;
  // ────────────────────────────────────────────────────

  const gameState = {
    countdownActive: false,
    countdownValue: 3,
    countdownTimer: null as number | null,
    paused: true,
    winnerMessage: "",
    playerKeysUp: false,
    playerKeysDown: false,
    aiKeysUp: false,
    aiKeysDown: false,
    ballReady: false,
    backgroundReady: false,
    lastAiUpdate: 0,
    playerTwoKeysUp: false,
    playerTwoKeysDown: false,
    playerThreeLeft: false,
    playerThreeRight: false,
    playerFourLeft: false,
    playerFourRight: false,
  };

  const player = { x: 10, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, color: "white", dy: 3, score: 0 };
  const player2 = { x: canvas.width - paddleWidth - 10, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, color: "white", dy: 3, score: 0 };

  const ball = { x: canvas.width / 2, y: canvas.height / 2, radius: ballRadius, speed: 5, dx: 4, dy: 4, color: "red" };

  let gameStarted = false;

  ballImg.onload = () => { gameState.ballReady = true; };
  ballImg.src = new URL("/src/assets/customization/soccer.png", import.meta.url).href;

  backgroundGame.onload = () => { gameState.backgroundReady = true; };
  backgroundGame.src = new URL("/src/assets/customization/field.png", import.meta.url).href;

  function drawRect(x:number,y:number,w:number,h:number,color:string,bg?:HTMLImageElement){
    if (bg) ctx.drawImage(bg, x, y, w, h);
    else { ctx.fillStyle = color; ctx.fillRect(x,y,w,h); }
  }
  function drawCircle(x:number,y:number,r:number,color:string,img?:HTMLImageElement){
    if (img){ ctx.save(); ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.closePath(); ctx.clip(); ctx.drawImage(img, x-r, y-r, r*2, r*2); ctx.restore(); }
    else { ctx.fillStyle=color; ctx.beginPath(); const direction = Math.random()<0.5?-1:1; ctx.arc(x,y,r,0,Math.PI*2*direction); ctx.closePath(); ctx.fill(); }
  }
  function drawText(text:string,x:number,y:number){ ctx.save(); ctx.fillStyle='white'; ctx.font='bold 48px "Orbitron", Entirely'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText(text,x,y); ctx.restore(); }

  function renderCountdown(){ /* igual que en tu versión */ }
  function startCountdown(){ /* igual que en tu versión */ }

  document.addEventListener("keydown", (e) => {
    if (["ArrowUp","ArrowDown"].includes(e.key)) e.preventDefault();
    if (e.key === "ArrowUp") gameState.playerTwoKeysUp = true;
    if (e.key === "ArrowDown") gameState.playerTwoKeysDown = true;
    if (e.key === "w") gameState.playerKeysUp = true;
    if (e.key === "s") gameState.playerKeysDown = true;
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowUp") gameState.playerTwoKeysUp = false;
    if (e.key === "ArrowDown") gameState.playerTwoKeysDown = false;
    if (e.key === "w") gameState.playerKeysUp = false;
    if (e.key === "s") gameState.playerKeysDown = false;
  });
  document.addEventListener("keydown", () => {
    if (gameState.playerKeysUp && !gameState.paused) { player.y = Math.max(0, player.y - player.dy*2); }
    if (gameState.playerKeysDown && !gameState.paused){ player.y = Math.min(canvas.height - player.height, player.y + player.dy*2); }
    if (gameState.playerTwoKeysUp && !gameState.paused) { player2.y = Math.max(0, player2.y - player2.dy*2); }
    if (gameState.playerTwoKeysDown && !gameState.paused){ player2.y = Math.min(canvas.height - player2.height, player2.y + player2.dy*2); }
  });

  document.addEventListener("keydown", (e) => {
    if (e.code !== "Space") return;
    if (gameState.winnerMessage && !gameState.countdownActive){
      gameState.winnerMessage = "";
      // reinicio control POST + contadores
      postedResult = false; matchStartedAt = Date.now(); p1Hits = 0; p2Hits = 0;
      resetBall();
      startCountdown();
      player.score = 0; player2.score = 0;
      return;
    }
    if (!gameState.countdownActive && !gameState.winnerMessage){
      gameState.paused = !gameState.paused;
    }
  });

  canvas.addEventListener("click", () => {
    if (!gameStarted && !gameState.countdownActive){
      gameStarted = true;
      gameState.winnerMessage = "";
      postedResult = false; matchStartedAt = Date.now(); p1Hits = 0; p2Hits = 0;
      resetBall(true);
      startCountdown();
      player.score = 0; player2.score = 0;
      return;
    }
    if (gameState.winnerMessage && !gameState.countdownActive){
      gameState.winnerMessage = "";
      postedResult = false; matchStartedAt = Date.now(); p1Hits = 0; p2Hits = 0;
      resetBall();
      startCountdown();
      player.score = 0; player2.score = 0;
      return;
    }
    if (gameStarted && !gameState.countdownActive && !gameState.winnerMessage){
      gameState.paused = !gameState.paused;
    }
  });

  function collision(_ball:typeof ball, paddle:typeof player){
    return (_ball.x - _ball.radius < paddle.x + paddle.width &&
            _ball.x + _ball.radius > paddle.x &&
            _ball.y - _ball.radius < paddle.y + paddle.height &&
            _ball.y + _ball.radius > paddle.y);
  }

  function resetBall(initial=false){
    ball.dx = 0; ball.dy = 0; ball.x = canvas.width/2; ball.y = canvas.height/2;
    const min = 40*(Math.PI/180), max = 55*(Math.PI/180); const angle = Math.random()*(max-min)+min;
    const dir = Math.random()<0.5?-1:1, vdir = Math.random()<0.5?-1:1; const delay = initial?0:1000;
    setTimeout(()=> ball.dx = dir * ball.speed * Math.cos(angle), delay);
    setTimeout(()=> ball.dy = vdir * ball.speed * Math.sin(angle), delay);
  }

  function renderWinner(){
    drawRect(0,0,canvas.width,canvas.height,"black");
    ctx.textAlign="center"; ctx.shadowBlur=20;
    ctx.font=`bold 18px 'Entirely','Audiowide','Press Start 2P', sans-serif`; ctx.fillStyle="white";
    ctx.fillText(`Player: ${player.score} - Player 2: ${player2.score}`, canvas.width/2, canvas.height/2 - canvas.height/4);
    ctx.fillText(gameState.winnerMessage, canvas.width/2, canvas.height/2);
    ctx.font=`bold 16px 'Entirely','Audiowide','Press Start 2P', sans-serif`;
    ctx.fillText("Press Space or click to start a new game", canvas.width/2, canvas.height/2 + canvas.height/4);
    ctx.shadowBlur = 0;
  }

  function update(){
    ball.x += ball.dx; ball.y += ball.dy;

    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
      ball.dy = -ball.dy;
    }

    if (collision(ball, player)){
      p1Hits += 1; // NUEVO
      let impact = ball.y - player.y, third = player.height/25;
      ball.speed = Math.min(ball.speed + 0.1, 10);
      if ((impact<third && ball.dy>0) || (impact>24*third && ball.dy<0)){ ball.dx=-ball.dx; ball.dy=-ball.dy; }
      else { ball.dx = -ball.dx; }
      ball.x = player.x + player.width + ball.radius;
    }
    if (collision(ball, player2)){
      p2Hits += 1; // NUEVO
      let impact = ball.y - player2.y, third = player2.height/25;
      ball.speed = Math.min(ball.speed + 0.1, 10);
      if ((impact<third && ball.dy>0) || (impact>24*third && ball.dy<0)){ ball.dx=-ball.dx; ball.dy=-ball.dy; }
      else { ball.dx = -ball.dx; }
      ball.x = player2.x - ball.radius;
    }

    const user = getCurrentUser();
    if (!user) return;

    if (ball.x - ball.radius < 0){
      player2.score++; ball.speed = 5;
      if (player2.score === scorepoints){
        gameState.winnerMessage = `Player2 has win!🎉`;
        gameState.paused = true;
        renderWinner();

        // ───────── POST inline 1v1 (sin helpers nuevos) ─────────
        if (!postedResult) {
          postedResult = true;
          const p2 = getLocalP2?.();
          if (p2) {
            const duration_seconds = Math.max(1, Math.round((Date.now() - matchStartedAt)/1000));
            const score_p1 = player.score;
            const score_p2 = player2.score;

            const shots_on_target_p1 = p1Hits;
            const shots_on_target_p2 = p2Hits;
            const saves_p1 = Math.max(p2Hits - score_p2, 0);
            const saves_p2 = Math.max(p1Hits - score_p1, 0);

            const payload: NewMatch = {
              player1_id: user.id,
              player2_id: p2.id,
              score_p1, score_p2,
              winner_id: p2.id,
              duration_seconds,
              details: { shots_on_target_p1, saves_p1, shots_on_target_p2, saves_p2 } as any
            };

            createMatch(payload)
              .then(({ id }) => console.log('[match] 1v1 creado:', id, payload))
              .catch(err => console.error('[match] error 1v1', err));
          }
        }
        // ────────────────────────────────────────────────────────

        resetBall();
        return;
      }
      resetBall();
    }

    if (ball.x + ball.radius > canvas.width){
      player.score++; ball.speed = 5;
      if (player.score === scorepoints){
        gameState.winnerMessage = `💫 ${user.nick} wins! 🏆`;
        gameState.paused = true;
        renderWinner();

        if (!postedResult) {
          postedResult = true;
          const p2 = getLocalP2?.();
          if (p2) {
            const duration_seconds = Math.max(1, Math.round((Date.now() - matchStartedAt)/1000));
            const score_p1 = player.score;
            const score_p2 = player2.score;

            const shots_on_target_p1 = p1Hits;
            const shots_on_target_p2 = p2Hits;
            const saves_p1 = Math.max(p2Hits - score_p2, 0);
            const saves_p2 = Math.max(p1Hits - score_p1, 0);

            const payload: NewMatch = {
              player1_id: user.id,
              player2_id: p2.id,
              score_p1, score_p2,
              winner_id: user.id,
              duration_seconds,
              details: { shots_on_target_p1, saves_p1, shots_on_target_p2, saves_p2 } as any
            };

            createMatch(payload)
              .then(({ id }) => console.log('[match] 1v1 creado:', id, payload))
              .catch(err => console.error('[match] error 1v1', err));
          }
        }

        resetBall();
        return;
      }
      resetBall();
    }
  }

  function render(){
    if (!gameStarted && !gameState.countdownActive){
      drawRect(0,0,canvas.width,canvas.height,"black");
      const text = "[ PRESS TO START PONG 🎮 ]";
      ctx.fillStyle="white"; ctx.font="30px 'Press Start 2P', sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
      const show = Math.floor(Date.now()/500)%2===0;
      if (show){ ctx.save(); ctx.translate(canvas.width/2, canvas.height/2); ctx.fillText(text,0,0); ctx.restore(); }
      return;
    }
    if (gameState.winnerMessage){ renderWinner(); return; }

    drawRect(0,0,canvas.width,canvas.height,"black", gameState.backgroundReady ? backgroundGame : undefined);
    drawRect(player.x, player.y, player.width, player.height, player.color);
    drawRect(player2.x, player2.y, player2.width, player2.height, player2.color);
    drawCircle(ball.x, ball.y, ball.radius, ball.color, gameState.ballReady ? ballImg : undefined);
    drawText(String(player.score), canvas.width/4, 30);
    drawText(String(player2.score), (3*canvas.width)/4, 30);
  }

  function game(){
    if (gameState.paused && gameStarted && !gameState.winnerMessage){
      ctx.save();
      ctx.drawImage(backgroundGame,0,0,canvas.width,canvas.height);
      ctx.fillStyle="rgba(0,0,0,0.5)"; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.font="bold 80px 'Press Start 2P','Audiowide',sans-serif"; ctx.fillStyle="orange"; ctx.textAlign="center";
      ctx.fillText("⏸️ PAUSE", canvas.width/2, canvas.height/2 - 40);
      ctx.font="20px 'Press Start 2P','Audiowide',sans-serif"; ctx.fillStyle="white";
      ctx.fillText("▶ CLICK THE SCREEN", canvas.width/2, canvas.height/2 + 70);
      ctx.fillText("OR PRESS [SPACE] TO CONTINUE ◀", canvas.width/2, canvas.height/2 + 100);
      ctx.restore();
    }
    if (gameState.paused && !gameStarted && !gameState.countdownActive) render();
    if (!gameState.paused){ update(); render(); }
    renderCountdown();
  }

  setInterval(game, 1000/60);
}
