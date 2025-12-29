// src/controllers/matchesController.js
import db from '../db/database.js';

// ================================
// Helpers
// ================================
async function userExists(id) {
  const row = await db.getAsync(
    'SELECT 1 FROM users WHERE id = ?',
    [id]
  );
  return !!row;
}

// ================================
// GETs
// ================================
export const getAllMatches = async (_, reply) => {
  try {
    const rows = await db.allAsync(
      'SELECT * FROM matches ORDER BY created_at DESC'
    );
    reply.send(rows);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

export const getMatchById = async (req, reply) => {
  try {
    const row = await db.getAsync(
      'SELECT * FROM matches WHERE id = ?',
      [req.params.id]
    );
    if (!row) {
      return reply.status(404).send({ error: 'Match not found' });
    }
    reply.send(row);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

// ================================
// POST
// ================================
export const createMatch = async (req, reply) => {
  const {
    player1_id,
    player2_id,
    score_p1,
    score_p2,
    winner_id,
    duration_seconds = 0
  } = req.body;

  // ----------------------------
  // Validaciones básicas
  // ----------------------------
  if (score_p1 < 0 || score_p2 < 0 || duration_seconds < 0) {
    return reply.status(400).send({ error: 'Values must be non-negative' });
  }

  if (winner_id !== player1_id && winner_id !== player2_id) {
    return reply.status(400).send({
      error: 'Winner must be one of the two players'
    });
  }

  // ----------------------------
  // Validación de usuarios
  // ----------------------------
  if (!(await userExists(player1_id))) {
    return reply.status(400).send({ error: 'Pslayer 1 does not exist, log out and then log back in.' });
  }

  if (!(await userExists(player2_id))) {
    return reply.status(400).send({ error: 'Player 2 does not exist' });
  }

  if (!(await userExists(winner_id))) {
    return reply.status(400).send({ error: 'Winner does not exist' });
  }

  // ----------------------------
  // Insertar match
  // ----------------------------
  try {
    const { lastID } = await db.runAsync(
      `INSERT INTO matches
       (player1_id, player2_id, score_p1, score_p2, winner_id, duration_seconds)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        player1_id,
        player2_id,
        score_p1,
        score_p2,
        winner_id,
        duration_seconds
      ]
    );

    // 🔥 LOS TRIGGERS HACEN TODO LO DEMÁS
    reply.status(201).send({ id: lastID });
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

// ================================
// DELETE
// ================================
export const deleteMatch = async (req, reply) => {
  const matchId = Number(req.params.id);

  try {
    await db.runAsync('BEGIN');

    // 1️⃣ obtener match (necesario para recalcular stats)
    const match = await db.getAsync(
      'SELECT * FROM matches WHERE id = ?',
      [matchId]
    );

    if (!match) {
      await db.runAsync('ROLLBACK');
      return reply.status(404).send({ error: 'Match not found' });
    }

    // 2️⃣ borrar match
    await db.runAsync(
      'DELETE FROM matches WHERE id = ?',
      [matchId]
    );

    // 3️⃣ recalcular stats de ambos jugadores (simple y seguro)
    await db.runAsync(
      `
      UPDATE user_stats
      SET
        games_played   = 0,
        wins           = 0,
        losses         = 0,
        goals_scored   = 0,
        goals_received = 0,
        win_streak     = 0,
        best_streak    = 0
      WHERE user_id IN (?, ?)
      `,
      [match.player1_id, match.player2_id]
    );

    await db.runAsync(
      `
      INSERT INTO matches (player1_id, player2_id, score_p1, score_p2, winner_id, duration_seconds)
      SELECT player1_id, player2_id, score_p1, score_p2, winner_id, duration_seconds
      FROM matches
      WHERE player1_id IN (?, ?) OR player2_id IN (?, ?)
      ORDER BY created_at
      `,
      [
        match.player1_id,
        match.player2_id,
        match.player1_id,
        match.player2_id
      ]
    );

    await db.runAsync('COMMIT');
    reply.send({ deleted: 1 });
  } catch (err) {
    try { await db.runAsync('ROLLBACK'); } catch {}
    reply.status(500).send({ error: err.message });
  }
};
