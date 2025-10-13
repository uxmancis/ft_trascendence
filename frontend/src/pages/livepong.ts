import {paddleHeight, paddleWidth, ballRadius, scorepoints, ballImg, backgroundGame, SCORE_ANIM_DURATION, MAX_SCALE, scoreAnimation, gameState} from "./toolsVariables"

import { startCountdown } from "./toolsFunctions";

export function setupLivePong() 
{
    const canvas = document.getElementById("live_pong") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;

    // function resizeCanvas() {
    //   canvas.width = window.innerWidth * 0.8;  // 80% del ancho de la ventana
    //   canvas.height = window.innerHeight * 0.6; // 60% del alto
    // }

    // window.addEventListener("resize", resizeCanvas);
    // resizeCanvas();

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

    ballImg.onload = () => {
        console.log("La imagen de la bola ya está lista para dibujar");
        gameState.ballReady = true;};
      // ballImg.onerror = () => {
      //   console.error("No se pudo cargar la imagen", ballImg.src);};
      ballImg.src = new URL("/src/assets/soccer.png", import.meta.url).href;
      
      backgroundGame.onload = () => {
        console.log("La imagen del mapa ya está lista para dibujar");
        gameState.backgroundReady = true;};
      // backgroundGame.onerror = () => {
      //   console.error("No se pudo cargar la imagen", backgroundGame.src);};
      backgroundGame.src = new URL("/src/assets/uxmancis.jpg", import.meta.url).href;
      
    function drawRect(x: number, y: number, w: number, h: number, color: string, backgroundGame?: HTMLImageElement) {
        if (backgroundGame)
          ctx.drawImage(backgroundGame, x, y, w, h);
        else {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, w, h);
        }
    }

    function drawCircle(x: number, y: number, r: number, color: string, ballImg?: HTMLImageElement) {
        if (ballImg)
          ctx.drawImage(ballImg, x - r, y - r, r * 2, r * 2);
        else {
          ctx.fillStyle = color;
          ctx.beginPath();
          const direction = Math.random() < 0.5 ? -1 : 1;
          ctx.arc(x, y, r, 0, Math.PI * 2 * direction);
          ctx.closePath();
          ctx.fill();
        }
    }

    function drawText(text: string, x: number, y: number, scale: number = 1) {
        ctx.save();
      
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.translate(-x, -y);
        // Efecto de sombra para darle profundidad
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
      
        // Estilo del texto
        ctx.fillStyle = '#00FF99'; // Verde neón
        ctx.font = 'bold 48px "Orbitron", sans-serif'; // Fuente futurista (puedes usar otra)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
      
        // Dibuja el texto principal
        ctx.fillText(text, x, y);
      
        // Efecto de trazo para que resalte
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeText(text, x, y);
      
        ctx.restore(); // Restaura el contexto original
    }

    function renderCountdown() {
        if (gameState.countdownActive) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
      
          ctx.textAlign = "center";
          ctx.shadowColor = "cyan";
          ctx.shadowBlur = 25;
      
          ctx.font = "bold 90px 'Orbitron', 'Audiowide', 'Verdana', sans-serif";
      
          ctx.fillStyle = gameState.countdownValue > 0 ? "#00ffff" : "#ffff66";
          const text = gameState.countdownValue > 0 ? gameState.countdownValue.toString() : "GO!";
              if (text === "GO!") {
                  ctx.font = "bold 110px 'Orbitron', 'Audiowide', 'Verdana', sans-serif";
                  ctx.fillStyle = "#ff66ff";
                  ctx.shadowColor = "#ff33ff";
              }
          ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      
          ctx.shadowBlur = 0;
        }
    }

    document.addEventListener("keydown", (e) => {
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

    document.addEventListener("keydown", (e) => {
        if (gameState.playerKeysUp && !gameState.paused) {
            player.y -= player.dy * 2;
            if (player.y < 0) 
              player.y = 0;
        }
        if (gameState.playerKeysDown && !gameState.paused) {
          player.y += player.dy * 2;
          if (player.y + player.height > canvas.height) {
            player.y = canvas.height - player.height;
          }
        }
        if (gameState.playerTwoKeysUp && !gameState.paused) {
            player2.y -= player2.dy * 2;
            if (player2.y < 0) 
              player2.y = 0;
        }
        if (gameState.playerTwoKeysDown && !gameState.paused) {
          player2.y += player2.dy * 2;
          if (player2.y + player2.height > canvas.height) {
            player2.y = canvas.height - player2.height;
          }
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
          if (gameState. winnerMessage !== "" && !gameState.countdownActive) {
            gameState. winnerMessage = "";
            resetBall();
            startCountdown();
            player.score = 0;
            player2.score = 0;
            return;
          }
      
          if (!gameState.countdownActive && gameState. winnerMessage === "") {
            gameState.paused = !gameState.paused;
          }
        }
      });

      canvas.addEventListener("click", () => {
        if (!gameState.gameStarted && !gameState.countdownActive) {
          gameState.gameStarted = true;
          gameState. winnerMessage = "";
          startCountdown();
          player.score = 0;
          player2.score = 0;
          return;
        }
      
        if (gameState. winnerMessage !== "" && !gameState.countdownActive) {
          gameState. winnerMessage = "";
          resetBall();
          startCountdown();
          player.score = 0;
          player2.score = 0;
          return;
        }
      
        if (gameState.gameStarted && !gameState.countdownActive && gameState. winnerMessage === "") {
          gameState.paused = !gameState.paused;
        }
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
        ball.dx = 0;
        ball.dy = 0;
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        const speed = 5;
        const minAngle = 40 * (Math.PI / 180);
        const maxAngle = 55 * (Math.PI / 180);
        const angle = Math.random() * (maxAngle - minAngle) + minAngle;
        const direction = Math.random() < 0.5 ? -1 : 1;
        const verticalDir = Math.random() < 0.5 ? -1 : 1;
        setTimeout(() => ball.dx = direction * speed * Math.cos(angle), 1000);
        setTimeout(() => ball.dy = verticalDir * speed * Math.sin(angle), 1000);
    }


    function renderWinner() {
      drawRect(0, 0, canvas.width, canvas.height, "black");
    
      ctx.textAlign = "center";
      ctx.shadowColor = "cyan";
      ctx.shadowBlur = 20;
    
      const base = canvas.width;
      const smallFont = Math.round(base * 0.035); // 3.5% del ancho
      const mediumFont = Math.round(base * 0.05); // 5%
      const bigFont = Math.round(base * 0.07); // 7%
    
      // 🔹 Marcadores
      ctx.font = `bold ${smallFont}px 'Orbitron', 'Audiowide', 'Verdana', sans-serif`;
      ctx.fillStyle = "#00ffff";
      ctx.fillText(
        `Player: ${player.score} - Player2: ${player2.score}`,
        canvas.width / 2,
        canvas.height / 2 - mediumFont * 2
      );
    
      // 🔹 Mensaje de ganador
      ctx.font = `bold ${bigFont}px 'Orbitron', 'Audiowide', 'Verdana', sans-serif`;
      ctx.fillStyle = "yellow";
      ctx.fillText(gameState.winnerMessage, canvas.width / 2, canvas.height / 2);
    
      // 🔹 Instrucción de reinicio
      ctx.font = `italic ${smallFont}px 'Orbitron', 'Audiowide', 'Verdana', sans-serif`;
      ctx.fillStyle = "#66ccff";
      ctx.fillText(
        "Press Space or click to start a new game",
        canvas.width / 2,
        canvas.height / 2 + mediumFont * 2
      );
    
      ctx.shadowBlur = 0;
  }

    function update() {

    //   if (gameState.playerKeysUp) player.y -= player.dy;
    //   if (gameState.playerKeysDown) player.y += player.dy;
    //   if (gameState.playerTwoKeysUp) player2.y -= player2.dy;
    //   if (gameState.playerTwoKeysDown) player2.y += player2.dy;

    //   player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
    //   player2.y = Math.max(0, Math.min(canvas.height - player2.height, player2.y));
      
      ball.x += ball.dx;
      ball.y += ball.dy;

      if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
      }

      if (collision(ball, player)) {
        if (
          ball.x - ball.radius  < player.x + player.width &&
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
          gameState.winnerMessage = `Player2 has win!🎉`;
          gameState.paused = true;
          renderWinner();
          resetBall();
          return;
        }
        resetBall();
      }

      if (ball.x + ball.radius > canvas.width) {
        player.score++;
        if (player.score === scorepoints) {
          gameState.winnerMessage = `🎉 Congratulations! You win! 🏆`;
          gameState.paused = true;
          renderWinner();
          resetBall();
          return;
        }
        resetBall();
      }
    }

    function render() {
        if (!gameState.gameStarted && !gameState.countdownActive) {
            drawRect(0, 0, canvas.width, canvas.height, "black");
            ctx.fillStyle = "white";
            ctx.font =  "30px 'Press Start 2P', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("[ PRESS TO START PONG 🎮 ]", canvas.width / 2, canvas.height / 2);
            return;
        }
        if (gameState. winnerMessage !== "") {
            renderWinner();
            return;
        }  
        drawRect(0, 0, canvas.width, canvas.height, "black", gameState.backgroundReady ? backgroundGame : undefined);

        drawRect(player.x, player.y, player.width, player.height, player.color);
        drawRect(player2.x, player2.y, player2.width, player2.height, player2.color);

        drawCircle(ball.x, ball.y, ball.radius, ball.color, gameState.ballReady ? ballImg : undefined);

        const now = performance.now();

        // Animación de puntuación jugador
        if (scoreAnimation.player.scale > 1) {
          const elapsed = now - scoreAnimation.player.startTime;
          const progress = Math.min(elapsed / SCORE_ANIM_DURATION, 1);
          scoreAnimation.player.scale = 1 + (MAX_SCALE - 1) * (1 - progress); // disminuye a 1
        }
        
        // Animación de puntuación IA
        if (scoreAnimation.player2.scale > 1) {
          const elapsed = now - scoreAnimation.player2.startTime;
          const progress = Math.min(elapsed / SCORE_ANIM_DURATION, 1);
          scoreAnimation.player2.scale = 1 + (MAX_SCALE - 1) * (1 - progress);
        }

        drawText(player.score.toString(), canvas.width / 4, 30, scoreAnimation.player.scale);
        drawText(player2.score.toString(), (3 * canvas.width) / 4, 30, scoreAnimation.ai.scale);
        if (gameState.paused && gameState.winnerMessage !== "") {
            ctx.font = "40px Arial";
          ctx.fillStyle = "yellow";
          ctx.textAlign = "center";
          ctx.fillText(gameState.winnerMessage, canvas.width / 2, canvas.height / 2);
        }
    }

    function game() {
        if (gameState.paused && !gameState.gameStarted && !gameState.countdownActive)
        render();
        if (!gameState.paused) {
        update();
        render();
        }
        renderCountdown();
    }
      

    document.body.style.background = "linear-gradient(to right, blue, yellow)";
    setInterval(game, 1000 / 60); // 60 el tiempo de ejecución será en milisegundos: un segundo tiene 1000 milisegundos y queremos qeu se actualice 60 veces por segundo
}