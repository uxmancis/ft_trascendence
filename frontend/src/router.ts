import { renderHomePage } from "./pages/home";
import { setupPong } from "./pages/pong";
import { setupLivePong } from "./pages/livepong";
import { setupTournamentPong } from "./pages/tournamentpong";


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
          ¡Ready to play! 1 VS AI
        </div>
        <canvas id="pong_AI" width="800" height="500" class="shadow-lg border-4 border-white rounded-lg"></canvas>
      </div>
      `;
      setupPong();
      break;
    case "/livepong":
      root.innerHTML = `
      <div class="flex flex-col items-center justify-center h-screen bg-black">
        <div id="player-names" class="text-white text-2xl font-bold mb-4">
          ¡Ready to play! 1 VS 1
        </div>
        <canvas id="live_pong" width="800" height="500" class="shadow-lg border-4 border-white rounded-lg"></canvas>
      </div>
      `;
      setupLivePong();
      break;
    case "/tournamentpong":
      root.innerHTML = `
      <div class="flex flex-col items-center justify-center h-screen bg-black">
        <div id="player-names" class="text-white text-2xl font-bold mb-4">
          ¡Ready to play! 4 VS 4
        </div>
        <canvas id="tournament_pong" width="500" height="500" class="shadow-lg border-4 border-white rounded-lg"></canvas>
      </div>
      `;
      setupTournamentPong();
      break;
    default:
      root.innerHTML = `<h1 class="text-center text-red-500 mt-20">404 Not Found CACHO MIERDA ESTA</h1>`;
  }
}
