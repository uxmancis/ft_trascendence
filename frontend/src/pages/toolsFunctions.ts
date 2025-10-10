import {gameState} from "./toolsVariables"

export function startCountdown() {
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
