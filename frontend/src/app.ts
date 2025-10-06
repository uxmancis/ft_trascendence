import { routeTo } from "./router";
// import { BackgroundSwitcher } from "./components/BackgroundSwitcher";
import { AccessibilityButton } from "./components/Accessibility_Button";
import { BiggerTextButton } from "./components/ChangeFontSize_Buttons";
import { SmallerTextButton } from "./components/ChangeFontSize_Buttons";

export function initApp() {
  console.log("✅ App initialized");

  routeTo(location.pathname);
  window.addEventListener("popstate", () => routeTo(location.pathname));

  // Persistente en todas las páginas
  // BackgroundSwitcher();
  AccessibilityButton();
  BiggerTextButton();
  SmallerTextButton();

}

