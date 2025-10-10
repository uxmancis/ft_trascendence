import db from '../db/database.js';

export const getAllMatches = async (req, reply) => {
  try {
    const rows = await db.allAsync("SELECT * FROM matches");
    return reply.send(rows);
  } catch (err) {
    return reply.status(500).send({ error: err.message });
  }
};

export const getMatchById = async (req, reply) => {
  try {
    const row = await db.getAsync("SELECT * FROM matches WHERE id = ?", [req.params.id]);
    if (!row) return reply.status(404).send({ error: "Partida no encontrada" });
    return reply.send(row);
  } catch (err) {
    return reply.status(500).send({ error: err.message });
  }
};

export const createMatch = async (req, reply) => {
  const { player1_id, player2_id, score_p1, score_p2, winner_id, duration_seconds } = req.body;
  try {
    const { lastID } = await db.runAsync(
      `INSERT INTO matches (player1_id, player2_id, score_p1, score_p2, winner_id, duration_seconds)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [player1_id, player2_id, score_p1, score_p2, winner_id, duration_seconds || 0]
    );
    return reply.status(201).send({ id: lastID });
  } catch (err) {
    return reply.status(500).send({ error: err.message });
  }
};

export const deleteMatch = async (req, reply) => {
  try {
    const { changes } = await db.runAsync("DELETE FROM matches WHERE id = ?", [req.params.id]);
    return reply.send({ deleted: changes });
  } catch (err) {
    return reply.status(500).send({ error: err.message });
  }
};
