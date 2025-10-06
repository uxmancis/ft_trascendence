// frontend/src/App.tsx
import { useState } from "react";

// Detect backend URL depending on environment
const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:3000/api" // development
    : "http://backend:3000/api";  // Docker Compose network

const App = () => {
  const [alias, setAlias] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const saveAlias = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias }), // backend expects { alias }
      });

      if (!res.ok) throw new Error("Network response was not ok");

      const data = await res.json();
      if (data.success) {
        setMessage(`Alias saved with id ${data.id}`);
        setAlias(""); // clear input
      } else {
        setMessage("Error saving alias");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error saving alias");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-2xl mb-4">Choose your alias</h1>
      <input
        className="border rounded px-3 py-2 mb-2"
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
        placeholder="Enter your alias"
      />
      <button
        onClick={saveAlias}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
      >
        Save
      </button>
      {message && <p className="mt-4 text-gray-700">{message}</p>}
    </div>
  );
};

export default App;
