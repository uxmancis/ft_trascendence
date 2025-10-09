import { MusicButton } from "./MusicButton";
import { BackgroundSwitcher } from "./BackgroundSwitcher";

export function GameCustomizationPanel() 
{
  // Evitar duplicados
  if (document.getElementById("game-custom-panel")) return;

  const panel = document.createElement("div");
    panel.id = "game-custom-panel";
    panel.className = "game-custom-panel";

  // Añadir botones al panel
  const musicBtn = MusicButton(true);
  const bgBtn = BackgroundSwitcher(true);

  [musicBtn, bgBtn].forEach(btn => panel.appendChild(btn));

  document.body.appendChild(panel);
}
