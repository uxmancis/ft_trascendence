import Fastify from "fastify";
import Database from "better-sqlite3";
import cors from "@fastify/cors";

const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: "*",   // o pon "http://localhost:8080" para ser más seguro
});

const db = new Database("/data/sqlite.db"); // volumen compartido

// Crear tabla si no existe
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alias TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Endpoint para guardar alias
fastify.post("/alias", async (req, reply) => {
  const { alias } = req.body;
  if (!alias) return reply.code(400).send({ error: "Alias requerido" });

  const stmt = db.prepare("INSERT INTO users (alias) VALUES (?)");
  const info = stmt.run(alias);

  return { success: true, id: info.lastInsertRowid };
});

// Test
fastify.get("/users", async () => {
  return db.prepare("SELECT * FROM users").all();
});

fastify.listen({ port: 3000, host: "0.0.0.0" });
