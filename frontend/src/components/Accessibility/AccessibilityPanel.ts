import { TextSizeButtons } from "./TextSizeButtons";
import { HighContrastButton } from "./HighContrastButton";
import { LanguageButton } from "./LanguageButton";

export function AccessibilityPanel() 
{
  if (document.getElementById("accessibility-panel")) return;

  const panel = document.createElement("div");
  panel.id = "accessibility-panel";
  panel.className = "accessibility-panel";

  // Crear botones y agregarlos al panel
  const textSizeButtons = TextSizeButtons(true); 
  const contrastBtn = HighContrastButton(true);
  const languageBtn = LanguageButton(true);

  [textSizeButtons, contrastBtn, languageBtn].forEach(btn => {
    panel.appendChild(btn);
  });

  document.body.appendChild(panel);
}