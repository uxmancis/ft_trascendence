import { translations, LanguageCode } from "../../assets/translations";

const langs = ["eu", "es", "en"];

let currentIndex = 0;

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

export function LanguageButton()
{
    /* Duplicate prevention */
    if (document.getElementById("lang-btn"))
        return;

    /* Create Button */
    const img : HTMLImageElement = document.createElement("img");
    img.id = "lang-btn";
    img.src = new URL("/src/assets/euskera.png", import.meta.url).href;

    /* CSS style for button*/
    img.style.bottom = "170px"; //Position in screen, separed 20px from bottom
    img.style.right = "20px"; //Position in screen, separed 20px from bottom
    img.style.position = "fixed"; //Mandatory so that width and height actually work
    img.style.width = "40px"; //Size
    img.style.height = "40px"; //
    img.style.borderRadius = "50%";
    img.style.backgroundColor = "transparent";
    img.style.cursor = "pointer"; //When passing mouse

    /* Let's make button actually do something when clicking */

    //Array de 3 strings
    const flags = [
        new URL("/src/assets/euskera.png", import.meta.url).href, //"http://localhost:5173/src/assets/basque.png"
        new URL("/src/assets/castellano.png", import.meta.url).href,
        new URL("/src/assets/english.png", import.meta.url).href,
    ];

    /* When user 'clicks', the following action will happen: */
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

        /* Next language - Change mode */
        // Move to next mode, index+=1 in loop
        console.log(`current Language: ${currentIndex}`);
        currentIndex = (currentIndex + 1) % flags.length;
        console.log(`current Language: ${currentIndex}`);


        /* Update icon depending on mode */
        img.src = flags[currentIndex]

        /* Update text from page */
        const selectedLang = langs[currentIndex];
        console.log("Chosen language: ", selectedLang);
        updateHomeTexts(selectedLang)


        // else if(currentLanguage === 1)
        //     img.src = new URL("/src/assets/español.png", import.meta.url).href;
        // else if(currentLanguage === 2)
        //     img.src = new URL("/src/assets/english.png", import.meta.url).href;
        // else
        //     img.src = new URL("/src/assets/euskera.png", import.meta.url).href;
    
    });

    /* Added to body */
    document.body.appendChild(img);

}
