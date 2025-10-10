export const canvas = document.getElementById("pong-canvas") as HTMLCanvasElement;
export const ctx = canvas.getContext("2d")!;

export const paddleHeight = 80;
export const paddleWidth = 10;
export const ballRadius = 15;
export const scorepoints = 3;
 
export const player = {
    x: 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    color: "white",
    dy: 3,
    score: 0,
};
  
export const ai = {
    x: canvas.width - paddleWidth - 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    color: "white",
    dy: 3,
    score: 0,
};
  
export const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: ballRadius,
    speed: 4,
    dx: 4,
    dy: 4,
    color: "white",
};
  
export const ballImg = new Image();

export const backgroundGame = new Image();
