export const paddleHeight = 80;
export const paddleWidth = 10;
export const ballRadius = 15;
export const scorepoints = 3;
  
export const ballImg = new Image();

export const backgroundGame = new Image();

export const SCORE_ANIM_DURATION = 1000; // 1 segundo
export const MAX_SCALE = 3;            // tamaño máximo al aparecer el score

export let scoreAnimation = {
    player: { scale: 1, startTime: 0 },
    player2: { scale: 1, startTime: 0 },
    player3: { scale: 1, startTime: 0 },
    player4: { scale: 1, startTime: 0 },
    ai: { scale: 1, startTime: 0 },
};

export const gameState = {
    countdownActive: false,
    countdownValue: 3,
    countdownTimer: null as number | null,
    gameStarted: false,
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
