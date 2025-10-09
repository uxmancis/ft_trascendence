import { routeTo } from "./router";
import { AccessibilityPanel } from "./components/Accessibility/AccessibilityPanel";
import { GameCustomizationPanel } from "./components/GameCustomization/GameCustomizationPanel";
import { Navbar } from "./components/Navbar";


export function initApp() 
{
  console.log("✅ App initialized");
  Navbar();

  // --- Load initial page ---
  routeTo(location.pathname);
  window.addEventListener("popstate", () => routeTo(location.pathname));

  // --- Persistent floating panels ---
  AccessibilityPanel();
  GameCustomizationPanel();
}
