const input = document.getElementById("alias-input") as HTMLInputElement;
const button = document.getElementById("save-btn") as HTMLButtonElement;
const message = document.getElementById("message") as HTMLParagraphElement;

button.addEventListener("click", async () => {
  const alias = input.value.trim();
  if (!alias) {
    message.textContent = "El alias no puede estar vacío";
    message.className = "mt-4 text-red-600";
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/alias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alias }),
    });

    const data = await res.json();
    if (data.success) {
      message.textContent = `Alias guardado con id ${data.id}`;
      message.className = "mt-4 text-green-600";
    } else {
      message.textContent = "Error al guardar alias";
      message.className = "mt-4 text-red-600";
    }
  } catch (err) {
    message.textContent = "Error al conectar con el servidor";
    message.className = "mt-4 text-red-600";
  }
});
