import { updateHomeTexts } from "../components/Accessibility/Language_Button";

export function renderHomePage(root: HTMLElement) {
    root.innerHTML = `
      <div class="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <h1 class="text-4xl font-bold mb-8">🏓 Pong Challenge</h1>
        
        <div class="bg-white text-gray-800 p-6 rounded-2xl shadow-lg w-80 flex flex-col items-center">
          <label for="alias-input" class="mb-2 text-lg font-semibold">Choose your alias</label>
          <input 
            id="alias-input" 
            type="text" 
            class="border border-gray-300 rounded px-3 py-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Enter alias"
          />
          <button 
            id="start-btn"
            class="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded w-full transition"
          >
            Start Game
          </button>
          <p id="message" class="mt-4 text-sm text-center"></p>
        </div>
      </div>
    `;
  
    const aliasInput = document.getElementById("alias-input") as HTMLInputElement;
    const startButton = document.getElementById("start-btn") as HTMLButtonElement;
    const message = document.getElementById("message") as HTMLParagraphElement;
  
    const API_BASE =
      window.location.hostname === "localhost"
        ? "http://localhost:3000/api"
        : "http://backend:3000/api"; // en Docker Compose
  
    startButton.addEventListener("click", async () => {
      const alias = aliasInput.value.trim();
      if (!alias) {
        message.textContent = "⚠️ Alias cannot be empty";
        message.className = "text-yellow-200 mt-4";
        return;
      }
  
      try {
        const res = await fetch(`${API_BASE}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alias }),
        });
  
        if (!res.ok) throw new Error("Server error");
        const data = await res.json();
  
        if (data.success) 
        {
          message.textContent = `✅ Welcome, ${alias}! Starting...`;
          message.className = "text-green-300 mt-4";
  
          setTimeout(() => 
            {
            // SPA navigation (sin recargar)
            window.history.pushState({}, "", "/pong");
            window.dispatchEvent(new PopStateEvent("popstate"));
            }, 1000); 
        } 
        else 
        {
          message.textContent = "❌ Could not save alias.";
          message.className = "text-red-300 mt-4";
        }
      } 
      catch (err) {
        console.error(err);
        message.textContent = "🚨 Connection error";
        message.className = "text-red-400 mt-4";
      }
    });
    aliasInput.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
          startButton.click();
        }
    });

    updateHomeTexts("eu");
  }
  