import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import cors from "@fastify/cors";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ------------------- ESM __dirname ------------------- //
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------- Fastify ------------------- //
const fastify = Fastify({ logger: true });

// ------------------- CORS ------------------- //
await fastify.register(cors, 
  {
    origin: "*", // or ["http://localhost:73"]
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

// ------------------- Database ------------------- //
const dataDir = path.join(__dirname, "../../data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "sqlite.db");
const db: Database<sqlite3.Database, sqlite3.Statement> = await open({
  filename: dbPath,
  driver: sqlite3.Database,
});

// ------------------- Routes ------------------- //

// Health check
fastify.get("/api/health", async () => ({
  status: "ok",
  service: "backend",
  db: "sqlite",
}));

// Create user alias
fastify.post("/api/users", async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as { alias?: string };
    if (!body?.alias) return reply.code(400).send({ error: "Alias required" });

    const result = await db.run("INSERT INTO users (alias) VALUES (?)", body.alias);
    return { success: true, id: result.lastID, alias: body.alias };
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: "Internal server error" });
  }
});

// Get all users
fastify.get("/api/users", async () => {
  return db.all<{ id: number; alias: string; created_at: string }[]>(
    "SELECT * FROM users ORDER BY created_at DESC"
  );
});

// Post a message
fastify.post("/api/messages", async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as { user_id?: number; text?: string };
    if (!body.user_id || !body.text)
      return reply.code(400).send({ error: "user_id and text required" });

    const result = await db.run(
      "INSERT INTO messages (user_id, text) VALUES (?, ?)",
      body.user_id,
      body.text
    );
    return { success: true, id: result.lastID, user_id: body.user_id, text: body.text };
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: "Internal server error" });
  }
});

// Get all messages
fastify.get("/api/messages", async () => {
  return db.all<{
    id: number;
    text: string;
    created_at: string;
    alias: string;
  }[]>(`
    SELECT m.id, m.text, m.created_at, u.alias
    FROM messages m
    JOIN users u ON m.user_id = u.id
    ORDER BY m.created_at DESC
  `);
});

// ------------------- Start server ------------------- //
try {
  await fastify.listen({ port: 3000, host: "0.0.0.0" });
  fastify.log.info("🚀 Backend running on http://0.0.0.0:3000");
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
