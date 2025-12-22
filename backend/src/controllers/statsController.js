import db from '../db/database.js';

const emptyStats = (userId) => ({
  user_id: Number(userId),
  games_played: 0,
  wins: 0,
  losses: 0,
  goals_scored: 0,
  goals_received: 0,
  shots_on_target: 0,
  saves: 0,
  win_streak: 0,
  best_streak: 0,
});

export const getAllStats = async (req, reply) => {
  try {
    const rows = await db.allAsync("SELECT * FROM user_stats");
    return reply.send(rows || []); // siempre array
  } catch (err) {
    return reply.status(500).send({ error: err.message });
  }
};

export const getStatsByUserId = async (req, reply) => {
  try {
    const userId = Number(req.params.id);
    const row = await db.getAsync("SELECT * FROM user_stats WHERE user_id = ?", [userId]);
    // ✅ si no existe, devolvemos stats por defecto (no 404)
    return reply.send(row || emptyStats(userId));
  } catch (err) {
    return reply.status(500).send({ error: err.message });
  }
};

export const createStats = async (req, reply) => {
  const { user_id } = req.body;
  try {
    const { lastID } = await db.runAsync(
      "INSERT INTO user_stats (user_id) VALUES (?)",
      [user_id]
    );
    return reply.status(201).send({ id: lastID || user_id });
  } catch (err) {
    return reply.status(500).send({ error: err.message });
  }
};

export const deleteStats = async (req, reply) => {
  try {
    const userId = Number(req.params.id);
    const { changes } = await db.runAsync("DELETE FROM user_stats WHERE user_id = ?", [userId]);
    return reply.send({ deleted: changes });
  } catch (err) {
    return reply.status(500).send({ error: err.message });
  }
};
