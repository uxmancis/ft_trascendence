import { renderHomePage } from "./pages/home";
import { setupPong } from "./pages/pong";

export function routeTo(path: string) 
{
  /* Finds <div id = "app>" */
  const root = document.getElementById("app")!;
  root.innerHTML = "";

  switch (path) 
  {
    case "/":
      renderHomePage(root);
      break;
    case "/pong":
      root.innerHTML = `
      <div class="flex flex-col items-center justify-center h-screen bg-black">
        <div id="player-names" class="text-white text-2xl font-bold mb-4">
          ESTOY AQUI?
        </div>
        <canvas id="pong-canvas" width="800" height="500" class="shadow-lg border-4 border-white rounded-lg"></canvas>
      </div>
      `;
      setupPong();
      break;
    default:
      root.innerHTML = `<h1 class="text-center text-red-500 mt-20">404 Not Found CACHO MIERDA ESTA</h1>`;
  }
}
