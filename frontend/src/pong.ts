const canvas = document.getElementById("pong") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

// function resizeCanvas() {
//   canvas.width = window.innerWidth * 0.8;  // 80% del ancho de la ventana
//   canvas.height = window.innerHeight * 0.6; // 60% del alto
// }

// window.addEventListener("resize", resizeCanvas);
// resizeCanvas();

const paddleHeight = 80;
const paddleWidth = 10;
const ballRadius = 8;
const scorepoints = 2;

const player = {
  x: 10,
  y: canvas.height / 2 - paddleHeight / 2,
  width: paddleWidth,
  height: paddleHeight,
  color: "white",
  dy: 3,
  score: 0,
};

const ai = {
  x: canvas.width - paddleWidth - 10,
  y: canvas.height / 2 - paddleHeight / 2,
  width: paddleWidth,
  height: paddleHeight,
  color: "white",
  dy: 3,
  score: 0,
};

const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: ballRadius,
  speed: 4,
  dx: 4,
  dy: 4,
  color: "red",
};

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

const aiKeys = { up: false, down: false};
let lastAiUpdate = 0;
let paused = true;
let winnerMessage = "";

function updateAI() {
    lastAiUpdate += 1000/60; // asumiendo 60FPS
    if (lastAiUpdate >= 1000) { // solo una vez por segundo
      lastAiUpdate = 0;
  
      let predictedY = ball.y;
      let predictedDy = ball.dy;
      let futureX = ball.x;
      while(futureX < ai.x){
        predictedY += predictedDy * 60; // aproximación 1s
        if(predictedY<0){ 
          predictedY=-predictedY; 
          predictedDy=-predictedDy; 
        }
        if(predictedY>canvas.height){ 
          predictedY=2*canvas.height-predictedY; 
          predictedDy=-predictedDy;
        }
        futureX += ball.dx * 60;
      }

      // Simular “teclas presionadas” de la IA
      aiKeys.down = ai.y + ai.height/2 < predictedY;
      aiKeys.up = ai.y + ai.height/2 > predictedY;
    }

    if (aiKeys.up) { 
      ai.y -= ai.dy; 
      if(ai.y<0) 
        ai.y=0; 
    }
    if (aiKeys.down) { 
      ai.y += ai.dy; 
      if(ai.y+ai.height>canvas.height) 
        ai.y=canvas.height-ai.height;
    }
}

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") 
      keys.up = true;
    if (e.key === "ArrowDown") 
      keys.down = true;
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowUp") 
      keys.up = false;
    if (e.key === "ArrowDown") 
      keys.down = false;
});

document.addEventListener("keydown", (e) => {
    if (keys.up) {
        player.y -= player.dy * 2;
        if (player.y < 0) 
          player.y = 0;
    }
    if (keys.down) {
      player.y += player.dy * 2;
      if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
      }
    }
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    paused = !paused;
  }
})

canvas.addEventListener("click", () => {
  paused = !paused;
});

function collision(_ball: typeof ball, paddle: typeof player) {
  return (
    _ball.x - _ball.radius < paddle.x + paddle.width &&
    _ball.x + _ball.radius > paddle.x &&
    _ball.y - _ball.radius < paddle.y + paddle.height &&
    _ball.y + _ball.radius > paddle.y
  );
}

function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.dx = -ball.dx; // cambia dirección
  ball.dy = 4 * (Math.random() > 0.5 ? 1 : -1);
}

function update() {

  ball.x += ball.dx;
  ball.y += ball.dy;

  // mover AI (sigue la pelota)
  if (ai.y + ai.height / 2 < ball.y) {
    ai.y += ai.dy;
  } else {
    ai.y -= ai.dy;
  }

  if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
    ball.dy = -ball.dy;
  }

  if (collision(ball, player)) {
    if (
      ball.x - ball.radius < player.x + player.width &&
      ball.x + ball.radius > player.x &&
      ball.y + ball.radius > player.y &&
      ball.y - ball.radius < player.y + player.height
    ) {
      let impactPoint = ball.y - player.y;
      let third = player.height / 25;
    
      if ((impactPoint < third && ball.dy > 0)|| (impactPoint > 24 * third && ball.dy < 0)) {
        // esquina -> rebote en ambas direcciones
        ball.dx = -ball.dx;
        ball.dy = -ball.dy;
      } else {
        // centro -> rebote normal (solo cambia dirección horizontal)
        ball.dx = -ball.dx;
      }
    }
    ball.x = player.x + player.width + ball.radius;
  }

  if (collision(ball, ai)) {
    if (
      ball.x - ball.radius < ai.x + ai.width &&
      ball.x + ball.radius > ai.x &&
      ball.y + ball.radius > ai.y &&
      ball.y - ball.radius < ai.y + ai.height
    ) {
      let impactPoint = ball.y - ai.y;
      let third = ai.height / 25;
    
      if ((impactPoint < third && ball.dy > 0)|| (impactPoint > 24 * third && ball.dy < 0)) {
        // esquina -> rebote en ambas direcciones
        ball.dx = -ball.dx;
        ball.dy = -ball.dy;
      } else {
        // centro -> rebote normal (solo cambia dirección horizontal)
        ball.dx = -ball.dx;
      }
    }
    ball.x = ai.x - ball.radius;
  }

  if (ball.x - ball.radius < 0) {
    ai.score++;
    if (ai.score === scorepoints) {
      paused = true;
      winnerMessage = `Sorry, ai has destroyed you 😈`;
      ai.score = 0;
      player.score = 0;
      resetBall();
      return; // salimos para no seguir actualizando
    }
    resetBall();
  }

  if (ball.x + ball.radius > canvas.width) {
    player.score++;
    if (player.score === scorepoints) {
      paused = true;
      winnerMessage = `🎉 Congratulations! You win! 🏆`;
      ai.score = 0;
      player.score = 0;
      resetBall();
      return;
    }
    resetBall();
  }
}

function render() {
  drawRect(0, 0, canvas.width, canvas.height, "black");

  drawRect(player.x, player.y, player.width, player.height, player.color);
  drawRect(ai.x, ai.y, ai.width, ai.height, ai.color);

  drawCircle(ball.x, ball.y, ball.radius, ball.color);

  drawText(player.score.toString(), canvas.width / 4, 30);
  drawText(ai.score.toString(), (3 * canvas.width) / 4, 30);
  if (paused && winnerMessage !== "") {
    ctx.font = "40px Arial";
    ctx.fillStyle = "yellow";
    ctx.textAlign = "center";
    ctx.fillText(winnerMessage, canvas.width / 2, canvas.height / 2);
  }
}

function game() {

  if (!paused) {
   update();
   render();
  }
}

document.body.style.background = "linear-gradient(to right, blue, yellow)";
setInterval(game, 1000 / 60); // 60 el tiempo de ejecución será en milisegundos: un segundo tiene 1000 milisegundos y queremos qeu se actualice 60 veces por segundo
