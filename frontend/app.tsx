import { useState } from "react";

function App() {
  const [alias, setAlias] = useState("");
  const [message, setMessage] = useState("");

  const saveAlias = async () => {
    const res = await fetch("http://localhost:3000/alias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alias }),
    });

    const data = await res.json();
    if (data.success) {
      setMessage(`Alias guardado con id ${data.id}`);
    } else {
      setMessage("Error al guardar alias");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-2xl mb-4">Elige tu alias</h1>
      <input
        className="border rounded px-3 py-2 mb-2"
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
        placeholder="Escribe tu alias"
      />
      <button
        onClick={saveAlias}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Guardar
      </button>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}

export default App;
