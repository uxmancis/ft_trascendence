export const paddleHeight = 80;
export const paddleWidth = 10;
export const ballRadius = 15;
export const scorepoints = 3;
  
export const ballImg = new Image();

export const backgroundGame = new Image();

export const gameState = {
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
