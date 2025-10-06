

export function setupPong() 
{
  const canvas = document.getElementById("pong-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);


// --- Objetos del juego ---
const paddleHeight = 80;
const paddleWidth = 10;
const ballRadius = 8;

// Jugador
const player = {
  x: 10,
  y: canvas.height / 2 - paddleHeight / 2,
  width: paddleWidth,
  height: paddleHeight,
  color: "white",
  dy: 3,
  score: 0,
};

// Máquina
const ai = {
  x: canvas.width - paddleWidth - 10,
  y: canvas.height / 2 - paddleHeight / 2,
  width: paddleWidth,
  height: paddleHeight,
  color: "white",
  dy: 3,
  score: 0,
};

// Pelota
const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: ballRadius,
  speed: 4,
  dx: 4,
  dy: 4,
  color: "white",
};

// --- Funciones de dibujo ---
function drawRect(x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawCircle(x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
}

function drawText(text: string, x: number, y: number) {
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText(text, x, y);
}

const keys = {
    up: false,
    down: false,
};

const aiKeys = { up: false, down: false };
let lastAiUpdate = 0;

function updateAI() {
    lastAiUpdate += 1000/60; // asumiendo 60FPS
    if (lastAiUpdate >= 1000) { // solo una vez por segundo
      lastAiUpdate = 0;
  
      // Predecir posición futura de la pelota
      let predictedY = ball.y;
      let predictedDy = ball.dy;
      let futureX = ball.x;
      while(futureX < ai.x){
        predictedY += predictedDy * 60; // aproximación 1s
        if(predictedY<0){ predictedY=-predictedY; predictedDy=-predictedDy; }
        if(predictedY>canvas.height){ predictedY=2*canvas.height-predictedY; predictedDy=-predictedDy; }
        futureX += ball.dx * 60;
      }
  
      // Simular “teclas presionadas” de la IA
      aiKeys.down = ai.y + ai.height/2 < predictedY;
      aiKeys.up = ai.y + ai.height/2 > predictedY;
    }
  
    // Mover IA
    if (aiKeys.up) { ai.y -= ai.dy; if(ai.y<0) ai.y=0; }
    if (aiKeys.down) { ai.y += ai.dy; if(ai.y+ai.height>canvas.height) ai.y=canvas.height-ai.height; }
}


//Para hacerlo mas fluido
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") keys.up = true;
    if (e.key === "ArrowDown") keys.down = true;
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowUp") keys.up = false;
    if (e.key === "ArrowDown") keys.down = false;
});



// --- Movimiento jugador con teclado ---
document.addEventListener("keydown", (e) => {
    if (keys.up) {
        player.y -= player.dy * 2;
        if (player.y < 0) player.y = 0;
      }
      if (keys.down) {
        player.y += player.dy * 2;
        if (player.y + player.height > canvas.height) {
          player.y = canvas.height - player.height;
        }
      }
});

// --- Colisiones ---
function collision(_ball: typeof ball, paddle: typeof player) {
  return (
    _ball.x - _ball.radius < paddle.x + paddle.width &&
    _ball.x + _ball.radius > paddle.x &&
    _ball.y - _ball.radius < paddle.y + paddle.height &&
    _ball.y + _ball.radius > paddle.y
  );
}

// --- Reiniciar pelota ---
function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.dx = -ball.dx; // cambia dirección
  ball.dy = 4 * (Math.random() > 0.5 ? 1 : -1);
}

// --- Actualizar ---
function update() {
  // mover pelota
  ball.x += ball.dx;
  ball.y += ball.dy;

  // mover AI (sigue la pelota)
  if (ai.y + ai.height / 2 < ball.y) {
    ai.y += ai.dy;
  } else {
    ai.y -= ai.dy;
  }

  // Rebote en arriba/abajo
  if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
    ball.dy = -ball.dy;
  }

  // Colisión con jugador
  if (collision(ball, player)) {
    ball.dx = -ball.dx;
    ball.x = player.x + player.width + ball.radius;
  }

  // Colisión con máquina
  if (collision(ball, ai)) {
    ball.dx = -ball.dx;
    ball.x = ai.x - ball.radius;
  }

  // Punto para AI
  if (ball.x - ball.radius < 0) {
    ai.score++;
    resetBall();
  }

  // Punto para jugador
  if (ball.x + ball.radius > canvas.width) {
    player.score++;
    resetBall();
  }
}

// --- Render ---
function render() {
  drawRect(0, 0, canvas.width, canvas.height, "black");

  // Dibujar jugador y AI
  drawRect(player.x, player.y, player.width, player.height, player.color);
  drawRect(ai.x, ai.y, ai.width, ai.height, ai.color);

  // Dibujar pelota
  drawCircle(ball.x, ball.y, ball.radius, ball.color);

  // Dibujar marcador
  drawText(player.score.toString(), canvas.width / 4, 30);
  drawText(ai.score.toString(), (3 * canvas.width) / 4, 30);
}

// --- Loop principal ---
function game() {
  update();
  render();
}

document.body.style.background = "linear-gradient(to right, blue, yellow)";
setInterval(game, 1000 / 60); // 60 FPS
}