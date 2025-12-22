import { createMatch, sanitizeMatch } from '../api';
import { getCurrentUser, getLocalP2, getLocalP3, getLocalP4 } from '../session';
import { logTerminal } from '../components/IDEComponets/Terminal';
import { t, onLangChange } from '../i18n/i18n';

// @ts-ignore
import * as BABYLON from '@babylonjs/core';
// @ts-ignore
import '@babylonjs/loaders';
// @ts-ignore
import { AdvancedDynamicTexture, TextBlock, Rectangle } from '@babylonjs/gui';

type GameState = 'READY' | 'COUNTDOWN' | 'SERVE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export function setupLive4v4() {
  const canvas = document.getElementById('Play4v4') as HTMLCanvasElement;
  if (!canvas) return;

  if ((canvas as any)._pong4v4Bound) return;
  (canvas as any)._pong4v4Bound = true;

  // ===== UI/FS restore =====
  const rect = canvas.getBoundingClientRect();
  const initialSizePx = { width: Math.round(rect.width), height: Math.round(rect.height) };
  const initialOverflow = {
    html: document.documentElement.style.overflow,
    body: document.body.style.overflow,
  };

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

  // ===== Canvas resize =====
  function resizeCanvasToDisplaySize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  resizeCanvasToDisplaySize();

  // ===== Engine/Scene =====
  const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: true });
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

  engine.resize();

  const glow = new BABYLON.GlowLayer('glow', scene, { blurKernelSize: 24 });
  glow.intensity = 0.6;

  const camera = new BABYLON.ArcRotateCamera('cam', -Math.PI / 2, Math.PI / 2.5, 50, new BABYLON.Vector3(0, 0, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerBetaLimit = 0.5; camera.upperBetaLimit = 1.4;
  camera.lowerRadiusLimit = 35; camera.upperRadiusLimit = 70;
  camera.panningSensibility = 0; camera.inertia = 0.85; camera.wheelPrecision = 60;

  new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);

  // ===== Campo cuadrado para 4 jugadores =====
  const fieldSize = 40;
  const table = BABYLON.MeshBuilder.CreateGround('table', { width: fieldSize, height: fieldSize }, scene);
  const tableMat = new BABYLON.StandardMaterial('tableMat', scene);
  tableMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
  tableMat.emissiveColor = new BABYLON.Color3(0.02, 0.35, 0.1);
  table.material = tableMat;

  // Grid
  const gridParent = new BABYLON.TransformNode('grid', scene);
  for (let i = -fieldSize / 2; i <= fieldSize / 2; i += 2) {
    const lx = BABYLON.MeshBuilder.CreateLines('gx' + i, {
      points: [new BABYLON.Vector3(i, 0.01, -fieldSize / 2), new BABYLON.Vector3(i, 0.01, fieldSize / 2)]
    }, scene); lx.color = new BABYLON.Color3(0.3, 1, 0.4); lx.parent = gridParent;
    
    const lz = BABYLON.MeshBuilder.CreateLines('gz' + i, {
      points: [new BABYLON.Vector3(-fieldSize / 2, 0.01, i), new BABYLON.Vector3(fieldSize / 2, 0.01, i)]
    }, scene); lz.color = new BABYLON.Color3(0.3, 1, 0.4); lz.parent = gridParent;
  }

  // ===== Palas (4 jugadores en los bordes) =====
  const paddleW = 0.9, paddleH = 6.0, paddleD = 0.6;
  const offset = fieldSize / 2 - 2;

  const p1Mat = new BABYLON.StandardMaterial('p1Mat', scene); p1Mat.emissiveColor = new BABYLON.Color3(1, 0.2, 0.2);
  const p2Mat = new BABYLON.StandardMaterial('p2Mat', scene); p2Mat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 1);
  const p3Mat = new BABYLON.StandardMaterial('p3Mat', scene); p3Mat.emissiveColor = new BABYLON.Color3(1, 1, 0.2);
  const p4Mat = new BABYLON.StandardMaterial('p4Mat', scene); p4Mat.emissiveColor = new BABYLON.Color3(0.2, 1, 0.2);

  // P1: left (-X)
  const p1 = BABYLON.MeshBuilder.CreateBox('p1', { width: paddleW, height: paddleD, depth: paddleH }, scene);
  p1.position.set(-offset, 0.4, 0); p1.material = p1Mat;

  // P2: right (+X)
  const p2 = BABYLON.MeshBuilder.CreateBox('p2', { width: paddleW, height: paddleD, depth: paddleH }, scene);
  p2.position.set(offset, 0.4, 0); p2.material = p2Mat;

  // P3: bottom (+Z) - INVERTIDO CON P4
  const p3 = BABYLON.MeshBuilder.CreateBox('p3', { width: paddleH, height: paddleD, depth: paddleW }, scene);
  p3.position.set(0, 0.4, offset); p3.material = p3Mat;

  // P4: top (-Z) - INVERTIDO CON P3
  const p4 = BABYLON.MeshBuilder.CreateBox('p4', { width: paddleH, height: paddleD, depth: paddleW }, scene);
  p4.position.set(0, 0.4, -offset); p4.material = p4Mat;

  // ===== Bola =====
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

  // ===== Límites =====
  const bounds = {
    left: -fieldSize / 2 + 0.6,
    right: fieldSize / 2 - 0.6,
    top: -fieldSize / 2 + 0.6,
    bottom: fieldSize / 2 - 0.6,
  };

  // ===== HUD =====
  const gui = AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);

  const user = getCurrentUser();
  const p2info = getLocalP2();
  const p3info = getLocalP3();
  const p4info = getLocalP4();

  const p1Nick = user?.nick ?? 'P1';
  const p2Nick = p2info?.nick ?? 'P2';
  const p3Nick = p3info?.nick ?? 'P3';
  const p4Nick = p4info?.nick ?? 'P4';

  const nameP1 = new TextBlock('nameP1', p1Nick); nameP1.color = '#ff6666'; nameP1.fontSize = 18; nameP1.left = '-40%'; nameP1.top = '-48%'; gui.addControl(nameP1);
  const nameP2 = new TextBlock('nameP2', p2Nick); nameP2.color = '#6666ff'; nameP2.fontSize = 18; nameP2.left = '40%'; nameP2.top = '-48%'; gui.addControl(nameP2);
  const nameP3 = new TextBlock('nameP3', p3Nick); nameP3.color = '#ffff66'; nameP3.fontSize = 18; nameP3.left = '0%'; nameP3.top = '-48%'; gui.addControl(nameP3);
  const nameP4 = new TextBlock('nameP4', p4Nick); nameP4.color = '#66ff66'; nameP4.fontSize = 18; nameP4.left = '0%'; nameP4.top = '45%'; gui.addControl(nameP4);

  const scoreP1 = new TextBlock('scoreP1', '0'); scoreP1.color = 'white'; scoreP1.fontSize = 44; scoreP1.left = '-40%'; scoreP1.top = '-42%'; gui.addControl(scoreP1);
  const scoreP2 = new TextBlock('scoreP2', '0'); scoreP2.color = 'white'; scoreP2.fontSize = 44; scoreP2.left = '40%'; scoreP2.top = '-42%'; gui.addControl(scoreP2);
  const scoreP3 = new TextBlock('scoreP3', '0'); scoreP3.color = 'white'; scoreP3.fontSize = 44; scoreP3.left = '0%'; scoreP3.top = '-42%'; gui.addControl(scoreP3);
  const scoreP4 = new TextBlock('scoreP4', '0'); scoreP4.color = 'white'; scoreP4.fontSize = 44; scoreP4.left = '0%'; scoreP4.top = '39%'; gui.addControl(scoreP4);

  const banner = new TextBlock('banner', ''); banner.color = '#89ff89'; banner.fontSize = 56; banner.outlineColor = '#134d1f'; banner.outlineWidth = 2;
  banner.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
  banner.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_CENTER;
  gui.addControl(banner);

  const help = new Rectangle('help');
  help.thickness = 0; help.background = 'rgba(0,0,0,0.35)'; help.width = '70%'; help.height = '25%'; help.top = '30%'; help.cornerRadius = 10; gui.addControl(help);
  const helpText = new TextBlock('helpText', 'Controls:\nP1: W/S  •  P2: I/K  •  P3: L/Ñ  •  P4: C/V\nStart/Pause: Space  •  Click to start');
  helpText.color = 'white'; helpText.fontSize = 20; helpText.textWrapping = true; help.addControl(helpText);
  const hint = new TextBlock('hint', '[ CLICK TO START ]'); hint.color = 'white'; hint.fontSize = 22; hint.top = '40%'; gui.addControl(hint);

  // ===== Game state =====
  const WIN_POINTS = 3;
  let state: GameState = 'READY';
  let scores = { p1: 0, p2: 0, p3: 0, p4: 0 };
  let matchStartedAt = 0;
  let postedResult = 0;
  let lastPlayerHit: 'p1' | 'p2' | 'p3' | 'p4' | null = null;

  // ===== Física =====
  const paddleSpeed = 13;
  const ballBaseSpeed = 10.0;
  const ballMaxSpeed = 16.5;

  let ballVel = new BABYLON.Vector3(ballBaseSpeed, 0, ballBaseSpeed * 0.6);
  let collideCooldown = 0;

  const keys: Record<string, boolean> = { w: false, s: false, i: false, k: false, c: false, v: false, l: false, ñ: false };
  const clampZ = (z: number) => Math.min(bounds.bottom - paddleH / 2, Math.max(bounds.top + paddleH / 2, z));
  const clampX = (x: number) => Math.min(bounds.right - paddleH / 2, Math.max(bounds.left + paddleH / 2, x));

  // ===== Input =====
  function onKeyDown(e: KeyboardEvent) {
    if (e.key in keys) { keys[e.key] = true; e.preventDefault(); }
    if (e.key === 'Escape') {
      if (isFullscreen()) exitFullscreen();
      if (state === 'PLAYING') pauseGame(t('game.pause'), t('game.pressSpace'));
    }
    if (e.code === 'Space') {
      if (state === 'GAMEOVER') { startNewGame(); return; }
      if (state === 'PAUSED') { resumeAfterPause(); return; }
      if (state === 'PLAYING') { pauseGame(t('game.pause'), t('game.pressSpace')); return; }
      if (state === 'READY') { startNewGame(); return; }
    }
  }
  function onKeyUp(e: KeyboardEvent) { if (e.key in keys) keys[e.key] = false; }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  canvas.addEventListener('click', () => {
    if (!isFullscreen()) { enterFullscreen(canvas); applyCanvasFullscreenStyle(true); }
    if (state === 'READY' || state === 'GAMEOVER') { startNewGame(); return; }
    if (state === 'PLAYING') { pauseGame(t('game.pause'), t('game.pressSpace')); return; }
    if (state === 'PAUSED') { resumeAfterPause(); return; }
  });

  document.addEventListener('fullscreenchange', () => {
    const active = isFullscreen();
    applyCanvasFullscreenStyle(active);
    if (!active && state === 'PLAYING') pauseGame(t('game.pause'), t('game.pressSpace'));
  });

  // ===== UI helpers =====
  function pauseGame(msg: string, sub: string) { state = 'PAUSED'; banner.text = msg; hint.text = sub; help.isVisible = true; trail.emitRate = 80; }
  function resumeAfterPause() { help.isVisible = false; hint.text = ''; banner.text = ''; state = 'PLAYING'; trail.emitRate = 250; }
  function hideMsg() { banner.text = ''; hint.text = ''; help.isVisible = false; }

  function countdown(n: number) {
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

  function centerAndServe() {
    ball.position.set(0, 0.6, 0);
    const angle = Math.random() * Math.PI * 2;
    const speed = ballBaseSpeed;
    ballVel.set(Math.cos(angle) * speed, 0, Math.sin(angle) * speed);
    collideCooldown = 0;
    lastPlayerHit = null; // 👈 CRITICAL: Reset after each goal
  }

  function startNewGame() {
    scores = { p1: 0, p2: 0, p3: 0, p4: 0 };
    scoreP1.text = '0'; scoreP2.text = '0'; scoreP3.text = '0'; scoreP4.text = '0';
    postedResult = 0; matchStartedAt = Date.now();
    centerAndServe();
    countdown(3).then(() => { hideMsg(); state = 'PLAYING'; trail.emitRate = 250; });
  }

  function reflect(v: BABYLON.Vector3, normal: BABYLON.Vector3) {
    const dot = BABYLON.Vector3.Dot(v, normal);
    return v.subtract(normal.scale(2 * dot));
  }

  function checkPaddleCollision(paddle: BABYLON.Mesh, playerId: 'p1' | 'p2' | 'p3' | 'p4', vertical: boolean): boolean {
    const px = paddle.position.x, pz = paddle.position.z;
    const hw = vertical ? paddleW / 2 : paddleH / 2;
    const hd = vertical ? paddleH / 2 : paddleW / 2;

    const cx = Math.max(px - hw, Math.min(ball.position.x, px + hw));
    const cz = Math.max(pz - hd, Math.min(ball.position.z, pz + hd));
    const dx = ball.position.x - cx;
    const dz = ball.position.z - cz;
    const dist2 = dx * dx + dz * dz;
    if (dist2 > ballR * ballR) return false;

    let nx = 0, nz = 0;
    if (vertical) {
      nx = (ball.position.x < px) ? -1 : 1;
      ball.position.x = px + (nx * (hw + ballR + 0.01));
    } else {
      nz = (ball.position.z < pz) ? -1 : 1;
      ball.position.z = pz + (nz * (hd + ballR + 0.01));
    }

    const n = new BABYLON.Vector3(nx, 0, nz).normalize();
    ballVel = reflect(ballVel, n);
    const speed = Math.min(ballVel.length() + 0.5, ballMaxSpeed);
    ballVel = ballVel.normalize().scale(speed);

    collideCooldown = 0.05;
    lastPlayerHit = playerId;
    return true;
  }

function scorePoint(scorer: 'p1' | 'p2' | 'p3' | 'p4') {
  if (state !== 'PLAYING') return; // ✅ BLINDAJE CRÍTICO
    state = 'SERVE';

    scores[scorer]++;
    (gui.getControlByName(`score${scorer.toUpperCase()}`) as TextBlock).text = String(scores[scorer]);
    const names = { p1: p1Nick, p2: p2Nick, p3: p3Nick, p4: p4Nick };
    logTerminal(`⚽ ${names[scorer]} ${t('log.scores')}! [${scores.p1}-${scores.p2}-${scores.p3}-${scores.p4}]`);

    const maxScore = Math.max(scores.p1, scores.p2, scores.p3, scores.p4);
    if (maxScore >= WIN_POINTS) {
      const winner = Object.keys(scores).find(k => scores[k as keyof typeof scores] === maxScore) as keyof typeof scores;
      state = 'GAMEOVER';
      trail.emitRate = 80;
      banner.text = `🏆 ${winner.toUpperCase()} wins!`;
      hint.text = 'Click or Space for new match';
      const names = { p1: p1Nick, p2: p2Nick, p3: p3Nick, p4: p4Nick };
      logTerminal(`${t('log.victory')} ${names[winner]} - [${scores.p1}-${scores.p2}-${scores.p3}-${scores.p4}]`);

      const didUserWin = winner === 'p1';

      if (!postedResult && user && p2info) {
        postedResult = 1;
        const duration_seconds = Math.max(1, Math.round((Date.now() - matchStartedAt) / 1000));
        const payload = {
          player1_id: user.id,
          player2_id: 1,
          score_p1: scores.p1,
          score_p2: Math.max(scores.p2, scores.p3, scores.p4),
          winner_id: didUserWin ? user.id : 1,
          duration_seconds,
        };
        console.log('[match] 4v4 payload:', payload);
        try {
          const sanitized = sanitizeMatch(payload);
          console.log('[match] Sanitized 4v4:', sanitized);
          createMatch(sanitized)
            .then(res => {
              console.log('[match] 4v4 match saved:', res);
              logTerminal(`${t('log.matchSaved')}`);
            })
            .catch(err => {
              console.error('[match] error 4v4 3D', err);
              logTerminal(`${t('log.failedToSave')} ${(err as any)?.message || err}`);
            });
        } catch (err) {
          console.error('[match] validation error', err);
          logTerminal(`${t('log.validationError')} ${(err as any)?.message || err}`);
        }
      }
      return;
    }

    centerAndServe();
    setTimeout(() => countdown(3).then(() => { banner.text = ''; state = 'PLAYING'; }), 300);
  }

  // ===== Main loop =====
  engine.runRenderLoop(() => {
    const dtMs = Math.min(engine.getDeltaTime(), 50);
    const dt = dtMs / 1000;

    if (collideCooldown > 0) collideCooldown = Math.max(0, collideCooldown - dt);

    if (state === 'PLAYING') {
      // P1 (left): W/S
      if (keys.s) p1.position.z = clampZ(p1.position.z - paddleSpeed * dt);
      if (keys.w) p1.position.z = clampZ(p1.position.z + paddleSpeed * dt);

      // P2 (right): I/K
      if (keys.k) p2.position.z = clampZ(p2.position.z - paddleSpeed * dt);
      if (keys.i) p2.position.z = clampZ(p2.position.z + paddleSpeed * dt);

      // P3 (bottom): L/Ñ
      if (keys.l) p3.position.x = clampX(p3.position.x - paddleSpeed * dt);
      if (keys.ñ) p3.position.x = clampX(p3.position.x + paddleSpeed * dt);

      // P4 (top): C/V
      if (keys.c) p4.position.x = clampX(p4.position.x - paddleSpeed * dt);
      if (keys.v) p4.position.x = clampX(p4.position.x + paddleSpeed * dt);

      // Ball movement
      ball.position.x += ballVel.x * dt;
      ball.position.z += ballVel.z * dt;

      // ===== Rebotes en paredes / Detección de goles =====
      const wallFriction = 0.98;
      
      // Lado IZQUIERDO (P1)
      if (ball.position.x - ballR < bounds.left) {
        if (lastPlayerHit) {
          // Alguien golpeó la bola → ANOTAR GOL
          scorePoint(lastPlayerHit);
        } else {
          // Nadie la tocó → REBOTE
          ball.position.x = bounds.left + ballR;
          ballVel.x *= -wallFriction;
        }
      }
      
      // Lado DERECHO (P2)
      else if (ball.position.x + ballR > bounds.right) {
        if (lastPlayerHit) {
          scorePoint(lastPlayerHit);
        } else {
          ball.position.x = bounds.right - ballR;
          ballVel.x *= -wallFriction;
        }
      }
      
      // Lado ARRIBA (P3)
      if (ball.position.z - ballR < bounds.top) {
        if (lastPlayerHit) {
          scorePoint(lastPlayerHit);
        } else {
          ball.position.z = bounds.top + ballR;
          ballVel.z *= -wallFriction;
        }
      }
      
      // Lado ABAJO (P4)
      else if (ball.position.z + ballR > bounds.bottom) {
        if (lastPlayerHit) {
          scorePoint(lastPlayerHit);
        } else {
          ball.position.z = bounds.bottom - ballR;
          ballVel.z *= -wallFriction;
        }
      }

      // Paddle collisions (aquí se marca lastPlayerHit)
      if (collideCooldown <= 0) {
        checkPaddleCollision(p1, 'p1', true);
        checkPaddleCollision(p2, 'p2', true);
        checkPaddleCollision(p3, 'p3', false);
        checkPaddleCollision(p4, 'p4', false);
      }
    }

    scene.render();
  });

  // ===== Resize =====
  window.addEventListener('resize', () => {
    resizeCanvasToDisplaySize();
    engine.resize();
  });

  // ===== Language Change Reactivity =====
  const updateUITexts = () => {
    const helpText = gui.getControlByName('helpText') as TextBlock | null;
    if (helpText) helpText.text = t('game.controls');
  };
  
  const offLang = onLangChange(updateUITexts);
  (canvas as any)._langCleanup = () => offLang();
}

