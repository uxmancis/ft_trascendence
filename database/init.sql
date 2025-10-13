-- ======================================
-- Pong Game + Chat - Base de datos SQLite
-- Autor: Okene
-- ======================================

PRAGMA foreign_keys = ON;

-- ======================================
-- Tabla: users
-- ======================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nick TEXT NOT NULL,
    avatar TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- ======================================
-- Tabla: user_stats
-- ======================================
CREATE TABLE IF NOT EXISTS user_stats (
    user_id INTEGER PRIMARY KEY,
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    goals_scored INTEGER DEFAULT 0,
    goals_received INTEGER DEFAULT 0,
    shots_on_target INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    win_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ======================================
-- Trigger: crear stats automáticamente al crear usuario
-- ======================================

DROP TRIGGER IF EXISTS trg_user_stats_after_insert;

CREATE TRIGGER trg_user_stats_after_insert
AFTER INSERT ON users
BEGIN
  INSERT INTO user_stats (
    user_id, games_played, wins, losses,
    goals_scored, goals_received, shots_on_target, saves,
    win_streak, best_streak
  )
  SELECT
    NEW.id,
    gp,
    MIN(w_raw, gp)                              AS wins,
    gp - MIN(w_raw, gp)                         AS losses,
    gs                                          AS goals_scored,
    gr                                          AS goals_received,
    gs + (ABS(RANDOM()) % 10)                   AS shots_on_target,
    CAST( (gr * 0.6) AS INTEGER )               AS saves,          -- ~60% de tiros recibidos fueron paradas
    streak                                      AS win_streak,
    streak + (ABS(RANDOM()) % 4)                AS best_streak     -- best >= streak
  FROM (
    SELECT
      (ABS(RANDOM()) % 30) AS gp,     -- partidos 0..29
      (ABS(RANDOM()) % 30) AS w_raw,  -- wins provisional (cap a gp)
      (ABS(RANDOM()) % 60) AS gs,     -- goles a favor 0..59
      (ABS(RANDOM()) % 60) AS gr,     -- goles en contra 0..59
      (ABS(RANDOM()) % 6)  AS streak  -- racha actual 0..5
  );
END;

-- ======================================
-- Tabla: matches
-- ======================================
CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1_id INTEGER NOT NULL,
    player2_id INTEGER NOT NULL,
    score_p1 INTEGER NOT NULL,
    score_p2 INTEGER NOT NULL,
    winner_id INTEGER NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (player2_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ======================================
-- Índices recomendados
-- ======================================
CREATE INDEX IF NOT EXISTS idx_matches_winner ON matches(winner_id);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at);

-- ======================================
-- Vista: últimos 5 (por usuario)
-- ======================================
CREATE VIEW IF NOT EXISTS v_last_5_matches AS
SELECT
    u.id AS user_id,
    m.id AS match_id,
    m.player1_id,
    m.player2_id,
    m.score_p1,
    m.score_p2,
    m.winner_id,
    m.created_at
FROM users u
JOIN matches m ON (u.id = m.player1_id OR u.id = m.player2_id)
ORDER BY m.created_at DESC
LIMIT 5;
