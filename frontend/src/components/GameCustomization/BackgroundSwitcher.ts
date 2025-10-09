export function BackgroundSwitcher(returnElement = false): HTMLElement {
  if (!returnElement && document.getElementById("bg-switcher-btn")) return document.getElementById("bg-switcher-btn")!;

  const btn = document.createElement("button");
  btn.id = "bg-switcher-btn";
  btn.textContent = "Cambiar fondito";
  btn.className = "accessibility-btn"; // reutilizamos estilo de botones circulares

  btn.addEventListener("click", () => {
    document.body.style.background = `linear-gradient(to right, #${Math.floor(
      Math.random() * 16777215
    ).toString(16)}, #${Math.floor(Math.random() * 16777215).toString(16)})`;
  });

  if (!returnElement) document.body.appendChild(btn);
  return btn;
}
