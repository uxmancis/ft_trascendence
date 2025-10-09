import { updateHomeTexts } from "../components/Accessibility/LanguageButton";
import { Navbar } from "../components/Navbar";

const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : "http://backend:3000/api";

export function renderHomePage(root: HTMLElement) {
  // Redirect if logged in
  const storedAlias = localStorage.getItem("alias");
  if (storedAlias) {
    window.history.replaceState({}, "", "/choose_game");
    window.dispatchEvent(new PopStateEvent("popstate"));
    return;
  }

  // Outer container
  const container = document.createElement("div");
  container.className = "home-container";

  // White card
  const card = document.createElement("div");
  card.className = "home-card";

  // Title
  const title = document.createElement("h1");
  title.className = "home-title";
  title.textContent =  "🏓" + "Pong Challenge";

  // Label
  const label = document.createElement("label");
  label.htmlFor = "alias-input";
  label.textContent = "Choose your alias";

  // Input
  const input = document.createElement("input");
  input.id = "alias-input";
  input.type = "text";
  input.placeholder = "Enter alias";

  // Button
  const button = document.createElement("button");
  button.id = "start-btn";
  button.textContent = "Start Game";
  button.className = "bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded w-full transition";

  // Message paragraph
  const message = document.createElement("p");
  message.id = "message";

  // Append children to card
  [title, label, input, button, message].forEach(el => card.appendChild(el));

  // Append card to container
  container.appendChild(card);

  // Append container to root
  root.innerHTML = ""; // clean previous content
  root.appendChild(container);

  // i18n
  updateHomeTexts("eu");

  // Event listener
  button.addEventListener("click", () => handleLogin(input, message));
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") handleLogin(input, message); });
}

// Login function
async function handleLogin(input: HTMLInputElement, message: HTMLParagraphElement) {
  const alias = input.value.trim();
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

    if (data.success) {
      localStorage.setItem("alias", alias);
      Navbar();
      message.textContent = `✅ Welcome, ${alias}! Starting...`;
      message.className = "text-green-300 mt-4";
      setTimeout(() => {
        window.history.pushState({}, "", "/choose_game");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }, 500);
    } else {
      message.textContent = "❌ Could not save alias.";
      message.className = "text-red-300 mt-4";
    }
  } catch (err) {
    console.error(err);
    message.textContent = "🚨 Connection error";
    message.className = "text-red-400 mt-4";
  }
}
