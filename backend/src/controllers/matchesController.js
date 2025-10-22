// src/controllers/matchesController.js
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
  const {
    player1_id,
    player2_id,
    score_p1,
    score_p2,
    winner_id,
    duration_seconds
  } = req.body || {};

  // Permitir detalles tanto planos como anidados en `details`
  const d = req.body?.details || req.body || {};
  const shots_on_target_p1 = Number(d.shots_on_target_p1) || 0;
  const saves_p1           = Number(d.saves_p1)           || 0;
  const shots_on_target_p2 = Number(d.shots_on_target_p2) || 0;
  const saves_p2           = Number(d.saves_p2)           || 0;

  // ¿hay algún detalle real?
  const hasDetails =
    shots_on_target_p1 !== 0 ||
    saves_p1 !== 0 ||
    shots_on_target_p2 !== 0 ||
    saves_p2 !== 0;

  try {
    // Transacción: match + (opcional) match_details
    await db.runAsync('BEGIN');

    const { lastID: matchId } = await db.runAsync(
      `INSERT INTO matches (player1_id, player2_id, score_p1, score_p2, winner_id, duration_seconds)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [player1_id, player2_id, score_p1, score_p2, winner_id, duration_seconds || 0]
    );

    if (hasDetails) {
      await db.runAsync(
        `INSERT INTO match_details (match_id, shots_on_target_p1, saves_p1, shots_on_target_p2, saves_p2)
         VALUES (?, ?, ?, ?, ?)`,
        [matchId, shots_on_target_p1, saves_p1, shots_on_target_p2, saves_p2]
      );
      // Los triggers sobre match_details actualizarán user_stats automáticamente.
    }

    await db.runAsync('COMMIT');
    return reply.status(201).send({ id: matchId });
  } catch (err) {
    try { await db.runAsync('ROLLBACK'); } catch {}
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
