export function drawRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, backgroundGame?: HTMLImageElement) {
    if (backgroundGame){
      ctx.drawImage(backgroundGame, x, y, w, h);
    }
    else {
       ctx.fillStyle = color;
       ctx.fillRect(x, y, w, h);
    }
  }