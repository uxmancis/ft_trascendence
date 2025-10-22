// src/game/setupPong.ts
import type { Diff } from './PlayAI';
import { createMatch, type NewMatch } from '../api';
import { getCurrentUser } from '../session';

export function setupPong() {
  const canvas = document.getElementById("pong_AI") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;

  const BOT_USER_ID = 0;

  let matchStartedAt = 0;
  let postedResult = false;

  // 🔢 Contadores internos para métricas
  let playerHits = 0; // tus toques
  let aiHits = 0;     // toques de la IA

  const paddleHeight = 80;
  const paddleWidth = 10;
  const ballRadius = 15;
  const scorepoints = 3;

  const ballImg = new Image();
  const backgroundGame = new Image();

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
  };

  const player = { x: 10, y: canvas.height/2 - paddleHeight/2, width: paddleWidth, height: paddleHeight, color: "white", dy: 3, score: 0 };
  const ai     = { x: canvas.width - paddleWidth - 10, y: canvas.height/2 - paddleHeight/2, width: paddleWidth, height: paddleHeight, color: "white", dy: 3, score: 0 };

  let ballSpeed = 4;
  const settings = JSON.parse(sessionStorage.getItem('ai:settings') || '{}');
  const difficulty: Diff = settings.difficulty || 'normal';

  ballImg.onload = () => { gameState.ballReady = true; };
  backgroundGame.onload = () => { gameState.backgroundReady = true; };

  if (difficulty === 'easy') {
    ballSpeed = 3;
    ballImg.src = new URL("/src/assets/customization/emunoz.jpg", import.meta.url).href;
    backgroundGame.src = new URL("/src/assets/customization/arcade1.jpg", import.meta.url).href;
  } else if (difficulty === 'normal') {
    ballSpeed = 4;
    ballImg.src = new URL("/src/assets/customization/uxmancis.jpg", import.meta.url).href;
    backgroundGame.src = new URL("/src/assets/customization/arcade3.jpg", import.meta.url).href;
  } else {
    ballSpeed = 6;
    ballImg.src = new URL("/src/assets/customization/ngastana.jpeg", import.meta.url).href;
    backgroundGame.src = new URL("/src/assets/customization/arcade4.jpg", import.meta.url).href;
  }

  const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: ballRadius,
    speed: ballSpeed,
    dx: Math.random() < 0.5 ? ballSpeed : -ballSpeed,
    dy: Math.random() < 0.5 ? ballSpeed : -ballSpeed,
    color: "white",
  };

  let gameStarted = false;

  function drawRect(x:number, y:number, w:number, h:number, color:string, bg?:HTMLImageElement){
    if (bg) ctx.drawImage(bg, x, y, w, h);
    else { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
  }
  function drawCircle(x:number, y:number, r:number, color:string, img?:HTMLImageElement){
    if (img){
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
      ctx.drawImage(img, x - r, y - r, r*2, r*2); ctx.restore();
    } else {
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2 * (Math.random()<0.5?-1:1));
      ctx.closePath(); ctx.fill();
    }
  }
  function drawText(text:string, x:number, y:number){ ctx.save(); ctx.fillStyle='white'; ctx.font='bold 48px "Orbitron", Entirely'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText(text, x, y); ctx.restore(); }

  function renderCountdown(){
    if (!gameState.countdownActive) return;
    ctx.drawImage(backgroundGame, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(33,34,35,0.6)"; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.textAlign="center"; ctx.shadowBlur=25; ctx.font="bold 90px 'Orbitron','Entirely','Audiowide',sans-serif";
    const text = gameState.countdownValue > 0 ? String(gameState.countdownValue) : "GO!";
    if (text === 'GO!') ctx.font = "bold 110px 'Orbitron','Entirely','Audiowide',sans-serif";
    ctx.fillStyle = "#FFFFFF"; ctx.fillText(text, canvas.width/2, canvas.height/2);
    ctx.shadowBlur = 0;
  }

  function startCountdown(){
    gameState.countdownActive = true;
    gameState.countdownValue = 3;
    gameState.winnerMessage = "";
    gameState.paused = true;
    if (gameState.countdownTimer) clearInterval(gameState.countdownTimer);
    gameState.countdownTimer = window.setInterval(() => {
      gameState.countdownValue--;
      if (gameState.countdownValue <= 0){
        clearInterval(gameState.countdownTimer!);
        gameState.countdownValue = 0;
        setTimeout(()=>{ gameState.countdownActive = false; gameState.paused = false; }, 500);
      }
    }, 1000);
  }

  document.addEventListener('keydown', (e) => {
    if (["ArrowUp","ArrowDown"].includes(e.key)) e.preventDefault();
    if (e.key === "ArrowUp") gameState.playerKeysUp = true;
    if (e.key === "ArrowDown") gameState.playerKeysDown = true;
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === "ArrowUp") gameState.playerKeysUp = false;
    if (e.key === "ArrowDown") gameState.playerKeysDown = false;
  });
  document.addEventListener('keydown', () => {
    if (gameState.playerKeysUp && !gameState.paused){ player.y = Math.max(0, player.y - player.dy*2); }
    if (gameState.playerKeysDown && !gameState.paused){ player.y = Math.min(canvas.height - player.height, player.y + player.dy*2); }
  });

  function resetCountersForNewGame(){
    playerHits = 0;
    aiHits = 0;
  }

  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    if (gameState.winnerMessage && !gameState.countdownActive){
      gameState.winnerMessage = "";
      postedResult = false;
      matchStartedAt = Date.now();
      resetCountersForNewGame();
      resetBall();
      startCountdown();
      ai.score = 0; player.score = 0;
      return;
    }
    if (!gameState.countdownActive && !gameState.winnerMessage){
      gameState.paused = !gameState.paused;
    }
  });

  canvas.addEventListener('click', () => {
    if (!gameStarted && !gameState.countdownActive){
      gameStarted = true;
      gameState.winnerMessage = "";
      postedResult = false;
      matchStartedAt = Date.now();
      resetCountersForNewGame();
      resetBall(true);
      startCountdown();
      ai.score = 0; player.score = 0;
      return;
    }
    if (gameState.winnerMessage && !gameState.countdownActive){
      gameState.winnerMessage = "";
      postedResult = false;
      matchStartedAt = Date.now();
      resetCountersForNewGame();
      resetBall();
      startCountdown();
      ai.score = 0; player.score = 0;
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
    ball.dx = 0; ball.dy = 0;
    ball.x = canvas.width/2; ball.y = canvas.height/2;
    const min = 40 * Math.PI/180, max = 55 * Math.PI/180;
    const angle = Math.random()*(max-min)+min;
    const dir = Math.random()<0.5?-1:1, vdir = Math.random()<0.5?-1:1;
    const delay = initial ? 0 : 1000;
    setTimeout(()=> ball.dx = dir * ball.speed * Math.cos(angle), delay);
    setTimeout(()=> ball.dy = vdir * ball.speed * Math.sin(angle), delay);
  }

  function computeAndLogAccuracies(goalsFor:number, goalsAgainst:number){
    const goalAttempts = Math.max(playerHits, 0);
    const goalAcc = goalAttempts > 0 ? goalsFor / goalAttempts : 0;

    const faced = Math.max(aiHits, 0);
    const saves = Math.max(faced - goalsAgainst, 0);
    const saveAcc = faced > 0 ? saves / faced : 0;

    console.log('[acc]', {
      playerHits, aiHits,
      goalsFor, goalsAgainst,
      shots_on_target_inc: goalAttempts,
      saves_inc: saves,
      goalAcc: Number(goalAcc.toFixed(3)),
      saveAcc: Number(saveAcc.toFixed(3)),
    });
  }

  async function postResultIfNeeded(winner: 'player' | 'ai'){
    if (postedResult) return;
    postedResult = true;

    const me = getCurrentUser();
    if (!me) return;

    const duration_seconds = Math.max(1, Math.round((Date.now() - matchStartedAt)/1000));

    // métricas para details
    const goalsFor = player.score;
    const goalsAgainst = ai.score;
    const shots_on_target_p1 = playerHits;
    const shots_on_target_p2 = aiHits;
    const saves_p1 = Math.max(aiHits - goalsAgainst, 0); // toques IA que NO acabaron en gol en tu contra
    const saves_p2 = Math.max(playerHits - goalsFor, 0); // toques tuyos que NO acabaron en gol para ti (paradas IA)

    const payload: NewMatch = {
      player1_id: me.id,
      player2_id: BOT_USER_ID,
      score_p1: player.score,
      score_p2: ai.score,
      winner_id: winner === 'player' ? me.id : BOT_USER_ID,
      duration_seconds,
      // 👇 nuevo: mandamos métricas por partido
      details: {
        shots_on_target_p1,
        saves_p1,
        shots_on_target_p2,
        saves_p2,
      }
    };

    try {
      const { id } = await createMatch(payload);
      console.log('[match] creado vs IA:', id, payload);
      // log de accuracies (informativo)
      computeAndLogAccuracies(goalsFor, goalsAgainst);
    } catch (err) {
      console.error('[match] error creando match vs IA', err);
    }
  }

  function updateAI(){
    const now = performance.now();
    let reactionErrorRange = 5;
    if (difficulty === 'easy') reactionErrorRange = 15;
    else if (difficulty === 'hard') reactionErrorRange = 0, (ai.height = 100);

    const reactionError = Math.random() * reactionErrorRange * 2 - reactionErrorRange;

    if (now - gameState.lastAiUpdate > 1000){
      gameState.lastAiUpdate = now;
      const aiCenter = ai.y + ai.height/2;
      const framesToReachAI = (canvas.width - ball.x) / ball.dx;
      const predicted = ball.y + ball.dy * framesToReachAI;

      let targetY = predicted;
      while (targetY < 0 || targetY > canvas.height) {
        if (targetY < 0) targetY = -targetY;
        if (targetY > canvas.height) targetY = 2*canvas.height - targetY;
      }
      targetY += reactionError;
      if (difficulty === 'easy') targetY *= 0.9 + Math.random()*0.2;

      if (aiCenter < targetY - 5){ gameState.aiKeysDown = true; gameState.aiKeysUp = false; }
      else if (aiCenter > targetY + 5){ gameState.aiKeysUp = true; gameState.aiKeysDown = false; }
      else { gameState.aiKeysUp = false; gameState.aiKeysDown = false; }
    }
    if (difficulty === 'hard'){
      if (ai.y + ai.height/2 < ball.y) ai.y += ai.dy; else ai.y -= ai.dy;
    } else if (gameState.aiKeysUp){
      ai.y = Math.max(0, ai.y - ai.dy);
    } else if (gameState.aiKeysDown){
      ai.y = Math.min(canvas.height - ai.height, ai.y + ai.dy);
    }
  }

  function update(){
    ball.x += ball.dx; ball.y += ball.dy;
    updateAI();

    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) ball.dy = -ball.dy;

    // Colisión con tu pala => cuenta TU toque
    if (collision(ball, player)){
      playerHits += 1;
      const impact = ball.y - player.y, third = player.height/25;
      ball.speed = Math.min(ball.speed + 0.1, 10);
      if ((impact < third && ball.dy > 0) || (impact > 24*third && ball.dy < 0)) { ball.dx = -ball.dx; ball.dy = -ball.dy; }
      else { ball.dx = -ball.dx; }
      ball.x = player.x + player.width + ball.radius;
    }

    // Colisión con la pala de la IA => cuenta toque de IA
    if (collision(ball, ai)){
      aiHits += 1;
      const impact = ball.y - ai.y, third = ai.height/25;
      ball.speed = Math.min(ball.speed + 0.1, 10);
      if ((impact < third && ball.dy > 0) || (impact > 24*third && ball.dy < 0)) { ball.dx = -ball.dx; ball.dy = -ball.dy; }
      else { ball.dx = -ball.dx; }
      ball.x = ai.x - ball.radius;
    }

    const me = getCurrentUser();
    if (!me) return;

    if (ball.x - ball.radius < 0) {
      ai.score++; ball.speed = ballSpeed;
      if (ai.score === scorepoints){
        gameState.paused = true;
        gameState.winnerMessage = `💀Sorry, you lose ${me.nick}☠️`;
        renderWinner();
        postResultIfNeeded('ai');
        resetBall();
        return;
      }
      resetBall();
    }
    if (ball.x + ball.radius > canvas.width) {
      player.score++; ball.speed = ballSpeed;
      if (player.score === scorepoints){
        gameState.paused = true;
        gameState.winnerMessage = `Congratulations ${me.nick},🫵you win!💫`;
        renderWinner();
        postResultIfNeeded('player');
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
      const blinkSpeed = 500, showText = Math.floor(Date.now()/blinkSpeed)%2===0;
      if (showText){ ctx.save(); ctx.translate(canvas.width/2, canvas.height/2); ctx.fillText(text, 0, 0); ctx.restore(); }
      return;
    }
    if (gameState.winnerMessage){ renderWinner(); return; }
    drawRect(0,0,canvas.width,canvas.height,"black", gameState.backgroundReady ? backgroundGame : undefined);
    drawRect(player.x, player.y, player.width, player.height, player.color);
    drawRect(ai.x, ai.y, ai.width, ai.height, ai.color);
    drawCircle(ball.x, ball.y, ball.radius, ball.color, gameState.ballReady ? ballImg : undefined);
    drawText(String(player.score), canvas.width/4, 30);
    drawText(String(ai.score), (3*canvas.width)/4, 30);
  }

  function renderWinner(){
    drawRect(0, 0, canvas.width, canvas.height, "black");
    ctx.textAlign = "center"; ctx.shadowBlur = 20;
    ctx.font = `bold 18px 'Entirely','Audiowide','Press Start 2P', sans-serif`; ctx.fillStyle="white";
    ctx.fillText(`Player: ${player.score} - AI: ${ai.score}`, canvas.width/2, canvas.height/2 - canvas.height/4);
    ctx.fillText(gameState.winnerMessage, canvas.width/2, canvas.height/2);
    ctx.shadowBlur = 0;
  }

  function game(){
    if (gameState.paused && gameStarted && !gameState.winnerMessage){
      ctx.save(); ctx.drawImage(backgroundGame,0,0,canvas.width,canvas.height);
      ctx.fillStyle="rgba(0,0,0,0.5)"; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.font="bold 80px 'Press Start 2P','Audiowide',sans-serif"; ctx.fillStyle="orange"; ctx.textAlign="center"; ctx.textBaseline="middle";
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
