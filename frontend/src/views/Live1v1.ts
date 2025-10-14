import {paddleHeight, paddleWidth, ballRadius, scorepoints, ballImg, backgroundGame, gameState} from "./toolsVariables"

import { startCountdown } from "./toolsFunctions";

import {
	getCurrentUser,
	clearAppStorage, // limpia pong:user, pong:local:p2, pong:local:tournament, etc.
} from '../session';

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
	speed: 5,
	dx: 4,
	dy: 4,
	color: "red",
	};

	let gameStarted = false;

	ballImg.onload = () => {
		console.log("La imagen de la bola ya está lista para dibujar");
		gameState.ballReady = true;};
	// ballImg.onerror = () => {
	//   console.error("No se pudo cargar la imagen", ballImg.src);};
	ballImg.src = new URL("/src/assets/customization/soccer.png", import.meta.url).href;
	
	backgroundGame.onload = () => {
		console.log("La imagen del mapa ya está lista para dibujar");
		gameState.backgroundReady = true;};
	// backgroundGame.onerror = () => {
	//   console.error("No se pudo cargar la imagen", backgroundGame.src);};
	backgroundGame.src = new URL("/src/assets/customization/field.png", import.meta.url).href;
	
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

	function drawText(text: string, x: number, y: number) {
		ctx.save();
	
		ctx.translate(x, y);
		ctx.translate(-x, -y);
		// // Efecto de sombra para darle profundidad
		// ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
		// ctx.shadowBlur = 10;
		// ctx.shadowOffsetX = 3;
		// ctx.shadowOffsetY = 3;
	
		ctx.fillStyle = 'white';
		ctx.font = 'bold 48px "Orbitron", Entirely';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';

		ctx.fillText(text, x, y);
	
		ctx.restore();
	}

	function renderCountdown() {
		if (gameState.countdownActive) {
		ctx.drawImage(backgroundGame, 0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "rgba(33, 34, 35, 0.6)";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	
		ctx.textAlign = "center";
		//ctx.shadowColor = "white";
		ctx.shadowBlur = 25;
	
		ctx.font = "bold 90px 'Orbitron', 'Entirely', 'Audiowide', sans-serif";
	
		ctx.fillStyle = gameState.countdownValue > 0 ? "#FFFFFF" : "#00FF00";
		const text = gameState.countdownValue > 0 ? gameState.countdownValue.toString() : "GO!";
			if (text === "GO!") {
				ctx.font = "bold 110px 'Orbitron', 'Entirely', 'Audiowide', sans-serif";
				//ctx.shadowColor = "white";
			}
		ctx.fillText(text, canvas.width / 2, canvas.height / 2);
	
		ctx.shadowBlur = 0;
		}
	}

	document.addEventListener("keydown", (e) => {
		if (["ArrowUp", "ArrowDown"].includes(e.key)) {
			e.preventDefault();
		}
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
		if (!gameStarted && !gameState.countdownActive) {
		gameStarted = true;
		gameState. winnerMessage = "";
		resetBall(true);
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
	
		if (gameStarted && !gameState.countdownActive && gameState. winnerMessage === "") {
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

	function resetBall(initial = false) {
		ball.dx = 0;
		ball.dy = 0;
		ball.x = canvas.width / 2;
		ball.y = canvas.height / 2;
		const minAngle = 40 * (Math.PI / 180);
		const maxAngle = 55 * (Math.PI / 180);
		const angle = Math.random() * (maxAngle - minAngle) + minAngle;
		const direction = Math.random() < 0.5 ? -1 : 1;
		const verticalDir = Math.random() < 0.5 ? -1 : 1;
		const startDelay = initial ? 0 : 1000;
		setTimeout(() => ball.dx = direction * ball.speed * Math.cos(angle), startDelay);
		setTimeout(() => ball.dy = verticalDir * ball.speed * Math.sin(angle), startDelay);
	}


	function renderWinner() {
		drawRect(0, 0, canvas.width, canvas.height, "black");
		
		ctx.textAlign = "center";
		//ctx.shadowColor = "white";
		ctx.shadowBlur = 20;
		
		// 🔹 Marcadores
		ctx.font = `bold 18px 'Entirely', 'Audiowide', 'Press Start 2P', sans-serif`;
		ctx.fillStyle = "white";
		ctx.fillText(
			`Player: ${player.score} - Player 2: ${player2.score}`,
			canvas.width / 2,
			canvas.height / 2 - canvas.height / 4,
		);
		
		ctx.font = `bold 18px 'Entirely', 'Audiowide', 'Press Start 2P', sans-serif`;
		ctx.fillStyle = "white";
		ctx.fillText(gameState.winnerMessage, canvas.width / 2, canvas.height / 2);
		
		ctx.font = `bold 16px 'Entirely', 'Audiowide', 'Press Start 2P', sans-serif`; 
		ctx.fillStyle = "white"; 
		ctx.fillText( "Press Space or click to start a new game", canvas.width / 2, canvas.height / 2 + canvas.height / 4 );
		
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
		ball.speed += 0.1;
		ball.speed = Math.min(ball.speed, 10);

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
		ball.speed += 0.1;
		ball.speed = Math.min(ball.speed, 10);
		if ((impactPoint < third && ball.dy > 0)|| (impactPoint > 24 * third && ball.dy < 0)) {
			ball.dx = -ball.dx;
			ball.dy = -ball.dy;
		} else {
			ball.dx = -ball.dx;
		}
		}
		ball.x = player2.x - ball.radius;
	}

	const user = getCurrentUser();
	if (!user) {  return; }

	if (ball.x - ball.radius < 0) {
		player2.score++;
		ball.speed = 5;
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
		ball.speed = 5;
		if (player.score === scorepoints) {
		gameState.winnerMessage = `💫 ${user.nick} wins! 🏆`;
		gameState.paused = true;
		renderWinner();
		resetBall();
		return;
		}
		resetBall();
	}
	}

	function render() {
		if (!gameStarted && !gameState.countdownActive) {
			drawRect(0, 0, canvas.width, canvas.height, "black");

			const text = "[ PRESS TO START PONG 🎮 ]";
			
			ctx.fillStyle = "white";
			ctx.font = "30px 'Press Start 2P', sans-serif";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";

			const blinkSpeed = 500; // Tiempo en milisegundos para el parpadeo
			const showText = Math.floor(Date.now() / blinkSpeed) % 2 === 0; // True para mostrar, false para ocultar
			
			if (showText) {
				ctx.save();
				ctx.translate(canvas.width / 2, canvas.height / 2);
				ctx.fillText(text, 0, 0);
				ctx.restore();
			}
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

		drawText(player.score.toString(), canvas.width / 4, 30);
		drawText(player2.score.toString(), (3 * canvas.width) / 4, 30);
		// if (gameState.paused && gameState.winnerMessage !== "") {
		// 	ctx.font = "40px Arial";
		// 	ctx.fillStyle = "yellow";
		// 	ctx.textAlign = "center";
		// 	ctx.fillText(gameState.winnerMessage, canvas.width / 2, canvas.height / 2);
		// }
	}

	function game() {
		if (gameState.paused && !gameStarted && !gameState.countdownActive)
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