/* Export functions can be called from other files */
export function BackgroundSwitcher() 
{
  // Evitar duplicados si ya existe
  if (document.getElementById("bg-switcher-btn")) return;

  /* const btn = objecto javascript */
  const btn = document.createElement("button");
  btn.id = "bg-switcher-btn";
  btn.textContent = "Cambiar fondito";

  /* CSS styles: button position in screen, size, colour, shape... */
  btn.className = "fixed top-4 right-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition";

  btn.addEventListener("click", () => {
    document.body.style.background = `linear-gradient(to right, #${Math.floor(
      Math.random() * 16777215
    ).toString(16)}, #${Math.floor(Math.random() * 16777215).toString(16)})`;
  });

  document.body.appendChild(btn);
}
