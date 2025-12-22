import db from '../db/database.js';

// Validación de usuario
function isValidUser(u) {
  return u && typeof u === 'object' && 
         typeof u.nick === 'string' && u.nick.trim().length > 0 &&
         typeof u.avatar === 'string' && u.avatar.trim().length > 0;
}

export const getAllUsers = async (req, reply) => {
  try {
    const rows = await db.allAsync("SELECT * FROM users");
    return reply.send(rows);
  } catch (err) {
    return reply.status(500).send({ error: err.message });
  }
};

export const getUserById = async (req, reply) => {
  try {
    const row = await db.getAsync("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (!row) return reply.status(404).send({ error: "Usuario no encontrado" });
    return reply.send(row);
  } catch (err) {
    return reply.status(500).send({ error: err.message });
  }
};

export const createUser = async (req, reply) => {
  const { nick, avatar } = req.body || {};
  
  // Validación
  if (!isValidUser({ nick, avatar })) {
    return reply.status(400).send({ error: "nick and avatar are required and must be non-empty strings" });
  }
  
  try {
    const { lastID } = await db.runAsync(
      "INSERT INTO users (nick, avatar) VALUES (?, ?)",
      [nick.trim(), avatar.trim()]
    );
    return reply.status(201).send({ id: lastID, nick: nick.trim(), avatar: avatar.trim() });
  } catch (err) {
    return reply.status(500).send({ error: err.message });
  }
};

export const deleteUser = async (req, reply) => {
  try {
    const { changes } = await db.runAsync("DELETE FROM users WHERE id = ?", [req.params.id]);
    return reply.send({ deleted: changes });
  } catch (err) {
    return reply.status(500).send({ error: err.message });
  }
};
