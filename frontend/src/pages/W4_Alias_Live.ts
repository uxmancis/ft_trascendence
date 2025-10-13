    // root.innerHTML = `
    //     <h1> AliasLivePong_Page </h1>
    //     <div class="grid grid-cols-5 grid-rows-20 gap-4">
    //     <div>1</div>
    //     <div class="col-span-5 row-start-20">2</div>
    //     </div>
    // `

//     root.innerHTML = `
//     <div class="flex flex-col min-h-screen">
//       <!-- Title -->
//       <h1 class="text-center text-3xl font-bold my-8">AliasLivePong_Page</h1>

//       <!-- Main content (takes remaining space) -->
//       <div class="flex-grow"></div>

//       <!-- Footer -->
//       <footer class="bg-blue-600 text-white text-center py-4">
//         <p>© 2025 Live Pong — Todos los derechos reservados</p>
//       </footer>
//     </div>
//   `;


export function AliasLivePong_Page(root: HTMLElement){
    /* Classic CSS Style, no Tailwind */
    root.innerHTML = `
      <div style="
        position: relative;
        display: flex;
        flex-direction: row;
        height:100vh;
        width: 100vm;
        overflow: hidden;
      ">

      <!-- Centered Titles on the Top--> 
      <div style ="
        position: absolute;
        top: 2rem;
        left: 50%;
        transform: translateX(-50%);
        text-align: center;
        color: white;
        z-index: 10;
        ">
          <h1> 1 vs 1 </h1>
          <h2> Live pong </h2>
          <h2> Introduce Player 2's Alias on the RIGHT </h1>
      </div>

      <!-- LEFT SIDE --> 
      <div style="
      flex: 1;
      background-image: url('https://images.unsplash.com/photo-1608877907149-d1d8fdd0d3f8?auto=format&fit=crop&w=1000&q=80');
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 2rem;
      font-weight: bold;
      text-shadow: 2px 2px 8px rgba(0,0,0,0.6);
    ">
      Player 1
    </div>

    <!-- RIGHT SIDE --> 
      <div style="
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background-color: #ccc92fff; /* gris claro */
    ">
      <h2 style="font-size: 2rem; margin-bottom: 1rem;">Player 2</h2>
      <input 
        id="alias-input2"
        type="text"
        placeholder="Enter alias"
        style="
          padding: 0.75rem 1rem;
          border: 1px solid #ccc;
          border-radius: 0.5rem;
          width: 70%;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        "
        onfocus="this.style.borderColor='#2563eb'; this.style.boxShadow='0 0 0 2px rgba(37,99,235,0.3)';"
        onblur="this.style.borderColor='#ccc'; this.style.boxShadow='none';"
      />
      <button id="next-btn"> </button>
      <p id="message2" class="mt-4 text-sm text-center"></p>

      <!-- FOOTER -->
      <footer style="
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        background-color: #2563eb;
        color: white;
        text-align: center;
        padding: 1rem;
        font-size: 0.9rem;
      ">
        © 2025 Live Pong — Todos los derechos reservados
      </footer>
    </div>
    `;

    /* Introduce Alias INPUT Box */
    const aliasInput = document.getElementById("alias-input2") as HTMLInputElement;
    
    const message = document.getElementById("message2") as HTMLParagraphElement;

    //async, await, fetch --> modern JavaScript
    aliasInput.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
          aliasInput.click();
        }
        if (!aliasInput) {
        message.textContent = "⚠️ Alias cannot be empty";
        message.className = "text-yellow-200 mt-4";
        return;
        }
        const alias = aliasInput.value.trim(); //removes any spaces at the beginning or end

      /* Send alias to backend:
      *
      *   fetch --> sends an HTTP request
      *   method: "POST" --> means "I'm sending data to the server"
      *   headers: {...} --> Tells the server "I'm sending you JSON (not plain text or a form"
      *   body: JSON. stringify({alias}) --> This is the actual content we send
      *  */
      const res = await fetch("http://localhost:3000/api/users", 
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alias }),
        });

      const data = await res.json(); // Await: pause this function here until the request finishes, but keep rest of the app running.
      console.log(data);
    });


//   
//   console.log(data);
// });

    /* Next Button */
    const next = document.getElementById("next-btn") as HTMLInputElement;
    next.style.backgroundImage = `url(${new URL("/src/assets/next.png", import.meta.url).href})`; //Assign image to button
    next.style.width = "40px"; //Size
    next.style.height = "40px"; //Size
    next.style.cursor = "pointer"; //When passing mouse
    next.style.borderRadius = "50%"; //Shape: Round
    next.style.position = "absolute";
    next.style.top = "50%";
    next.style.right = "10px";
    next.style.backgroundSize = "contain" //So that image fits Button size :)
    next.style.backgroundRepeat = "no-repeat";
    next.style.transform = "translateY(-50%)"; //Centers vertically taking input alias box as a reference.
    next.style.zIndex = "5"; //Makes sure it is in from of everything else in the screen = visible, not behind
}