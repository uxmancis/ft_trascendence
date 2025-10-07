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

const player2 = {
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
  ctx.font = "20px Arial";
  ctx.fillText(text, x, y);
}

const keysTwoPlayers = {
  up1: false,
  down1: false,
  up2: false,
  down2: false,
};

let lastplayerUpdate = 0;
let paused = true;
let winnerMessage = "";


document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") keysTwoPlayers.up2 = true;
    if (e.key === "ArrowDown") keysTwoPlayers.down2 = true;
    if (e.key === "w") keysTwoPlayers.up1 = true;
    if (e.key === "s") keysTwoPlayers.down1 = true;
  });
  
document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowUp") keysTwoPlayers.up2 = false;
    if (e.key === "ArrowDown") keysTwoPlayers.down2 = false;
    if (e.key === "w") keysTwoPlayers.up1 = false;
    if (e.key === "s") keysTwoPlayers.down1 = false;
});

document.addEventListener("keydown", (e) => {
    if (keysTwoPlayers.up2) {
        player.y -= player.dy * 2;
        if (player.y < 0) 
          player.y = 0;
    }
    if (keysTwoPlayers.down2) {
      player.y += player.dy * 2;
      if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
      }
    }
    if (keysTwoPlayers.up1) {
        player2.y -= player2.dy * 2;
        if (player2.y < 0) 
          player2.y = 0;
    }
    if (keysTwoPlayers.down1) {
      player2.y += player2.dy * 2;
      if (player2.y + player2.height > canvas.height) {
        player2.y = canvas.height - player2.height;
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
  winnerMessage = "";
}

function update() {

  if (keysTwoPlayers.up1) player.y -= player.dy;
  if (keysTwoPlayers.down1) player.y += player.dy;
  if (keysTwoPlayers.up2) player2.y -= player2.dy;
  if (keysTwoPlayers.down2) player2.y += player2.dy;

  ball.x += ball.dx;
  ball.y += ball.dy;

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
        ball.dx = -ball.dx;
        ball.dy = -ball.dy;
      } else {
        ball.dx = -ball.dx;
      }
    }
    ball.x = player.x + player.width + ball.radius;
  }

  if (collision(ball, player2)) {
    if (
      ball.x - ball.radius < player2.x + player2.width &&
      ball.x + ball.radius > player2.x &&
      ball.y + ball.radius > player2.y &&
      ball.y - ball.radius < player2.y + player2.height
    ) {
      let impactPoint = ball.y - player2.y;
      let third = player2.height / 25;
    
      if ((impactPoint < third && ball.dy > 0)|| (impactPoint > 24 * third && ball.dy < 0)) {
        ball.dx = -ball.dx;
        ball.dy = -ball.dy;
      } else {
        ball.dx = -ball.dx;
      }
    }
    ball.x = player2.x - ball.radius;
  }

  if (ball.x - ball.radius < 0) {
    player2.score++;
    if (player2.score === scorepoints) {
      winnerMessage = `Player 2 has win!🎉`;
      player.score = 0;
      player2.score = 0;
      paused = true;
      resetBall();
      return; // salimos para no seguir actualizando
    }
    resetBall();
  }

  if (ball.x + ball.radius > canvas.width) {
    player.score++;
    if (player.score === scorepoints) {
      winnerMessage = `🎉 Congratulations! You win! 🏆`;
      player.score = 0;
      player2.score = 0;
      paused = true;
      resetBall();
      return;
    }
    resetBall();
  }
}

function render() {
  drawRect(0, 0, canvas.width, canvas.height, "black");

  drawRect(player.x, player.y, player.width, player.height, player.color);
  drawRect(player2.x, player2.y, player2.width, player2.height, player2.color);

  drawCircle(ball.x, ball.y, ball.radius, ball.color);

  drawText(player.score.toString(), canvas.width / 4, 30);
  drawText(player2.score.toString(), (3 * canvas.width) / 4, 30);
  if (paused && winnerMessage !== "") {
    ctx.font = "40px Arial";
    ctx.fillStyle = "yellow";
    ctx.textAlign = "center";
    ctx.fillText(winnerMessage, canvas.width / 2, canvas.height / 2);
  }
}

function game() {
    if (!paused) {
      render();
      update();
    }
  }
  

document.body.style.background = "linear-gradient(to right, blue, yellow)";
setInterval(game, 1000 / 60); // 60 el tiempo de ejecución será en milisegundos: un segundo tiene 1000 milisegundos y queremos qeu se actualice 60 veces por segundo
