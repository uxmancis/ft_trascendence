// src/game/setupPong.ts
import type { Diff } from './PlayAI';
import { createMatch, type NewMatch } from '../api';
import { getCurrentUser } from '../session';


// @ts-ignore
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
// @ts-ignore
import { AdvancedDynamicTexture, TextBlock, Rectangle } from '@babylonjs/gui';

type GameState = 'READY' | 'COUNTDOWN' | 'SERVE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export function setupPong() {
  const canvas = document.getElementById('pong_AI') as HTMLCanvasElement;
  if (!canvas) return;

  // --- Evitar doble inicialización ---
  if ((canvas as any)._pongAI3dBound) return;
  (canvas as any)._pongAI3dBound = true;

  // ===== Config & session =====
  const BOT_USER_ID = 0;
  const SCORE_TARGET = 5; // igual que 1v1

  const rect = canvas.getBoundingClientRect();
  const initialSizePx = { width: Math.round(rect.width), height: Math.round(rect.height) };
  const initialOverflow = {
    html: document.documentElement.style.overflow,
    body: document.body.style.overflow,
  };

  const settings = JSON.parse(sessionStorage.getItem('ai:settings') || '{}');
  const difficulty: Diff = settings.difficulty || 'normal';

  // IA ajustada (easy/normal ganables)
  const DIFF = {
    easy: {
      ballBase: 8.0, ballMax: 13.5, paddle: 11.0,
      aiMix: 0.88, thinkMs: 1000, reactErr: 14,
      stepMul: 0.90,
      unforcedMiss: 0.10,
      missAfterHits: 7,
    },
    normal: {
      ballBase: 9.5, ballMax: 16.0, paddle: 13.0,
      aiMix: 0.95, thinkMs: 1000, reactErr: 8,
      stepMul: 1.0,
      unforcedMiss: 0.04,
      missAfterHits: 12,
    },
    hard: {
      ballBase: 11.0, ballMax: 20.0, paddle: 15.5,
      aiMix: 1.00, thinkMs: 1000, reactErr: 0,
      stepMul: 1.2,
      unforcedMiss: 0.00,
      missAfterHits: 99,
    },
  }[difficulty];

  // ===== Fullscreen helpers =====
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
    engine.resize();
  }

  // ===== Engine & scene (Matrix look) =====
  const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: true });
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

  const glow = new BABYLON.GlowLayer('glow', scene, { blurKernelSize: 24 });
  glow.intensity = 0.6;

  const camera = new BABYLON.ArcRotateCamera('cam', -Math.PI / 2, Math.PI / 3, 33, new BABYLON.Vector3(0, 0, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerBetaLimit = 0.5; camera.upperBetaLimit = 1.05;
  camera.lowerRadiusLimit = 22; camera.upperRadiusLimit = 45;
  camera.panningSensibility = 0; camera.inertia = 0.85; camera.wheelPrecision = 60;

  new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);

  // ===== Campo =====
  const fieldW = 40, fieldH = 24;
  const table = BABYLON.MeshBuilder.CreateGround('table', { width: fieldW, height: fieldH }, scene);
  const tableMat = new BABYLON.StandardMaterial('tableMat', scene);
  tableMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
  tableMat.emissiveColor = new BABYLON.Color3(0.02, 0.35, 0.1);
  table.material = tableMat;

  const gridParent = new BABYLON.TransformNode('grid', scene);
  for (let x = -fieldW / 2; x <= fieldW / 2; x += 2) {
    const l = BABYLON.MeshBuilder.CreateLines('gx' + x, {
      points: [new BABYLON.Vector3(x, 0.01, -fieldH / 2), new BABYLON.Vector3(x, 0.01, fieldH / 2)]
    }, scene); l.color = new BABYLON.Color3(0.3, 1, 0.4); l.parent = gridParent;
  }
  for (let z = -fieldH / 2; z <= fieldH / 2; z += 2) {
    const l = BABYLON.MeshBuilder.CreateLines('gz' + z, {
      points: [new BABYLON.Vector3(-fieldW / 2, 0.01, z), new BABYLON.Vector3(fieldW / 2, 0.01, z)]
    }, scene); l.color = new BABYLON.Color3(0.3, 1, 0.4); l.parent = gridParent;
  }
  const centerLine = BABYLON.MeshBuilder.CreateLines('center', {
    points: [new BABYLON.Vector3(0, 0.02, -fieldH / 2), new BABYLON.Vector3(0, 0.02, fieldH / 2)]
  }, scene); centerLine.color = new BABYLON.Color3(0.6, 1, 0.6);

  // ===== Palas & bola =====
  const paddleW = 0.9, paddleH = 4.0, paddleD = 0.6;
  const p1Mat = new BABYLON.StandardMaterial('p1Mat', scene); p1Mat.emissiveColor = new BABYLON.Color3(0.2, 1, 0.4);
  const aiMat = new BABYLON.StandardMaterial('aiMat', scene); aiMat.emissiveColor = new BABYLON.Color3(0.2, 0.8, 1);

  const p1 = BABYLON.MeshBuilder.CreateBox('p1', { width: paddleW, height: paddleD, depth: paddleH }, scene);
  p1.position.set(-fieldW / 2 + 2, 0.4, 0); p1.material = p1Mat;

  const ai = p1.clone('ai')!; ai.material = aiMat; ai.position.set(fieldW / 2 - 2, 0.4, 0);

  const ballR = 0.6;
  const ball = BABYLON.MeshBuilder.CreateSphere('ball', { diameter: ballR * 2, segments: 24 }, scene);
  ball.position.set(0, 0.6, 0);
  const ballMat = new BABYLON.StandardMaterial('ballMat', scene);
  ballMat.emissiveColor = new BABYLON.Color3(0.6, 1, 0.7); ball.material = ballMat;

  const trail = new BABYLON.ParticleSystem('trail', 250, scene);
  trail.emitter = ball;
  trail.particleTexture = new BABYLON.Texture('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVQoU2NkYGD4z0AEMDEwMDAAAGkMAc3b8wq0AAAAAElFTkSuQmCC', scene);
  trail.minEmitBox = new BABYLON.Vector3(-0.05, -0.05, -0.05);
  trail.maxEmitBox = new BABYLON.Vector3(0.05, 0.05, 0.05);
  trail.color1 = new BABYLON.Color4(0.2, 1, 0.4, 0.9);
  trail.color2 = new BABYLON.Color4(0.2, 1, 0.6, 0.4);
  trail.minSize = 0.05; trail.maxSize = 0.15;
  trail.minLifeTime = 0.15; trail.maxLifeTime = 0.35;
  trail.emitRate = 250; trail.start();

  // ===== Límites y planos de gol =====
  const bounds = {
    left: -fieldW / 2 + 0.6,
    right: fieldW / 2 - 0.6,
    top: -fieldH / 2 + 0.6,
    bottom: fieldH / 2 - 0.6,
  };

  // ===== HUD =====
  const gui = AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);
  const me = getCurrentUser();
  const p1Nick = me?.nick ?? 'You';
  const aiNick = `AI (${difficulty.toUpperCase()})`;

  const nameL = new TextBlock('nameL', p1Nick); nameL.color = '#9cff9c'; nameL.fontSize = 18; nameL.left = '-30%'; nameL.top = '-48%'; gui.addControl(nameL);
  const nameR = new TextBlock('nameR', aiNick);  nameR.color = '#9cd3ff'; nameR.fontSize = 18; nameR.left = '30%';  nameR.top = '-48%'; gui.addControl(nameR);

  const scoreP = new TextBlock('scoreP', '0');   scoreP.color = 'white'; scoreP.fontSize = 44; scoreP.left = '-30%'; scoreP.top = '-42%'; gui.addControl(scoreP);
  const scoreAI = new TextBlock('scoreAI', '0'); scoreAI.color = 'white'; scoreAI.fontSize = 44; scoreAI.left =  '30%'; scoreAI.top = '-42%'; gui.addControl(scoreAI);

  const banner = new TextBlock('banner', ''); banner.color = '#ffaa3bff'; banner.fontSize = 56; banner.outlineColor = '#134d1f'; banner.outlineWidth = 2;
  banner.fontFamily = "'Press Start 2P', 'Audiowide', sans-serif";
  banner.fontSize = 60;
  banner.fontWeight = "bold";
  banner.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
  banner.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_CENTER;
  gui.addControl(banner);

  const help = new Rectangle('help');
  help.thickness = 0; help.background = 'rgba(0,0,0,0.35)'; help.width = '64%'; help.height = '22%'; help.top = '30%'; help.cornerRadius = 10; gui.addControl(help);
  const helpText = new TextBlock('helpText',
    'Controls:\nPlayer: W (up) / S (down)  •  Start/Pause: Space  •  Fullscreen: Click');
  helpText.color = 'white'; helpText.fontSize = 20; helpText.textWrapping = true; help.addControl(helpText);
  const hint = new TextBlock('hint', '[ CLICK TO START — ENTERS FULLSCREEN ]'); hint.color = 'white'; hint.fontSize = 22; hint.top = '40%'; gui.addControl(hint);

  // ===== Estado & métricas =====
  let state: GameState = 'READY';
  let pScore = 0, aScore = 0;
  let postedResult = 0;
  let matchStartedAt = 0;

  let playerHits = 0, aiHits = 0, rallyHits = 0;

  // ===== Física =====
  const paddleSpeed = DIFF.paddle;
  const ballBaseSpeed = DIFF.ballBase;
  const ballMaxSpeed = DIFF.ballMax;
  const spinFactor = 0.55;
  const paddleVelInfluence = 0.35;
  const wallFriction = 0.98;

  let ballVel = new BABYLON.Vector3(ballBaseSpeed, 0, ballBaseSpeed * 0.6);
  let collideCooldown = 0;

  // ===== IA (PD + EMA + errores controlados) =====
  let aiVelZ = 1; //velocidad actual de la pala IA
  
  const AI_CTL = {
    kP: 6.0, kD: 2.0, emaAlpha: 0.3, //cuanto suavizado hay emaAlpha
    maxSpeed: paddleSpeed * DIFF.stepMul,
    homeZ: 0,
  };

  function clampZ(z: number) {
    return Math.min(bounds.bottom - paddleH / 2, Math.max(bounds.top + paddleH / 2, z));
  }

  //Predicción del punto exacto donde la IA se coloca
  function predictTargetZ(): number | null {
     // Copia el estado actual
    let px = ball.position.x;
    let pz = ball.position.z;
    let vx = ballVel.x;
    let vz = ballVel.z;
    if (vx <= 0) return(null);
    const dt = 0.016;   // 60fps
    const wallTop = fieldH/2;
    const wallBottom = -fieldH/2;

    // Simulación hacia adelante
    while (px <= ai.position.x) {
        // Avanzas
        px += vx * dt;
        pz += vz * dt;

        // Rebote en paredes
        if (pz <= wallBottom) { pz = wallBottom; vz *= -1; }
        if (pz >= wallTop)    { pz = wallTop;    vz *= -1; }
    }
    return pz;
  }

  let aiTargetZ = 0;
    
  function aiStep(dt: number) {

    const raw = predictTargetZ();
    if (raw === null){
        aiTargetZ = ai.position.z * 0.2 + AI_CTL.homeZ * 0.8;
        aiVelZ *= 0.2;}
    else{
        aiTargetZ = raw;
        aiVelZ = AI_CTL.kP * (aiTargetZ - ai.position.z);}
     let error = aiTargetZ - ai.position.z;
    if (difficulty === 'easy') {
      error += (Math.random() - 0.5) * DIFF.reactErr; 
    }
     aiVelZ = AI_CTL.kP * error;
     if (aiVelZ >  AI_CTL.maxSpeed) aiVelZ =  AI_CTL.maxSpeed;
     if (aiVelZ < -AI_CTL.maxSpeed) aiVelZ = -AI_CTL.maxSpeed;
    console.log("aiVelz=", aiVelZ);
  }

  // ===== Colisiones (robustas) =====
  function reflect(v: BABYLON.Vector3, normal: BABYLON.Vector3) {
    const dot = BABYLON.Vector3.Dot(v, normal);
    return v.subtract(normal.scale(2 * dot));
  }

  function resolvePaddleCollision(paddle: BABYLON.Mesh, leftSide: boolean, dt: number): boolean {
    // Solo si la bola va hacia la pala correspondiente
    if (leftSide && ballVel.x >= 0) return false;
    if (!leftSide && ballVel.x <= 0) return false;

    const px = paddle.position.x, pz = paddle.position.z;
    const hx = paddleW / 2, hz = paddleH / 2;

    // Rechazo rápido por X para evitar sensación de "pared"
    const targetX = px + (leftSide ? (hx + ballR) : -(hx + ballR));
    if (leftSide && ball.position.x > targetX + 0.2) return false;
    if (!leftSide && ball.position.x < targetX - 0.2) return false;

    // AABB en XZ
    const cx = Math.max(px - hx, Math.min(ball.position.x, px + hx));
    const cz = Math.max(pz - hz, Math.min(ball.position.z, pz + hz));
    const dx = ball.position.x - cx;
    const dz = ball.position.z - cz;
    const dist2 = dx * dx + dz * dz;
    if (dist2 > ballR * ballR) return false;

    // Cara dominante (X o Z)
    let nx = 0, nz = 0;
    const penX = (hx + ballR) - Math.abs(ball.position.x - px);
    const penZ = (hz + ballR) - Math.abs(ball.position.z - pz);

    if (penX <= penZ) {
      nx = (ball.position.x < px) ? -1 : 1; nz = 0;
      ball.position.x = px + (nx * (hx + ballR + 0.01));
    } else {
      nz = (ball.position.z < pz) ? -1 : 1; nx = 0;
      ball.position.z = pz + (nz * (hz + ballR + 0.01));
    }

    // Spin + influencia del movimiento de la pala (jugador o IA)
    const relZ = (ball.position.z - pz) / (paddleH / 2);
    const aimZ = Math.max(-1, Math.min(1, relZ)) * spinFactor;


    const infZ = (paddleSpeed * dt) * paddleVelInfluence;

    const n = new BABYLON.Vector3(nx, 0, nz).add(new BABYLON.Vector3(0, 0, aimZ + infZ)).normalize();
    ballVel = reflect(ballVel, n);
    const minAfter = Math.max(ballVel.length(), ballBaseSpeed * 0.95);
    const speed = Math.min(minAfter + 0.5, ballMaxSpeed);
    ballVel = ballVel.normalize().scale(speed);

    collideCooldown = 0.05;
    rallyHits += 1;
    return true;
  }

  // ===== Flow helpers =====
  function showPause(msg = '⏸️ PAUSE', sub = 'Press Space to continue') {
    banner.text = msg; hint.text = sub; help.isVisible = true; trail.emitRate = 80;
  }
  function hidePause() {
    banner.text = ''; hint.text = ''; help.isVisible = false; trail.emitRate = 250;
  }
  function startCountdown(n: number) {
    state = 'COUNTDOWN';
    return new Promise<void>((resolve) => {
      let v = n; banner.text = String(v); hint.text = '';
      const iv = setInterval(() => {
        v -= 1;
        banner.text = v > 0 ? String(v) : 'GO!';
        if (v < 0) { clearInterval(iv); resolve(); }
      }, 1000);
    });
  }
  function centerBall() { ball.position.set(0, 0.6, 0); }
  function serve(initial = false) {
    const dirX = Math.random() < 0.5 ? -1 : 1;
    const dirZ = Math.random() < 0.5 ? -1 : 1;
    const speed = initial ? ballBaseSpeed : Math.min(ballBaseSpeed + 1.0, ballMaxSpeed);
    ballVel.set(dirX * speed, 0, dirZ * speed * 0.75);
    collideCooldown = 0;
    rallyHits = 0;
  }
  function startRally(withCountdown: boolean, initialServe = false) {
    centerBall(); serve(initialServe);
    if (withCountdown) {
      startCountdown(3).then(() => { state = 'PLAYING'; hidePause(); });
    } else {
      state = 'PLAYING'; hidePause();
    }
  }

  function startNewGame() {
    pScore = 0; aScore = 0; scoreP.text = '0'; scoreAI.text = '0';
    playerHits = 0; aiHits = 0; rallyHits = 0;
    postedResult = 0; matchStartedAt = Date.now();
    hint.text = ''; help.isVisible = true; banner.text = '3';
    state = 'READY';
    startRally(true, true);
  }

  function postResultIfNeeded(playerWon: boolean) {
    if (postedResult) return; postedResult = 1;
    const meNow = getCurrentUser(); if (!meNow) return;

    const duration_seconds = Math.max(1, Math.round((Date.now() - matchStartedAt) / 1000));
    const payload: NewMatch = {
      player1_id: meNow.id,
      player2_id: BOT_USER_ID,
      score_p1: pScore,
      score_p2: aScore,
      winner_id: playerWon ? meNow.id : BOT_USER_ID,
      duration_seconds,
      details: {
        mode: 'ai-3d',
        difficulty,
        shots_on_target_p1: playerHits,
        shots_on_target_p2: aiHits,
        saves_p1: Math.max(aiHits - aScore, 0),
        saves_p2: Math.max(playerHits - pScore, 0),
      } as any,
    };
    createMatch(payload).catch(err => console.error('[match] error AI 3D', err));
  }

  function checkVictory(): boolean {
    if (pScore >= SCORE_TARGET || aScore >= SCORE_TARGET) {
      const playerWon = pScore > aScore;
      state = 'GAMEOVER';
      banner.text = playerWon ? '💫 You win! 🏆' : '💀 You lose ☠️';
      hint.text = 'Click or Space to start a new game';
      help.isVisible = true;
      postResultIfNeeded(playerWon);
      return true;
    }
    return false;
  }

  function checkGoal(): boolean {
  // Gol AI (bola cruzando lado izquierdo)
    if (ball.position.x - ballR <= bounds.left && ball.position.z >= bounds.top && ball.position.z <= bounds.bottom) {
      scorePoint(false);
      return true;
    }
  // Gol Player (bola cruzando lado derecho)
    if (ball.position.x + ballR >= bounds.right && ball.position.z >= bounds.top && ball.position.z <= bounds.bottom) {
      scorePoint(true);
      return true;
    }
    return false;
  }

  function scorePoint(byPlayer: boolean) {
    if (state !== 'PLAYING') return;
    state = 'SERVE'; // bloquea inmediatamente

    if (byPlayer) { pScore++; scoreP.text = String(pScore); }
    else { aScore++; scoreAI.text = String(aScore); }

    if (checkVictory()) return;

    banner.text = 'GO!'; centerBall(); serve(false);
    setTimeout(() => startCountdown(3).then(() => { banner.text = ''; state = 'PLAYING'; }), 200);
  }

  // ===== Input =====
  const keys: Record<string, boolean> = { w: false, s: false, ArrowUp: false, ArrowDown: false };
  
    // === AI keyboard simulation helpers ===
  function dispatchKeyDown(key: string) {
    // dispatch event to trigger onKeyDown (which updates keys[])
    const ev = new KeyboardEvent('keydown', { key });
    window.dispatchEvent(ev);
  }
  function dispatchKeyUp(key: string) {
    const ev = new KeyboardEvent('keyup', { key });
    window.dispatchEvent(ev);
  }

  // small helper to avoid spam de eventos: mantiene el estado local
  const aiKeyState = { up: false, down: false };
  function aiPressDirection(dir: number) {
    // dir > 0 -> move "up" (ArrowUp). dir < 0 -> move "down" (ArrowDown). dir == 0 -> release both
    console.log("dir=", dir);
    const thr = difficulty === 'hard' ? 0.05 : 0.2;
    if (dir > thr) {
      if (!aiKeyState.up) { dispatchKeyDown('ArrowUp'); aiKeyState.up = true; }
      if (aiKeyState.down) { dispatchKeyUp('ArrowDown'); aiKeyState.down = false; }
    } else if (dir < -thr) {
      if (!aiKeyState.down) { dispatchKeyDown('ArrowDown'); aiKeyState.down = true; }
      if (aiKeyState.up) { dispatchKeyUp('ArrowUp'); aiKeyState.up = false; }
    } else {
      if (aiKeyState.up)    { dispatchKeyUp('ArrowUp'); aiKeyState.up = false; }
      if (aiKeyState.down)  { dispatchKeyUp('ArrowDown'); aiKeyState.down = false; }
    }
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key in keys) { keys[e.key] = true; e.preventDefault(); }
    if (e.key === 'Escape') { if (isFullscreen()) exitFullscreen(); if (state === 'PLAYING') { state = 'PAUSED'; showPause(); } }
    if (e.code === 'Space') {
      if (state === 'GAMEOVER') { startNewGame(); return; }
      if (state === 'PAUSED')   { state = 'PLAYING'; hidePause(); return; }
      if (state === 'PLAYING')  { state = 'PAUSED'; showPause(); return; }
      if (state === 'READY')    { startNewGame(); return; }
    }
  };
  const onKeyUp = (e: KeyboardEvent) => { if (e.key in keys) keys[e.key] = false; };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  canvas.addEventListener('click', () => {
    if (!isFullscreen()) { enterFullscreen(canvas); applyCanvasFullscreenStyle(true); }
    if (state === 'READY' || state === 'GAMEOVER') { startNewGame(); return; }
    if (state === 'PLAYING') { state = 'PAUSED'; showPause(); return; }
    if (state === 'PAUSED')  { state = 'PLAYING'; hidePause(); return; }
  });
  document.addEventListener('fullscreenchange', () => {
    const active = isFullscreen();
    applyCanvasFullscreenStyle(active);
    if (!active && state === 'PLAYING') { state = 'PAUSED'; showPause(); }
  });

  // ===== Game loop (sub-steps + colisiones robustas + gol por cruce) =====
  const lastAIThink = { t: 0 };
  engine.runRenderLoop(() => {
    const dtMs = Math.min(engine.getDeltaTime(), 50);
    const dt = dtMs / 1000;

    if (collideCooldown > 0) collideCooldown = Math.max(0, collideCooldown - dt);

    if (state === 'PLAYING') {
      // Jugador (up=z- ; down=z+)
      if (keys.s) p1.position.z = clampZ(p1.position.z - paddleSpeed * dt);
      if (keys.w) p1.position.z = clampZ(p1.position.z + paddleSpeed * dt);

      const now = performance.now();
      if (now - lastAIThink.t >= DIFF.thinkMs) {
        aiStep(dt); 
        lastAIThink.t = now;
      } 
      aiPressDirection(aiVelZ);

      // MOVER la pala de la IA *solo* si las teclas ArrowUp/ArrowDown están activas
      if (aiKeyState.up)   ai.position.z = clampZ(ai.position.z + aiVelZ * dt);
      if (aiKeyState.down) ai.position.z = clampZ(ai.position.z + aiVelZ * dt);

      // Sub-steps anti-túnel
      const speed = ballVel.length();
      const steps = Math.min(6, Math.max(1, Math.ceil(speed / 8)));
      const subDt = dt / steps;

      for (let s = 0; s < steps && state === 'PLAYING'; s++) {
        // mover bola
        ball.position.x += ballVel.x * subDt;
        ball.position.z += ballVel.z * subDt;

        // paredes Z
        if (ball.position.z < bounds.top + ballR) {
          ball.position.z = bounds.top + ballR; ballVel.z *= -1; ballVel.z *= wallFriction;
        } else if (ball.position.z > bounds.bottom - ballR) {
          ball.position.z = bounds.bottom - ballR; ballVel.z *= -1; ballVel.z *= wallFriction;
        }

        // colisiones con palas
        if (collideCooldown <= 0) {
          if (resolvePaddleCollision(p1, true, subDt)) { playerHits += 1; }
          else if (resolvePaddleCollision(ai, false, subDt)) { aiHits += 1; }
        }

        if (checkGoal()) break;
      }
    }

    scene.render();
  });

  window.addEventListener('resize', () => engine.resize());
}

