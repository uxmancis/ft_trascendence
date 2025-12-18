// src/controllers/matchesController.js
import db from '../db/database.js';

// Validación de IDs de usuarios
async function userExists(userId) {
  try {
    const row = await db.getAsync("SELECT id FROM users WHERE id = ?", [userId]);
    return !!row;
  } catch {
    return false;
  }
}

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

  // Validación de campos requeridos
  if (typeof player1_id !== 'number' || typeof winner_id !== 'number' || 
      typeof score_p1 !== 'number' || typeof score_p2 !== 'number') {
    return reply.status(400).send({ 
      error: "Missing or invalid required fields: player1_id, score_p1, score_p2, winner_id" 
    });
  }

  // player2_id puede ser 0 (para matches vs IA) o un número válido
  if (typeof player2_id !== 'number') {
    return reply.status(400).send({ error: "player2_id must be a number" });
  }

  // Validación de valores
  if (score_p1 < 0 || score_p2 < 0) {
    return reply.status(400).send({ error: "Scores must be non-negative" });
  }
  
  if (duration_seconds && duration_seconds < 0) {
    return reply.status(400).send({ error: "Duration must be non-negative" });
  }

  // player1 siempre debe existir
  // player2 puede ser 0 (IA) o debe existir
  // winner debe ser player1 o player2 (o 0 para IA si player2 es 0)
  if (winner_id !== player1_id && winner_id !== player2_id) {
    return reply.status(400).send({ error: "Winner must be one of the two players" });
  }

  try {
    // Verificar que player1 existe
    const p1Exists = await userExists(player1_id);
    if (!p1Exists) {
      return reply.status(400).send({ error: "Player 1 does not exist in the database" });
    }

    // Verificar player2 solo si no es 0 (IA)
    if (player2_id !== 0) {
      const p2Exists = await userExists(player2_id);
      if (!p2Exists) {
        return reply.status(400).send({ error: "Player 2 does not exist in the database" });
      }
    }

    // Verificar winner (si es 0, solo válido si player2 es 0)
    if (winner_id !== 0) {
      const winnerExists = await userExists(winner_id);
      if (!winnerExists) {
        return reply.status(400).send({ error: "Winner does not exist in the database" });
      }
    } else if (player2_id !== 0) {
      // winner_id = 0 solo es válido para matches de IA
      return reply.status(400).send({ error: "Winner cannot be 0 unless player2 is AI (0)" });
    }

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
