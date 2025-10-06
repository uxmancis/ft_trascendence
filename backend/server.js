// backend/server.js
import Fastify from "fastify";
import Database from "better-sqlite3";
import cors from "@fastify/cors";

const fastify = Fastify({ logger: true });

// ✅ Enable CORS for frontend requests
await fastify.register(cors, {
  origin: ["http://localhost:8080"], // or "*" for any origin
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

// ✅ Connect to SQLite DB (shared volume from database container)
const db = new Database("/data/sqlite.db"); // no CREATE TABLE statements here

// ------------------- Routes ------------------- //

// Health check
fastify.get("/api/health", async () => ({
  status: "ok",
  service: "backend",
  db: "sqlite",
}));

// ✅ Create user alias
fastify.post("/api/users", async (req, reply) => {
  try {
    const { alias } = req.body || {};
    if (!alias) return reply.code(400).send({ error: "Alias requerido" });

    const stmt = db.prepare("INSERT INTO users (alias) VALUES (?)");
    const info = stmt.run(alias);

    return { success: true, id: info.lastInsertRowid, alias };
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({ error: "Internal server error" });
  }
});

// ✅ Get all users
fastify.get("/api/users", async () => {
  return db.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
});

// ✅ Post a message
fastify.post("/api/messages", async (req, reply) => {
  try {
    const { user_id, text } = req.body || {};
    if (!user_id || !text) {
      return reply.code(400).send({ error: "user_id and text required" });
    }

    const stmt = db.prepare("INSERT INTO messages (user_id, text) VALUES (?, ?)");
    const info = stmt.run(user_id, text);

    return { success: true, id: info.lastInsertRowid, user_id, text };
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({ error: "Internal server error" });
  }
});

// ✅ Get all messages
fastify.get("/api/messages", async () => {
  return db
    .prepare(`
      SELECT m.id, m.text, m.created_at, u.alias
      FROM messages m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.created_at DESC
    `)
    .all();
});

// ------------------- Start server ------------------- //
try {
  await fastify.listen({ port: 3000, host: "0.0.0.0" });
  fastify.log.info("🚀 Backend running on http://0.0.0.0:3000");
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
