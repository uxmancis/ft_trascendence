const input = document.getElementById("alias-input") as HTMLInputElement;
const button = document.getElementById("save-btn") as HTMLButtonElement;
const message = document.getElementById("message") as HTMLParagraphElement;

// Detect backend URL depending on environment
const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : "http://backend:3000/api";

async function saveAlias() {
  const alias = input.value.trim();
  if (!alias) {
    message.textContent = "Alias cannot be empty";
    message.className = "mt-4 text-red-600";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alias }),
    });

    if (!res.ok) throw new Error("Network response was not ok");

    const data = await res.json();
    if (data.success) {
      message.textContent = `Alias saved with id ${data.id}`;
      message.className = "mt-4 text-green-600";

      // Only redirect after success
      setTimeout(() => {
        window.location.href = `/pong.html?alias=${encodeURIComponent(alias)}`;
      }, 500);
    } else {
      message.textContent = "Error saving alias";
      message.className = "mt-4 text-red-600";
    }
  } catch (err) {
    console.error(err);
    message.textContent = "Error connecting to server";
    message.className = "mt-4 text-red-600";
  }
}

button.addEventListener("click", saveAlias);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    saveAlias();
  }
});

document.body.style.background = "linear-gradient(to right, red, yellow)";
