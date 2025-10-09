
function AddAIGame_Button()
{
    const ai = document.getElementById("game1_ai-btn") as HTMLButtonElement;
    // ai.id = "game1_ai-btn"
    ai.style.backgroundImage = `url(${new URL("/src/assets/game1_ai_light.png", import.meta.url).href})`; //Assign image to button
    

    /* CSS Style */
    ai.style.top = "50%"; //Position in screen, separed 20px from bottom
    ai.style.left = "calc(50% - 500px)"; 
    ai.style.transform = "translate(-50%, -50%)"; //perfect centering
    ai.style.position = "fixed";
    ai.style.width = "300px"; //Button size
    ai.style.height = "300px"; //Button size
    ai.style.backgroundSize = "contain" //So that image fits Button size :)
    // ai.style.background = "transparent";

    ai.addEventListener("click", () => {
        
        /* Micro-animation no needed as it's button and it has it already :) by default */

        /* To Navigate to next Page. SPA navigation. */
        setTimeout(() => 
              {
              window.history.pushState({}, "", "/pong");
              window.dispatchEvent(new PopStateEvent("popstate"));
              }, 100); 
    });

    /* No need to add to body, already in innerHTML of this page */
}

function AddLiveGame_Button()
{
    /* Create Button: Game1 - AI */
    const live = document.getElementById("game2_live-btn") as HTMLButtonElement;
    // live.src = new URL("/src/assets/game2_live_light.png", import.meta.url).href; //Assign image to button
    live.style.backgroundImage = `url(${new URL("/src/assets/game2_live_light.png", import.meta.url).href})`; //Assign image to button

    /* CSS Style */
    live.style.top = "50%"; //Position in screen, separed 20px from bottom
    live.style.left = "50%"; 
    live.style.transform = "translate(-50%, -50%)"; //perfect centering
    live.style.position = "fixed";
    live.style.width = "300px"; //Size
    live.style.height = "300px"; //
    // live.style.background = "transparent";
    live.style.backgroundSize = "contain" //So that image fits Button size :)

    live.addEventListener("click", () => {

        /* Micro-animation no needed as it's button and it has it already :) by default */

        /* To Navigate to next Page */
        setTimeout(() => 
              {
              // SPA navigation (sin recargar)
              // window.history.pushState({}, "", "/pong");
              window.history.pushState({}, "", "/pong");
              window.dispatchEvent(new PopStateEvent("popstate"));
              }, 100); 
    });

    /* No need to add to body, already in innerHTML of this page */
}

function AddTournamentGame_Button()
{
    /* Create Button: Game1 - AI */
    const tournament = document.getElementById("game3_tournament-btn") as HTMLButtonElement;
    // const tournament : HTMLImageElement = document.createElement("img"); //"img" is HTML valid tag
    // tournament.src = new URL("/src/assets/game3_tournament_light.png", import.meta.url).href; //Assign image to button
    tournament.style.backgroundImage = `url(${new URL("/src/assets/game3_tournament_light.png", import.meta.url).href})`; //Assign image to button
    

    /* CSS Style */
    tournament.style.top = "50%"; //Position in screen, separed 20px from bottom
    tournament.style.left = "calc(50% + 500px)"; 
    tournament.style.transform = "translate(-50%, -50%)"; //perfect centering
    tournament.style.position = "fixed";
    tournament.style.width = "300px"; //Size
    tournament.style.height = "300px"; //
    // tournament.style.background = "transparent";
    tournament.style.backgroundSize = "contain" //So that image fits Button size :)

    tournament.addEventListener("click", () => {

        /* Micro-animation no needed as it's button and it has it already :) by default */
        setTimeout(() => 
              {
              // SPA navigation (sin recargar)
              // window.history.pushState({}, "", "/pong");
              window.history.pushState({}, "", "/pong");
              window.dispatchEvent(new PopStateEvent("popstate"));
              }, 100); 
    });

    /* No need to add to body, already in innerHTML of this page */
}

//By including buttons in HTML we make them disappear out from this page (ChooseGamePage() function)
export function ChooseGamePage(root: HTMLElement){

    /* DOM */
    root.innerHTML= `
    <div>
        <h1 class="home-title"> Choose Game Here! :) </h1>

        <button id="game1_ai-btn"> </button>
        <button id="game2_live-btn"> </button>
        <button id="game3_tournament-btn"> </button>
    </div>
        `;

    AddAIGame_Button();
    AddLiveGame_Button();
    AddTournamentGame_Button();
    
}