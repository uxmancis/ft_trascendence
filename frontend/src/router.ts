/* router.ts decides which is the page that is shown */
import { StatsPage } from "./pages/stats";
import { renderHomePage } from "./pages/home";
import { setupPong } from "./pages/pong";
import { ChooseGamePage } from "./pages/choose_game";

export function routeTo(path: string) 
{
  const root = document.getElementById("app")!;

  root.innerHTML = "";

  const alias = localStorage.getItem("alias");

  switch (path) {
    case "/":
      if (alias) {
        window.history.replaceState({}, "", "/choose_game");
        window.dispatchEvent(new PopStateEvent("popstate"));
      } else {
        renderHomePage(root);
      }
      break;

    case "/pong":
      if (!alias) return routeTo("/"); // redirect if not logged in
      root.innerHTML = `<canvas id="pong-canvas" width="800" height="500"></canvas>`;
      setupPong();
      break;

    case "/choose_game":
      if (!alias) return routeTo("/"); // redirect if not logged in
      ChooseGamePage(root);
      break;

    case "/stats":
      if (!alias) return routeTo("/"); // redirect if not logged in
      StatsPage(root);
      break;

    case "/logout":
      localStorage.removeItem("alias");
      window.history.replaceState({}, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
      break;
    
    default:
      root.innerHTML = `<h1 class="text-center text-red-500 mt-20">404 Not Found</h1>`;
  }
}
