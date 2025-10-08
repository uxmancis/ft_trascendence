/* router.ts decides which is the page that is shown */

import { renderHomePage } from "./pages/home";
import { setupPong } from "./pages/pong";
import { ChooseGamePage } from "./pages/choose_game";

export function routeTo(path: string) 
{
  /* Finds <div id = "app>" */
  const root = document.getElementById("app")!;
  root.innerHTML = "";

  switch (path) 
  {
    case "/": /* Home */
      renderHomePage(root);
      break;
    case "/pong":
      root.innerHTML = `<canvas id="pong-canvas" width="800" height="500"></canvas>`;
      setupPong();
      break;
    case "/choose_game":
      ChooseGamePage(root);
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
