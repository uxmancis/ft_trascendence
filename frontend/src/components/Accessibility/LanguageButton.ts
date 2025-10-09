import { translations, LanguageCode } from "../../assets/translations";

const langs: LanguageCode[] = ["eu", "es", "en"];
const flagUrls = [
  new URL("/src/assets/euskera.png", import.meta.url).href,
  new URL("/src/assets/castellano.png", import.meta.url).href,
  new URL("/src/assets/english.png", import.meta.url).href,
];

// Estado actual guardado en localStorage
let currentIndex = parseInt(localStorage.getItem("lang-index") || "0", 10);

export function updateHomeTexts(lang: LanguageCode) {
  document.title = translations[lang].title;

  const title = document.querySelector("h1");
  const label = document.querySelector("label[for='alias-input']");
  const input = document.getElementById("alias-input") as HTMLInputElement;
  const button = document.getElementById("start-btn");

  if (title) title.textContent = translations[lang].title;
  if (label) label.textContent = translations[lang].aliasLabel;
  if (input) input.placeholder = translations[lang].aliasPlaceholder;
  if (button) button.textContent = translations[lang].startButton;
}

export function LanguageButton(returnElement = false): HTMLElement {
  if (!returnElement && document.getElementById("lang-btn")) return document.getElementById("lang-btn")!;

  const img: HTMLImageElement = document.createElement("img");
  img.id = "lang-btn";
  img.src = flagUrls[currentIndex];
  img.alt = "Cambiar idioma";
  img.className = "accessibility-btn"; // Posición controlada por el panel

  updateHomeTexts(langs[currentIndex]);

  img.addEventListener("click", () => {
    animateButton(img);
    currentIndex = (currentIndex + 1) % langs.length;
    localStorage.setItem("lang-index", currentIndex.toString());
    img.src = flagUrls[currentIndex];
    updateHomeTexts(langs[currentIndex]);
    console.log("Idioma seleccionado:", langs[currentIndex]);
  });

  if (!returnElement) document.body.appendChild(img);
  return img;
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
