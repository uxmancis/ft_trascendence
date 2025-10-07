// export function LanguageButton()
// {
//     /* Duplicate prevention */
//     if (document.getElementById("lang-btn"))
//         return;

//     /* Create Button */
//     const img : HTMLImageElement = document.createElement("img");
//     img.id = "lang-btn";
//     img.src = new URL("/src/assets/basque.png", import.meta.url).href;

//     /* CSS style for button*/
//     img.style.bottom = "20px"; //Position in screen, separed 20px from bottom
//     img.style.left = "20px"; //Position in screen, separed 20px from bottom
//     img.style.position = "fixed"; //Mandatory so that width and height actually work
//     img.style.width = "40px";
//     img.style.height = "40px";
//     img.style.backgroundColor = "transparent";
//     img.style.cursor = "pointer";

//     /* Let's make button actually do something when clicking */

//     img.addEventListener("click", () => {

//         /* Micro-animación */
//         img.style.transition = "transform 0.2s ease";
//         img.style.transform = "scale(0.9)"; // presiona hacia dentro
//         setTimeout(() => {
//         img.style.transform = "scale(1.1)"; // rebota hacia fuera
//         setTimeout(() => {
//             img.style.transform = "scale(1)"; // vuelve al tamaño original
//         }, 100);
//         }, 100);

//         /* Next language - Change mode */

//         /* Update icon depending on mode */
//         if (currentTrack === tracks.length)
//             img.src = new URL("/src/assets/silence.png", import.meta.url).href;
//         else if()
//             img.src = new URL("/src/assets/music_next.png", import.meta.url).href;
    
//     });

//     /* Added to body */
//     document.body.appendChild(img);

// }