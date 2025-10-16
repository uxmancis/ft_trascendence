import type { Diff } from './PlayAI';
import { Match } from '../api';

import {
	getCurrentUser,
	clearAppStorage, // limpia pong:user, pong:local:p2, pong:local:tournament, etc.
} from '../session';

export function setupPong() 
{
	const canvas = document.getElementById("pong_AI") as HTMLCanvasElement;
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
	
	let ballSpeed = 4; // valor por defecto
	const settings = JSON.parse(sessionStorage.getItem('ai:settings') || '{}');
	console.log("Dificultad seleccionada por el usuario:", settings.difficulty);
	const difficulty: Diff = settings.difficulty || 'normal';

	ballImg.onload = () => {
		console.log("La imagen de la bola ya está lista para dibujar");
		gameState.ballReady = true;};
	
	backgroundGame.onload = () => {
		console.log("La imagen del mapa ya está lista para dibujar");
		gameState.backgroundReady = true;};

	if (difficulty === 'easy') {
		ballSpeed = 3;
		ballImg.src = new URL("/src/assets/customization/emunoz.jpg", import.meta.url).href;
		backgroundGame.src = new URL("/src/assets/customization/arcade1.jpg", import.meta.url).href;
	}
	else if (difficulty === 'normal'){
		ballSpeed = 4;
		ballImg.src = new URL("/src/assets/customization/uxmancis.jpg", import.meta.url).href;
		backgroundGame.src = new URL("/src/assets/customization/arcade3.jpg", import.meta.url).href;
	}
	else if (difficulty === 'hard'){
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
		if (e.key === "ArrowUp") gameState.playerKeysUp = true;
		if (e.key === "ArrowDown") gameState.playerKeysDown = true;
	});

	document.addEventListener("keyup", (e) => {
		if (e.key === "ArrowUp") gameState.playerKeysUp = false;
		if (e.key === "ArrowDown") gameState.playerKeysDown = false;
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
	});

	document.addEventListener("keydown", (e) => {
	if (e.code === "Space") {
		if (gameState. winnerMessage !== "" && !gameState.countdownActive) {
			gameState. winnerMessage = "";
			resetBall();
			startCountdown();
			ai.score = 0;
			player.score = 0;
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
			ai.score = 0;
			player.score = 0;
			return;
		}

		if (gameState. winnerMessage !== "" && !gameState.countdownActive) {
			gameState. winnerMessage = "";
			resetBall();
			startCountdown();
			ai.score = 0;
			player.score = 0;
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
		`Player: ${player.score} - AI: ${ai.score}`,
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

	function updateAI() {
		const now = performance.now();

		let reactionErrorRange: number;
		switch(difficulty) {
			case 'easy': reactionErrorRange = 15; break;
			case 'normal': reactionErrorRange = 5; break;
			case 'hard': reactionErrorRange = 0; ai.height = 100; break;
			default: reactionErrorRange = 5;
		}
	    console.log("Reaction Error calculado:", reactionErrorRange);
		const reactionError = Math.random() * reactionErrorRange * 2 - reactionErrorRange;

		if (now - gameState.lastAiUpdate > 1000) {
			gameState.lastAiUpdate = now;
	
			const aiCenter = ai.y + ai.height / 2;
	
			// Predicción de la posición futura de la bola
			const framesToReachAI = (canvas.width - ball.x) / ball.dx; // tiempo estimado para llegar
			const predictedY = ball.y + ball.dy * framesToReachAI; // posición futura de la bola

			// Rebotes contra el borde
			let targetY = predictedY;
			while (targetY < 0 || targetY > canvas.height) {
			if (targetY < 0) targetY = -targetY; // rebote arriba
			if (targetY > canvas.height) targetY = 2 * canvas.height - targetY; // rebote abajo
			}

			// Añadimos error humano (según dificultad)
			targetY += reactionError;
			if (difficulty === 'easy') {
				targetY *= 0.9 + Math.random() * 0.2; // predicción más imprecisa
			}
			if (aiCenter < targetY - 5) { 
				gameState.aiKeysDown = true;
				gameState.aiKeysUp = false;
			} else if (aiCenter > targetY + 5) {
				gameState.aiKeysUp = true;
				gameState.aiKeysDown = false;
			} else {
				gameState.aiKeysUp = false;
				gameState.aiKeysDown = false;
			}
		}
		if (difficulty === 'hard') {
			if (ai.y + ai.height / 2 < ball.y) 
				{ ai.y += ai.dy; } 
			else { ai.y -= ai.dy; }
		}
		else if (gameState.aiKeysUp) {
			ai.y -= ai.dy;
			if (ai.y < 0) ai.y = 0;
		}
		else if (gameState.aiKeysDown) {
			ai.y += ai.dy; 
			if (ai.y + ai.height > canvas.height) ai.y = canvas.height - ai.height;
		}
	}

	function update() {
		ball.x += ball.dx;
		ball.y += ball.dy;

		// mover AI (sigue la pelota)
		updateAI();
		// if (ai.y + ai.height / 2 < ball.y) 
		//   { ai.y += ai.dy; } 
		// else { ai.y -= ai.dy; }

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
			ball.speed += 0.1
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

		if (collision(ball, ai)) {
			if (
			ball.x - ball.radius < ai.x + ai.width &&
			ball.x + ball.radius > ai.x &&
			ball.y + ball.radius > ai.y &&
			ball.y - ball.radius < ai.y + ai.height
			) {
			let impactPoint = ball.y - ai.y;
			let third = ai.height / 25;
			ball.speed += 0.1
			ball.speed = Math.min(ball.speed, 10);
			if ((impactPoint < third && ball.dy > 0)|| (impactPoint > 24 * third && ball.dy < 0)) {
				ball.dx = -ball.dx;
				ball.dy = -ball.dy;
			} else {
				ball.dx = -ball.dx;
			}
			}
			ball.x = ai.x - ball.radius;
		}
		const user = getCurrentUser();
		if (!user) {  return; }

		if (ball.x - ball.radius < 0) {
			ai.score++;
			ball.speed = ballSpeed;
			if (ai.score === scorepoints) {
			gameState.paused = true;
			gameState. winnerMessage = `💀Sorry, you lose ${user.nick}☠️`;
			renderWinner();
			resetBall();
			return;
			}
			resetBall();
		}

		if (ball.x + ball.radius > canvas.width) {
			player.score++;
			ball.speed = ballSpeed;
			if (player.score === scorepoints) {
			gameState.paused = true;
			gameState. winnerMessage = `Congratulations ${user.nick},🫵you win!💫`;
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
		drawRect(ai.x, ai.y, ai.width, ai.height, ai.color);
		drawCircle(ball.x, ball.y, ball.radius, ball.color, gameState.ballReady ? ballImg : undefined);

		drawText(player.score.toString(), canvas.width / 4, 30);
		drawText(ai.score.toString(), (3 * canvas.width) / 4, 30);
	}

	function game() {
		if (gameState.paused && gameStarted && gameState.winnerMessage == "") {
			ctx.save();
			ctx.drawImage(backgroundGame, 0, 0, canvas.width, canvas.height);
			ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			
			ctx.font = "bold 80px 'Press Start 2P', 'Audiowide', sans-serif";
			ctx.fillStyle = "orange";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.shadowColor = "rgba(33, 34, 35, 0.6)";
			ctx.fillText("⏸️ PAUSE", canvas.width / 2, canvas.height / 2 - 40);
			ctx.font = "20px 'Press Start 2P', 'Audiowide', sans-serif";
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
