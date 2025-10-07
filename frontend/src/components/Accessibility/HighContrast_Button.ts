/* Export functions can be called from other files */
export function HighContrastButton() 
{
  // Evitar duplicados si ya existe
  if (document.getElementById("bg-switcher-btn")) return;

  /* Create Button */
  const img : HTMLImageElement = document.createElement("img");
  img.src = new URL("/src/assets/accessibility_icon.png", import.meta.url).href;
  img.alt = "Contraste color - Accesibilidad";

  /* CSS style for button*/
  img.style.bottom = "20px"; //Position, separed 20px from bottom
  img.style.right = "20px"; //Position, separed 20px from bottom
  img.style.position = "fixed"; //Mandatory so that width and height actually work
  img.style.width = "40px"; //Size
  img.style.height = "40px"; //Size
  img.style.backgroundColor = "transparent";
  img.style.cursor = "pointer";







  /* Let's make button actually do something when clicking */
  // 1st, we store 4 modes for background-color
  const modes = [
    { background: "#FFFFFF", color: "#000000" }, // light
    { background: "#121212", color: "#FFFFFF" }, // dark
    { background: "#000000", color: "#FFFF00" }, // high contrast 1: black - yellow
    { background: "#000000", color: "#00FFFF" }, // alto contraste 2: black - cian
  ];

  /* 2nd, we make currentMode iterate each time we clic the button */
  let currentMode = 0;
  img.addEventListener("click", () => {

    /* Micro-animación */
    img.style.transition = "transform 0.2s ease";
    img.style.transform = "scale(0.9)"; // presiona hacia dentro
    setTimeout(() => {
      img.style.transform = "scale(1.1)"; // rebota hacia fuera
      setTimeout(() => {
        img.style.transform = "scale(1)"; // vuelve al tamaño original
      }, 100);
    }, 100);

    
    currentMode = (currentMode + 1) % modes.length; // rotar entre 0-1-2
    const { background, color } = modes[currentMode];

    document.body.style.backgroundColor = background;
    document.body.style.color = color;

    console.log(`Modo cambiado a ${currentMode + 1}: fondo ${background}, texto ${color}`);
  });


  /* Added to body */
  document.body.appendChild(img);
}

