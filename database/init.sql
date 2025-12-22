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
-- Semillas de usuarios base
-- ======================================
INSERT OR IGNORE INTO users (id, nick, avatar) VALUES
  (0, 'AI Bot', 'https://dummyimage.com/96x96/111827/ffffff&text=AI'),
  (1, '4v4',    'https://dummyimage.com/96x96/111827/ffffff&text=4v4'),

-- ======================================
-- Tabla: user_stats (SIMPLIFICADA)
-- ======================================
CREATE TABLE IF NOT EXISTS user_stats (
    user_id INTEGER PRIMARY KEY,
    games_played   INTEGER DEFAULT 0,
    wins           INTEGER DEFAULT 0,
    losses         INTEGER DEFAULT 0,
    goals_scored   INTEGER DEFAULT 0,
    goals_received INTEGER DEFAULT 0,
    win_streak     INTEGER DEFAULT 0,
    best_streak    INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Stats base para la IA
INSERT OR IGNORE INTO user_stats (user_id) VALUES (0);

-- ======================================
-- Tabla: matches (resultado bruto)
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
    FOREIGN KEY (winner_id)  REFERENCES users(id) ON DELETE CASCADE
);

-- ======================================
-- Índices recomendados
-- ======================================
CREATE INDEX IF NOT EXISTS idx_matches_winner     ON matches(winner_id);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at);

-- ======================================
-- Triggers: asegurar stats
-- ======================================
DROP TRIGGER IF EXISTS trg_matches_bootstrap_stats;
CREATE TRIGGER trg_matches_bootstrap_stats
AFTER INSERT ON matches
BEGIN
  INSERT OR IGNORE INTO user_stats (user_id) VALUES (NEW.player1_id);
  INSERT OR IGNORE INTO user_stats (user_id) VALUES (NEW.player2_id);
END;

-- ======================================
-- Triggers: totales (partidos, goles, wins/losses)
-- ======================================
DROP TRIGGER IF EXISTS trg_matches_update_totals;
CREATE TRIGGER trg_matches_update_totals
AFTER INSERT ON matches
BEGIN
  -- Player 1
  UPDATE user_stats SET
    games_played   = games_played + 1,
    goals_scored   = goals_scored + NEW.score_p1,
    goals_received = goals_received + NEW.score_p2
  WHERE user_id = NEW.player1_id;

  -- Player 2
  UPDATE user_stats SET
    games_played   = games_played + 1,
    goals_scored   = goals_scored + NEW.score_p2,
    goals_received = goals_received + NEW.score_p1
  WHERE user_id = NEW.player2_id;

  -- Winner
  UPDATE user_stats
  SET wins = wins + 1
  WHERE user_id = NEW.winner_id;

  -- Loser
  UPDATE user_stats
  SET losses = losses + 1
  WHERE user_id IN (NEW.player1_id, NEW.player2_id)
    AND user_id <> NEW.winner_id;
END;

-- ======================================
-- Triggers: rachas
-- ======================================
DROP TRIGGER IF EXISTS trg_matches_update_streaks;
CREATE TRIGGER trg_matches_update_streaks
AFTER INSERT ON matches
BEGIN
  -- Ganador: incrementa racha y mejor racha
  UPDATE user_stats
  SET
    win_streak  = win_streak + 1,
    best_streak = MAX(best_streak, win_streak + 1)
  WHERE user_id = NEW.winner_id;

  -- Perdedor: racha a 0
  UPDATE user_stats
  SET win_streak = 0
  WHERE user_id IN (NEW.player1_id, NEW.player2_id)
    AND user_id <> NEW.winner_id;
END;

-- ======================================
-- Vista: últimos 5 partidos por usuario
-- ======================================
DROP VIEW IF EXISTS v_last_5_matches;
CREATE VIEW v_last_5_matches AS
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
JOIN matches m
  ON u.id = m.player1_id OR u.id = m.player2_id
ORDER BY m.created_at DESC;
