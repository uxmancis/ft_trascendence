import { routeTo } from "./router";
// import { BackgroundSwitcher } from "./components/BackgroundSwitcher";
import { HighContrastButton } from "./components/Accessibility/HighContrast_Button";
import { BiggerTextButton } from "./components/Accessibility/ChangeFontSize_Buttons";
import { SmallerTextButton } from "./components/Accessibility/ChangeFontSize_Buttons";
import { MusicButton } from "./components/Game customization/Music_Button";

export function initApp() {
  console.log("✅ App initialized");

  routeTo(location.pathname);
  window.addEventListener("popstate", () => routeTo(location.pathname));

  // Persistente en todas las páginas

  /* Accessibility module */
  HighContrastButton();
  BiggerTextButton();
  SmallerTextButton();

  /* Game customization */
  MusicButton();

}

