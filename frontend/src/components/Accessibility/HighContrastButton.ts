export function HighContrastButton(returnElement = false): HTMLElement {
  // Evitar duplicados
  if (!returnElement && document.getElementById("high-contrast-btn")) return document.getElementById("high-contrast-btn")!;

  const btn = document.createElement("img");
  btn.id = "high-contrast-btn";
  btn.src = new URL("/src/assets/accessibility_icon.png", import.meta.url).href;
  btn.alt = "Cambiar contraste - Accesibilidad";
  btn.className = "accessibility-btn"; // Posición controlada por el panel

  // Modo actual (guardar en localStorage)
  let currentMode = parseInt(localStorage.getItem("contrast-mode") || "0", 10);

  const modes = [
    { name: "normal", bodyClass: "" },
    { name: "dark", bodyClass: "theme-dark" },
    { name: "high-yellow", bodyClass: "theme-high-yellow" },
    { name: "high-cyan", bodyClass: "theme-high-cyan" },
  ];

  // Aplicar modo actual al cargar
  applyMode(currentMode);

  btn.addEventListener("click", () => {
    animateButton(btn);
    currentMode = (currentMode + 1) % modes.length;
    localStorage.setItem("contrast-mode", currentMode.toString());
    applyMode(currentMode);
    console.log(`Modo de contraste: ${modes[currentMode].name}`);
  });

  if (!returnElement) document.body.appendChild(btn);
  return btn;
}

function animateButton(btn: HTMLElement) {
  btn.style.transition = "transform 0.2s ease";
  btn.style.transform = "scale(0.9)";
  setTimeout(() => {
    btn.style.transform = "scale(1.1)";
    setTimeout(() => {
      btn.style.transform = "scale(1)";
    }, 100);
  }, 100);
}

function applyMode(modeIndex: number) {
  const body = document.body;
  body.classList.remove("theme-dark", "theme-high-yellow", "theme-high-cyan");
  const modeClass = ["", "theme-dark", "theme-high-yellow", "theme-high-cyan"][modeIndex];
  if (modeClass) body.classList.add(modeClass);
}
