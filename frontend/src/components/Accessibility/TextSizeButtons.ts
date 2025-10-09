let currentSize = parseFloat(getComputedStyle(document.body).fontSize) || 16;

export function TextSizeButtons(returnElement = false): HTMLElement {
  // Evitar duplicados
  if (!returnElement && document.getElementById("text-size-controls"))
    return document.getElementById("text-size-controls")!;

  const container = document.createElement("div");
  container.id = "text-size-controls";
  container.className = "flex flex-col gap-2"; // posición controlada por el panel

  // Botón A+
  const btnBigger = document.createElement("button");
  btnBigger.id = "btn-bigger-text";
  btnBigger.textContent = "A+";
  btnBigger.className = "text-btn";
  btnBigger.addEventListener("click", () => {
    animateButton(btnBigger);
    currentSize = parseFloat(getComputedStyle(document.body).fontSize);
    if (currentSize < 30) currentSize += 2;
    document.body.style.fontSize = `${currentSize}px`;
  });

  // Botón A-
  const btnSmaller = document.createElement("button");
  btnSmaller.id = "btn-smaller-text";
  btnSmaller.textContent = "A-";
  btnSmaller.className = "text-btn";
  btnSmaller.addEventListener("click", () => {
    animateButton(btnSmaller);
    currentSize = parseFloat(getComputedStyle(document.body).fontSize);
    if (currentSize > 16) currentSize -= 2;
    document.body.style.fontSize = `${currentSize}px`;
  });

  container.appendChild(btnBigger);
  container.appendChild(btnSmaller);

  if (!returnElement) document.body.appendChild(container);
  return container;
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
