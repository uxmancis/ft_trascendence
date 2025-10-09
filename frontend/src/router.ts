/* router.ts decides which is the page that is shown */

import { renderHome_Page } from "./pages/W1_home";
import { setupPong } from "./pages/pong";
import { ChooseGame_Page } from "./pages/W2_choose_game";
import { AliasLivePong_Page } from "./pages/W4_Alias_Live";

export function routeTo(path: string) 
{
  /* Finds <div id = "app>" */
  const root = document.getElementById("app")!;
  root.innerHTML = "";

  switch (path) 
  {
    case "/": /* Home */
      renderHome_Page(root);
      break;
    case "/pong":
      root.innerHTML = `<canvas id="pong-canvas" width="800" height="500"></canvas>`;
      setupPong();
      break;
    case "/choose_game":
      ChooseGame_Page(root);
      break;
    case "/alias_player_livepong":
      AliasLivePong_Page(root);
      break;
    default:
      root.innerHTML = `<h1 class="text-center text-red-500 mt-20">404 Not Found</h1>`;
  }
}

/* About routeTo:
*
*   - Parameter (path: string)
*       Home page: "/"
*   
* */
