import { renderHomePage } from "./pages/home";
import { setupPong } from "./pages/pong";

export function routeTo(path: string) 
{
  const root = document.getElementById("app")!;
  root.innerHTML = "";

  switch (path) 
  {
    case "/":
      renderHomePage(root);
      break;
    case "/pong":
      root.innerHTML = `<canvas id="pong-canvas" width="800" height="500"></canvas>`;
      setupPong();
      break;
    default:
      root.innerHTML = `<h1 class="text-center text-red-500 mt-20">404 Not Found</h1>`;
  }
}
