import { createMatch, type NewMatch } from '../api';
import { getCurrentUser, getLocalP2, getLocalP3, getLocalP4 } from '../session';

export function setupLive4v4() 
{
	const canvas = document.getElementById("Play4v4") as HTMLCanvasElement;
	const ctx = canvas.getContext("2d")!;

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
		playerTwoKeysUp: false,
		playerTwoKeysDown: false,
		playerThreeLeft: false,
		playerThreeRight: false,
		playerFourLeft: false,
		playerFourRight: false,
	};

	const user = getCurrentUser();
	const p2 = getLocalP2();
	const p3 = getLocalP3();
	const p4 = getLocalP4();

	const player = {
	user: user,
	x: 10,
	y: canvas.height / 2 - paddleHeight / 2,
	width: paddleWidth,
	height: paddleHeight +10,
	color: "white",
	dy: 3,
	score: 0,
	};

	const player2 = {
	user: p2, 
	x: canvas.width - paddleWidth - 10,
	y: canvas.height / 2 - paddleHeight / 2,
	width: paddleWidth,
	height: paddleHeight +10,
	color: "white",
	dy: 3,
	score: 0,
	};

	const player3 = {
		user: p3,
		x: canvas.width / 2 - paddleHeight / 2,
		y: 10,
		width: paddleHeight +10,
		height: paddleWidth,
		color: "white",
		dx: 3,
		dy: 0,
		score: 0,
	};
	

	const player4 = {
		user: p4,
		x: canvas.width / 2 - paddleHeight / 2,
		y: canvas.height - paddleWidth - 10,
		width: paddleHeight  +10,
		height: paddleWidth,
		color: "white",
		dx: 3,
		dy: 0,
		score: 0,
	};
	
	let lastPlayerHit: "player" | "player2" | "player3" | "player4" | null = null;

	const ball = {
	x: canvas.width / 2,
	y: canvas.height / 2,
	radius: ballRadius,
	speed: 6,
	dx: 4,
	dy: 4,
	color: "black",
	};

	let gameStarted = false;

	ballImg.onload = () => {
		console.log("La imagen de la bola ya está lista para dibujar");
		gameState.ballReady = true;};
	// ballImg.onerror = () => {
	//   console.error("No se pudo cargar la imagen", ballImg.src);};
	ballImg.src = new URL("/src/assets/customization/metalball.png", import.meta.url).href;

	backgroundGame.onload = () => {
		console.log("La imagen del mapa ya está lista para dibujar");
		gameState.backgroundReady = true;};
	// backgroundGame.onerror = () => {
	//   console.error("No se pudo cargar la imagen", backgroundGame.src);};
	backgroundGame.src = new URL("/src/assets/customization/arcade5.jpg", import.meta.url).href;
	
	function drawRect(x: number, y: number, w: number, h: number, color: string, backgroundGame?: HTMLImageElement) {
		if (backgroundGame)
		ctx.drawImage(backgroundGame, x, y, w, h);
		else {
		ctx.fillStyle = color;
		ctx.fillRect(x, y, w, h);
		}
	}

	function drawCircle(x: number, y: number, r: number, color: string, ballImg?: HTMLImageElement) {
		if (ballImg) {
			ctx.save();
			// Creamos un círculo para recortar
			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI * 2);
			ctx.closePath();
			ctx.clip(); // todo lo que dibujemos ahora quedará dentro del círculo
			ctx.drawImage(ballImg, x - r, y - r, r * 2, r * 2);
	
			ctx.restore();
		}
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
		ctx.font = 'bold 38px "Orbitron", Entirely';
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
	
		ctx.fillStyle = gameState.countdownValue > 0 ? "#FFFFFF" : "#FFFFFF";
		const text = gameState.countdownValue > 0 ? gameState.countdownValue.toString() : "GO!";
			if (text === "GO!") {
				ctx.font = "bold 110px 'Orbitron', 'Entirely', 'Audiowide', sans-serif";
				//ctx.shadowColor = "white";
			}
		ctx.fillText(text, canvas.width / 2, canvas.height / 2);
	
		ctx.shadowBlur = 0;
		}
	}

	function startCountdown() {
	  gameState.countdownActive = true;
	  gameState.countdownValue = 3;
	  gameState. winnerMessage = "";
	  gameState.paused = true;
	
	  if (gameState.countdownTimer) clearInterval(gameState.countdownTimer);
	
	  gameState.countdownTimer = window.setInterval(() => {
		gameState.countdownValue--;
		if (gameState.countdownValue <= 0) {
		  clearInterval(gameState.countdownTimer!);
		  gameState.countdownValue = 0;
		  setTimeout(() => {
			gameState.countdownActive = false;
			gameState.paused = false;
		  }, 500);
		}
	  }, 1000);
	}

	document.addEventListener("keydown", (e) => {
		if (["ArrowUp", "ArrowDown"].includes(e.key)) {
			e.preventDefault();
		}
		if (e.key === "ArrowUp") gameState.playerTwoKeysUp = true;
		if (e.key === "ArrowDown") gameState.playerTwoKeysDown = true;
		if (e.key === "w") gameState.playerKeysUp = true;
		if (e.key === "s") gameState.playerKeysDown = true;
		if (e.key === "c") gameState.playerThreeLeft = true;
		if (e.key === "v") gameState.playerThreeRight = true;
		if (e.key === "l") gameState.playerFourLeft = true;
		if (e.key === "ñ") gameState.playerFourRight = true;
	});
	
	document.addEventListener("keyup", (e) => {
		if (e.key === "ArrowUp") gameState.playerTwoKeysUp = false;
		if (e.key === "ArrowDown") gameState.playerTwoKeysDown = false;
		if (e.key === "w") gameState.playerKeysUp = false;
		if (e.key === "s") gameState.playerKeysDown = false;
		if (e.key === "c") gameState.playerThreeLeft = false;
		if (e.key === "v") gameState.playerThreeRight = false;
		if (e.key === "l") gameState.playerFourLeft = false;
		if (e.key === "ñ") gameState.playerFourRight = false;
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
		if (gameState.playerThreeLeft && !gameState.paused) {
			player3.x -= player3.dx * 2;
			if (player3.x < 0) player3.x = 0;
		}
		if (gameState.playerThreeRight && !gameState.paused) {
			player3.x += player3.dx * 2;
			if (player3.x + player3.width > canvas.width) {
				player3.x = canvas.width - player3.width;
			}
		}
		if (gameState.playerFourLeft && !gameState.paused) {
			player4.x -= player4.dx * 2;
			if (player4.x < 0) player4.x = 0;
		}
		if (gameState.playerFourRight && !gameState.paused) {
			player4.x += player4.dx * 2;
			if (player4.x + player4.width > canvas.width) {
				player4.x = canvas.width - player4.width;
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
			player3.score = 0;
			player4.score = 0;
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
		player3.score = 0;
		player4.score = 0;
		return;
		}
	
		if (gameState. winnerMessage !== "" && !gameState.countdownActive) {
		gameState. winnerMessage = "";
		resetBall();
		startCountdown();
		player.score = 0;
		player2.score = 0;
		player3.score = 0;
		player4.score = 0;
		return;
		}
	
		if (gameStarted && !gameState.countdownActive && gameState. winnerMessage === "") {
		gameState.paused = !gameState.paused;
		}
	});

	function collision(_ball: typeof ball, paddle: typeof player, orientation: "vertical" | "horizontal" = "vertical") {
		if (orientation === "vertical") {
			return (
			_ball.x - _ball.radius < paddle.x + paddle.width &&
			_ball.x + _ball.radius > paddle.x &&
			_ball.y - _ball.radius < paddle.y + paddle.height &&
			_ball.y + _ball.radius > paddle.y
			);
		} else {
			return (
			_ball.y - _ball.radius < paddle.y + paddle.height &&
			_ball.y + _ball.radius > paddle.y &&
			_ball.x - _ball.radius < paddle.x + paddle.width &&
			_ball.x + _ball.radius > paddle.x
			);
		}
	}

	function resetBall(initial = false) {
		ball.speed = 3
		ball.dx = 0;
		ball.dy = 0;
		ball.x = canvas.width / 2;
		ball.y = canvas.height / 2;
	
		const ranges = [
			[25, 65],
			[115, 165],
			[195, 245],
			[295, 345]
		].map(([min, max]) => [min * Math.PI/180, max * Math.PI/180]);
	
		const selectedRange = ranges[Math.floor(Math.random() * ranges.length)];
		const angle = Math.random() * (selectedRange[1] - selectedRange[0]) + selectedRange[0];
	
		const startDelay = initial ? 0 : 1000;
		setTimeout(() => ball.dx = ball.speed * Math.cos(angle), startDelay);
		setTimeout(() => ball.dy = ball.speed * Math.sin(angle), startDelay);
	}
	

	function renderWinner() {
		drawRect(0, 0, canvas.width, canvas.height, "black");
	
		ctx.textAlign = "center";
		//ctx.shadowColor = "white";
		ctx.shadowBlur = 20;
	
		ctx.font = `bold 18px 'Entirely', 'Audiowide', 'Press Start 2P', sans-serif`;
		ctx.fillStyle = "white";
		ctx.fillText(
                     `Player1: ${player.score} 🥸`,
                     canvas.width / 2,
                     canvas.height / 10
        );
        
        ctx.fillText(
                     `${p2?.nick ?? "Player2"}: ${player2.score} 🤠`,
                     canvas.width / 2,
                     canvas.height / 10 + 25
        );

        ctx.fillText(
                     `${p3?.nick ?? "Player3"}: ${player3.score} 😎`,
                     canvas.width / 2,
                     canvas.height / 10 + 25 * 2
        );

        ctx.fillText(
                     `${p4?.nick ?? "Player4"}: ${player4.score} 🤓`,
                     canvas.width / 2,
                     canvas.height / 10 + 25 * 3
        );
        ctx.font = `bold 28px 'Entirely', 'Audiowide', 'Press Start 2P', sans-serif`;
		ctx.fillStyle = "white";
		ctx.fillText(gameState.winnerMessage, canvas.width / 2, canvas.height / 2);
		ctx.font = `bold 12px 'Entirely', 'Audiowide', 'Press Start 2P', sans-serif`;
		ctx.fillStyle = "white";
		ctx.fillText(
		"Press Space or click to start a new game",
		canvas.width / 2,
		canvas.height / 2 + canvas.height / 4
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

		if (collision(ball, player, "vertical")) {
			ball.speed = Math.min(ball.speed + 0.05, 10);
			lastPlayerHit = "player";
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

		if (collision(ball, player2, "vertical")) {
			ball.speed = Math.min(ball.speed + 0.05, 10);
			lastPlayerHit = "player2";
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

		if (collision(ball, player3, "horizontal")) {
			ball.speed = Math.min(ball.speed + 0.05, 10);
			lastPlayerHit = "player3";
			if (
				ball.y - ball.radius < player3.y + player3.height &&
				ball.y + ball.radius > player3.y &&
				ball.x + ball.radius > player3.x &&
				ball.x - ball.radius < player3.x + player3.width
			) {
				let impactPoint = ball.x - player3.x;
				let third = player3.width / 25;

				if ((impactPoint < third && ball.dx > 0) || (impactPoint > 24 * third && ball.dx < 0)) {
					ball.dy = -ball.dy;
					ball.dx = -ball.dx;
				} else {
					ball.dy = -ball.dy;
				}
			}
			ball.y = player3.y + player3.height + ball.radius;
		}

		if (collision(ball, player4, "horizontal")) {
			ball.speed = Math.min(ball.speed + 0.05, 10);
			lastPlayerHit = "player4";
			if (
				ball.y - ball.radius < player4.y + player4.height &&
				ball.y + ball.radius > player4.y &&
				ball.x + ball.radius > player4.x &&
				ball.x - ball.radius < player4.x + player4.width
			) {
				let impactPoint = ball.x - player4.x;
				let third = player4.width / 25;

				if ((impactPoint < third && ball.dx > 0) || (impactPoint > 24 * third && ball.dx < 0)) {
					ball.dy = -ball.dy;
					ball.dx = -ball.dx;
				} else {
					ball.dy = -ball.dy;
				}
			}
			ball.y = player4.y - ball.radius;
		}

		if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width ||
			ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
			if (lastPlayerHit) {
				switch (lastPlayerHit) {
					case "player": 
						player.score++;
						break;
					case "player2": 
						player2.score++; 
						break;
					case "player3": 
						player3.score++;  
						break;
					case "player4": 
						player4.score++;  
						break;
				}
			}
			// Comprobar si alguien ganó
			const players = [player, player2, player3, player4];
			const winner = players.find(p => p.score === scorepoints);
			if (winner) {
				gameState.winnerMessage =
                    `Player ${
                     winner === player
                     ? player.user?.nick
                     : winner === player2
                     ? p2?.nick
                     : winner === player3
                     ? p3?.nick
                     : p4?.nick
                     } wins! 🥳`;
				gameState.paused = true;
				renderWinner();
			}
			resetBall();
			lastPlayerHit = null;
		}
	}

function renderInitialScreen() {
	drawRect(0, 0, canvas.width, canvas.height, "black");

	// Texto con controles y mensaje de inicio
	const text = `CONTROLS
Player 1: W / S
Player 2: ↑ / ↓
Player 3: C / V
Player 4: L / Ñ

[ PRESS TO START PONG 🎮 ]`;

	const lines = text.split("\n");

	ctx.save();
	ctx.fillStyle = "white";
	ctx.font = "16px 'Press Start 2P', sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	const startY = canvas.height / 2 - (lines.length / 2) * 22; // Centrar vertical
	lines.forEach((line, i) => {
		ctx.fillText(line, canvas.width / 2, startY + i * 22); // 22 = separación entre líneas
	});

	ctx.restore();
}

	function render() {
		if (!gameStarted && !gameState.countdownActive) {
			renderInitialScreen();
			return;
		}
		if (gameState. winnerMessage !== "") {
			renderWinner();
			return;
		}  
		drawRect(0, 0, canvas.width, canvas.height, "black", gameState.backgroundReady ? backgroundGame : undefined);

		drawRect(player.x, player.y, player.width, player.height, player.color);
		drawRect(player2.x, player2.y, player2.width, player2.height, player2.color);
		drawRect(player3.x, player3.y, player3.width, player3.height, player3.color);
		drawRect(player4.x, player4.y, player4.width, player4.height, player4.color);

		drawCircle(ball.x, ball.y, ball.radius, ball.color, gameState.ballReady ? ballImg : undefined);


		drawText(player.score.toString(), 50, canvas.height / 2);
		drawText(player2.score.toString(), canvas.width - 50, canvas.height / 2);
		drawText(player3.score.toString(), canvas.width / 2, 50);
		drawText(player4.score.toString(), canvas.width / 2, canvas.height - 50);
		
		if (gameState.paused && gameState.winnerMessage !== "") {
			ctx.font = "40px Arial";
		ctx.fillStyle = "yellow";
		ctx.textAlign = "center";
		ctx.fillText(gameState.winnerMessage, canvas.width / 2, canvas.height / 2);
		}
	}

	function game() {
		if (gameState.paused && gameStarted && gameState.winnerMessage == "") {
			ctx.save();
			ctx.drawImage(backgroundGame, 0, 0, canvas.width, canvas.height);
			ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.font = "bold 60px 'Press Start 2P', 'Audiowide', sans-serif";
			ctx.fillStyle = "orange";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.shadowColor = "rgba(33, 34, 35, 0.6)";
			ctx.fillText("⏸️ PAUSE", canvas.width / 2, canvas.height / 2 - 40);
			ctx.font = "15px 'Press Start 2P', 'Audiowide', sans-serif";
			ctx.fillStyle = "white";
			ctx.shadowBlur = 0;
			ctx.fillText("▶ CLICK THE SCREEN", canvas.width / 2, canvas.height / 2 + 70);
			ctx.fillText("OR PRESS [SPACE] TO CONTINUE ◀", canvas.width / 2, canvas.height / 2 + 100);
			ctx.restore();
		}
		if (gameState.paused && !gameStarted && !gameState.countdownActive)
			render();
		if (!gameState.paused) {
		update();
		render();
		}
		renderCountdown();
	}

	setInterval(game, 1000 / 60); // 60 el tiempo de ejecución será en milisegundos: un segundo tiene 1000 milisegundos y queremos qeu se actualice 60 veces por segundo
}

