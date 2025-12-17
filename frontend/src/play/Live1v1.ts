// src/game/setupLivePong3D.ts
import { createMatch, type NewMatch } from '../api';
import { getCurrentUser, getLocalP2 } from '../session';

// suppress missing type declarations in this environment
// @ts-ignore
import * as BABYLON from '@babylonjs/core';
// @ts-ignore
import '@babylonjs/loaders';
// @ts-ignore
import { AdvancedDynamicTexture, TextBlock, Rectangle } from '@babylonjs/gui';

type GameState = 'READY' | 'COUNTDOWN' | 'SERVE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

// ===== Claves de torneo (sólo sesión, no se toca el usuario principal) =====
const T_MODE_KEY = 'tournament:mode';                  // '1' si el partido pertenece al torneo
const T_MATCH_PLAYERS_KEY = 'tournament:matchPlayers'; // { p1: {id,nick,avatar?}, p2: {...} }
const T_LAST_RESULT_KEY = 'tournament:lastResult';     // payload mínimo que recoje el organizador

export function setupLivePong3D() {
  const canvas = document.getElementById('live_pong') as HTMLCanvasElement;
  if (!canvas) return;

  // --- Evitar doble inicialización (doble bucle/render) ---
  if ((canvas as any)._pong3dBound) return;
  (canvas as any)._pong3dBound = true;

  // ===== UI/FS restore =====
  const rect = canvas.getBoundingClientRect();
  const initialSizePx = { width: Math.round(rect.width), height: Math.round(rect.height) };
  const initialOverflow = {
    html: document.documentElement.style.overflow,
    body: document.body.style.overflow,
  };

  // ===== Players (modo normal vs modo torneo) =====
  const isTournament = sessionStorage.getItem(T_MODE_KEY) === '1';
  let p1Id: number, p2Id: number, p1Nick: string, p2Nick: string;

  if (isTournament) {
    // Leer jugadores del match actual SIN tocar tu usuario principal
    const raw = sessionStorage.getItem(T_MATCH_PLAYERS_KEY);
    if (raw) {
      try {
        const mp = JSON.parse(raw);
        p1Id = Number(mp?.p1?.id ?? 1);
        p2Id = Number(mp?.p2?.id ?? 2);
        p1Nick = String(mp?.p1?.nick ?? 'Player 1');
        p2Nick = String(mp?.p2?.nick ?? 'Player 2');
      } catch {
        const me = getCurrentUser();
        const p2info = getLocalP2();
        p1Id = Number(me?.id ?? 1);
        p2Id = Number(p2info?.id ?? 2);
        p1Nick = String(me?.nick ?? 'Player 1');
        p2Nick = String(p2info?.nick ?? 'Player 2');
      }
    } else {
      const me = getCurrentUser();
      const p2info = getLocalP2();
      p1Id = Number(me?.id ?? 1);
      p2Id = Number(p2info?.id ?? 2);
      p1Nick = String(me?.nick ?? 'Player 1');
      p2Nick = String(p2info?.nick ?? 'Player 2');
    }
  } else {
    // Modo normal 1v1 (local)
    const me = getCurrentUser();
    const p2info = getLocalP2();
    p1Id = Number(me?.id ?? 1);
    p2Id = Number(p2info?.id ?? 2);
    p1Nick = String(me?.nick ?? 'Player 1');
    p2Nick = String(p2info?.nick ?? 'Player 2');
  }

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
    const anyEngine = (engine as any);
    if (anyEngine && typeof anyEngine.resize === 'function') engine.resize();
  }

  // ===== Engine/Scene =====
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

  // ===== Campo (estética “Matrix”) =====
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

  // ===== Palas =====
  const paddleW = 0.9, paddleH = 4.0, paddleD = 0.6;
  const p1Mat = new BABYLON.StandardMaterial('p1Mat', scene); p1Mat.emissiveColor = new BABYLON.Color3(0.2, 1, 0.4);
  const p2Mat = new BABYLON.StandardMaterial('p2Mat', scene); p2Mat.emissiveColor = new BABYLON.Color3(0.2, 0.8, 1);

  const p1 = BABYLON.MeshBuilder.CreateBox('p1', { width: paddleW, height: paddleD, depth: paddleH }, scene);
  p1.position.set(-fieldW / 2 + 2, 0.4, 0); p1.material = p1Mat;

  const p2 = p1.clone('p2')!; p2.material = p2Mat; p2.position.set(fieldW / 2 - 2, 0.4, 0);

  // ===== Bola + trail =====
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
  const goalPlaneLeftX = bounds.left - ballR;   // gol P2
  const goalPlaneRightX = bounds.right + ballR; // gol P1

  // ===== HUD =====
  const gui = AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);

  const nameL = new TextBlock('nameL', p1Nick); nameL.color = '#9cff9c'; nameL.fontSize = 18; nameL.left = '-30%'; nameL.top = '-48%'; gui.addControl(nameL);
  const nameR = new TextBlock('nameR', p2Nick); nameR.color = '#9cd3ff'; nameR.fontSize = 18; nameR.left = '30%';  nameR.top = '-48%'; gui.addControl(nameR);

  const scoreP1 = new TextBlock('scoreP1', '0'); scoreP1.color = 'white'; scoreP1.fontSize = 44; scoreP1.left = '-30%'; scoreP1.top = '-42%'; gui.addControl(scoreP1);
  const scoreP2 = new TextBlock('scoreP2', '0'); scoreP2.color = 'white'; scoreP2.fontSize = 44; scoreP2.left =  '30%'; scoreP2.top = '-42%'; gui.addControl(scoreP2);

  const banner = new TextBlock('banner', ''); banner.color = '#89ff89'; banner.fontSize = 56; banner.outlineColor = '#134d1f'; banner.outlineWidth = 2;
  banner.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
  banner.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_CENTER;
  gui.addControl(banner);

  const help = new Rectangle('help');
  help.thickness = 0; help.background = 'rgba(0,0,0,0.35)'; help.width = '64%'; help.height = '22%'; help.top = '30%'; help.cornerRadius = 10; gui.addControl(help);
  const helpText = new TextBlock('helpText', 'Controls:\nP1: W (up) / S (down)    •    P2: I (up) / K (down)\nStart/Pause: Space    •    Fullscreen: Click');
  helpText.color = 'white'; helpText.fontSize = 20; helpText.textWrapping = true; help.addControl(helpText);
  const hint = new TextBlock('hint', '[ CLICK TO START — ENTERS FULLSCREEN ]'); hint.color = 'white'; hint.fontSize = 22; hint.top = '40%'; gui.addControl(hint);

  // ===== Game state & stats =====
  const WIN_POINTS = 5;
  let state: GameState = 'READY';
  let p1Score = 0, p2Score = 0;
  let matchStartedAt = 0;
  let postedResult = 0;
  let p1Hits = 0, p2Hits = 0;

  // ===== Física =====
  const paddleSpeed = 13;
  const ballBaseSpeed = 10.0;
  const ballMaxSpeed = 16.5;
  const wallFriction = 0.98;

  let ballVel = new BABYLON.Vector3(ballBaseSpeed, 0, ballBaseSpeed * 0.6);
  let collideCooldown = 0;

  // Controles (up = z -, down = z +)
  const keys: Record<string, boolean> = { w: false, s: false, i: false, k: false };
  const clampZ = (z: number) => Math.min(bounds.bottom - paddleH / 2, Math.max(bounds.top + paddleH / 2, z));

  // ===== Input =====
  function onKeyDown(e: KeyboardEvent) {
    if (e.key in keys) { keys[e.key] = true; e.preventDefault(); }
    if (e.key === 'Escape') {
      if (isFullscreen()) exitFullscreen();
      if (state === 'PLAYING') pauseGame('⏸️ PAUSE', 'Press Space to continue');
    }
    if (e.code === 'Space') {
      if (state === 'GAMEOVER') { startNewGame(); return; }
      if (state === 'PAUSED')   { resumeAfterPause(); return; }
      if (state === 'PLAYING')  { pauseGame('⏸️ PAUSE', 'Press Space to continue'); return; }
      if (state === 'READY')    { startNewGame(); return; }
    }
  }
  function onKeyUp(e: KeyboardEvent) { if (e.key in keys) keys[e.key] = false; }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  canvas.addEventListener('click', () => {
    if (!isFullscreen()) { enterFullscreen(canvas); applyCanvasFullscreenStyle(true); }
    if (state === 'READY' || state === 'GAMEOVER') { startNewGame(); return; }
    if (state === 'PLAYING') { pauseGame('⏸️ PAUSE', 'Press Space to continue'); return; }
    if (state === 'PAUSED') { resumeAfterPause(); return; }
  });
  document.addEventListener('fullscreenchange', () => {
    const active = isFullscreen();
    applyCanvasFullscreenStyle(active);
    if (!active && state === 'PLAYING') pauseGame('⏸️ PAUSE', 'Press Space to continue');
  });

  // ===== UI helpers =====
  function pauseGame(msg: string, sub: string) { state = 'PAUSED'; banner.text = msg; hint.text = sub; help.isVisible = true; trail.emitRate = 80; }
  function resumeAfterPause() { help.isVisible = false; hint.text = ''; banner.text = ''; state = 'PLAYING'; trail.emitRate = 250; }
  function showMsg(msg: string, sub = '') { banner.text = msg; hint.text = sub; help.isVisible = true; }
  function hideMsg() { banner.text = ''; hint.text = ''; help.isVisible = false; }

  function countdown(n: number) {
    state = 'COUNTDOWN';
    return new Promise<void>((resolve) => {
      let v = n;
      banner.text = String(v);
      hint.text = '';
      const iv = setInterval(() => {
        v -= 1;
        banner.text = v > 0 ? String(v) : 'GO!';
        if (v < 0) { clearInterval(iv); resolve(); }
      }, 1000);
    });
  }

  function centerAndServe(initial = false) {
    ball.position.set(0, 0.6, 0);
    const dirX = Math.random() < 0.5 ? -1 : 1;
    const dirZ = Math.random() < 0.5 ? 1 : -1;
    const speed = initial ? ballBaseSpeed : Math.min(ballBaseSpeed + 1.2, ballMaxSpeed);
    ballVel.set(dirX * speed, 0, dirZ * speed * 0.7);
    collideCooldown = 0;
  }

  function startRally(withCountdown: boolean, initialServe = false) {
    state = 'SERVE';
    centerAndServe(initialServe);
    if (withCountdown) {
      countdown(3).then(() => { hideMsg(); state = 'PLAYING'; trail.emitRate = 250; });
    } else {
      hideMsg(); state = 'PLAYING'; trail.emitRate = 250;
    }
  }

  function startNewGame() {
    p1Score = 0; p2Score = 0; scoreP1.text = '0'; scoreP2.text = '0';
    p1Hits = 0; p2Hits = 0; postedResult = 0;
    matchStartedAt = Date.now();
    showMsg('3');
    startRally(true, true);
  }

  // ===== Colisiones robustas =====
  function reflect(v: BABYLON.Vector3, normal: BABYLON.Vector3) {
    const dot = BABYLON.Vector3.Dot(v, normal);
    return v.subtract(normal.scale(2 * dot));
  }

  function resolvePaddleCollision(paddle: BABYLON.Mesh, leftSide: boolean, dt: number): boolean {
    // solo si la bola va hacia la pala
    if (leftSide && ballVel.x >= 0) return false;
    if (!leftSide && ballVel.x <= 0) return false;

    const px = paddle.position.x, pz = paddle.position.z;
    const hx = paddleW / 2, hz = paddleH / 2;

    // rechazo rápido en X para no “pillar pared”
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

    // cara dominante
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

    // spin e influencia del movimiento de la pala
    const relZ = (ball.position.z - pz) / (paddleH / 2);
    const aimZ = Math.max(-1, Math.min(1, relZ)) * 0.55;
    // up = z- ; down = z+  → signo acorde:
    const paddleVelZ = (leftSide ? (keys.w ? -1 : keys.s ? 1 : 0) : (keys.i ? -1 : keys.k ? 1 : 0)) * paddleSpeed;
    const infZ = (paddleVelZ * dt) * 0.35;

    const n = new BABYLON.Vector3(nx, 0, nz).add(new BABYLON.Vector3(0, 0, aimZ + infZ)).normalize();
    ballVel = reflect(ballVel, n);
    const minAfter = Math.max(ballVel.length(), ballBaseSpeed * 0.95);
    const speed = Math.min(minAfter + 0.5, ballMaxSpeed);
    ballVel = ballVel.normalize().scale(speed);

    collideCooldown = 0.05;
    return true;
  }

  // cruce de segmento contra plano X=c (con dirección)
  function crossesPlaneX(prevX: number, currX: number, planeX: number, dirPositive: boolean) {
    if (dirPositive) return prevX <= planeX && currX > planeX;
    return prevX >= planeX && currX < planeX;
  }

  function publishTournamentResult(p1Won: boolean) {
    const result = {
      finished_at: Date.now(),
      p1: { id: p1Id, nick: p1Nick, score: p1Score, hits: p1Hits },
      p2: { id: p2Id, nick: p2Nick, score: p2Score, hits: p2Hits },
      winner_id: p1Won ? p1Id : p2Id,
    };
    sessionStorage.setItem(T_LAST_RESULT_KEY, JSON.stringify(result));
  }

  function postMatchIfNeeded(p1Won: boolean) {
    if (postedResult) return;
    postedResult = 1;

    const duration_seconds = Math.max(1, Math.round((Date.now() - matchStartedAt) / 1000));

    const p1Saves = Math.max(p2Hits - p1Score, 0);
    const p2Saves = Math.max(p1Hits - p2Score, 0);

    const payload: NewMatch = {
      player1_id: p1Id,
      player2_id: p2Id,
      score_p1: p1Score,
      score_p2: p2Score,
      winner_id: p1Won ? p1Id : p2Id,
      duration_seconds,
      details: {
        mode: isTournament ? 'tournament-1v1-3d' : '1v1-3d',
        shots_on_target_p1: p1Hits,
        shots_on_target_p2: p2Hits,
        saves_p1: p1Saves,
        saves_p2: p2Saves,
      } as any,
    };

    createMatch(payload).catch(err => console.error('[match] error 3D 1v1', err));

    if (isTournament) publishTournamentResult(p1Won);
  }

  function scorePoint(byP1: boolean) {
    if (state !== 'PLAYING') return;
    state = 'SERVE'; // bloquear ya mismo (evita dobles goles)

    if (byP1) { p1Score++; (gui.getControlByName('scoreP1') as TextBlock).text = String(p1Score); }
    else      { p2Score++; (gui.getControlByName('scoreP2') as TextBlock).text = String(p2Score); }

    if (p1Score >= WIN_POINTS || p2Score >= WIN_POINTS) {
      const p1Won = p1Score > p2Score;
      state = 'GAMEOVER';
      trail.emitRate = 80;
      const banner = gui.getControlByName('banner') as TextBlock;
      const hint = gui.getControlByName('hint') as TextBlock;
      banner.text = p1Won ? `💫 ${p1Nick} wins! 🏆` : `🎉 ${p2Nick} wins!`;
      hint.text = 'Click or Space for new match';

      postMatchIfNeeded(p1Won);
      return;
    }

    // siguiente saque con cuenta atrás
    const banner = gui.getControlByName('banner') as TextBlock;
    banner.text = 'GO!';
    centerAndServe(false);
    setTimeout(() => countdown(3).then(() => { banner.text = ''; (gui.getControlByName('hint') as TextBlock).text = ''; state = 'PLAYING'; }), 300);
  }

  // ===== Bucle principal =====
  engine.runRenderLoop(() => {
    const dtMs = Math.min(engine.getDeltaTime(), 50);
    const dt = dtMs / 1000;

    if (collideCooldown > 0) collideCooldown = Math.max(0, collideCooldown - dt);

    if (state === 'PLAYING') {
      // palas (up=z- ; down=z+)
      if (keys.s) p1.position.z = clampZ(p1.position.z - paddleSpeed * dt);
      if (keys.w) p1.position.z = clampZ(p1.position.z + paddleSpeed * dt);
      if (keys.k) p2.position.z = clampZ(p2.position.z - paddleSpeed * dt);
      if (keys.i) p2.position.z = clampZ(p2.position.z + paddleSpeed * dt);

      // sub-steps anti-túnel
      const speed = ballVel.length();
      const steps = Math.min(6, Math.max(1, Math.ceil(speed / 8)));
      const subDt = dt / steps;

      for (let s = 0; s < steps && state === 'PLAYING'; s++) {
        const oldX = ball.position.x;

        // avanzar
        ball.position.x += ballVel.x * subDt;
        ball.position.z += ballVel.z * subDt;

        // paredes Z
        if (ball.position.z < bounds.top + ballR) {
          ball.position.z = bounds.top + ballR; ballVel.z *= -1; ballVel.z *= wallFriction;
        } else if (ball.position.z > bounds.bottom - ballR) {
          ball.position.z = bounds.bottom - ballR; ballVel.z *= -1; ballVel.z *= wallFriction;
        }

        // colisiones palas
        if (collideCooldown <= 0) {
          if (resolvePaddleCollision(p1, true, subDt)) { p1Hits += 1; }
          else if (resolvePaddleCollision(p2, false, subDt)) { p2Hits += 1; }
        }

        // goles por cruce de plano
        if (crossesPlaneX(oldX, ball.position.x, goalPlaneLeftX, false)) { scorePoint(false); break; }
        if (crossesPlaneX(oldX, ball.position.x, goalPlaneRightX, true)) { scorePoint(true);  break; }
      }
    }

    scene.render();
  });

  // ===== Resize =====
  window.addEventListener('resize', () => engine.resize());
}
