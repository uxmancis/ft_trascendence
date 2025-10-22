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

-- Semilla: IA con id = 0 (si no existe)
INSERT OR IGNORE INTO users (id, nick, avatar)
VALUES (0, 'AI Bot', 'https://dummyimage.com/96x96/111827/ffffff&text=AI');

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

-- Opcional: crea stats de la IA si no existen
INSERT OR IGNORE INTO user_stats (user_id) VALUES (0);

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
-- Tabla hija: match_details (métricas extra por partido)
-- ======================================
CREATE TABLE IF NOT EXISTS match_details (
  match_id INTEGER PRIMARY KEY,
  shots_on_target_p1 INTEGER DEFAULT 0,
  saves_p1           INTEGER DEFAULT 0,
  shots_on_target_p2 INTEGER DEFAULT 0,
  saves_p2           INTEGER DEFAULT 0,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

-- ======================================
-- Índices recomendados
-- ======================================
CREATE INDEX IF NOT EXISTS idx_matches_winner     ON matches(winner_id);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at);

-- ======================================
-- Triggers: actualizar user_stats al crear un match
-- ======================================

DROP TRIGGER IF EXISTS trg_matches_after_insert_stats_bootstrap;
CREATE TRIGGER trg_matches_after_insert_stats_bootstrap
AFTER INSERT ON matches
BEGIN
  -- Asegura que existan filas en user_stats para ambos jugadores
  INSERT OR IGNORE INTO user_stats (user_id) VALUES (NEW.player1_id);
  INSERT OR IGNORE INTO user_stats (user_id) VALUES (NEW.player2_id);
END;

DROP TRIGGER IF EXISTS trg_matches_after_insert_totals;
CREATE TRIGGER trg_matches_after_insert_totals
AFTER INSERT ON matches
BEGIN
  -- games_played, goles a favor y en contra para player1
  UPDATE user_stats
  SET
    games_played  = games_played  + 1,
    goals_scored  = goals_scored  + NEW.score_p1,
    goals_received= goals_received+ NEW.score_p2
  WHERE user_id = NEW.player1_id;

  -- games_played, goles a favor y en contra para player2
  UPDATE user_stats
  SET
    games_played  = games_played  + 1,
    goals_scored  = goals_scored  + NEW.score_p2,
    goals_received= goals_received+ NEW.score_p1
  WHERE user_id = NEW.player2_id;

  -- wins / losses
  UPDATE user_stats
  SET wins = wins + 1
  WHERE user_id = NEW.winner_id;

  UPDATE user_stats
  SET losses = losses + 1
  WHERE user_id IN (NEW.player1_id, NEW.player2_id)
    AND user_id <> NEW.winner_id;
END;

DROP TRIGGER IF EXISTS trg_matches_after_insert_streaks;
CREATE TRIGGER trg_matches_after_insert_streaks
AFTER INSERT ON matches
BEGIN
  -- Streaks: ganador +1, aggiorna best_streak
  UPDATE user_stats
  SET
    win_streak = win_streak + 1,
    best_streak = MAX(best_streak, win_streak + 1)
  WHERE user_id = NEW.winner_id;

  -- Streaks: perdedor -> 0
  UPDATE user_stats
  SET win_streak = 0
  WHERE user_id IN (NEW.player1_id, NEW.player2_id)
    AND user_id <> NEW.winner_id;
END;

-- ======================================
-- Triggers: sumar shots/saves al insertar detalles
-- ======================================

DROP TRIGGER IF EXISTS trg_match_details_bootstrap_stats;
CREATE TRIGGER trg_match_details_bootstrap_stats
AFTER INSERT ON match_details
BEGIN
  INSERT OR IGNORE INTO user_stats (user_id)
  SELECT player1_id FROM matches WHERE id = NEW.match_id;

  INSERT OR IGNORE INTO user_stats (user_id)
  SELECT player2_id FROM matches WHERE id = NEW.match_id;
END;

DROP TRIGGER IF EXISTS trg_match_details_after_insert_totals;
CREATE TRIGGER trg_match_details_after_insert_totals
AFTER INSERT ON match_details
BEGIN
  -- Player1
  UPDATE user_stats
  SET
    shots_on_target = shots_on_target + COALESCE(NEW.shots_on_target_p1, 0),
    saves           = saves           + COALESCE(NEW.saves_p1, 0)
  WHERE user_id = (SELECT player1_id FROM matches WHERE id = NEW.match_id);

  -- Player2
  UPDATE user_stats
  SET
    shots_on_target = shots_on_target + COALESCE(NEW.shots_on_target_p2, 0),
    saves           = saves           + COALESCE(NEW.saves_p2, 0)
  WHERE user_id = (SELECT player2_id FROM matches WHERE id = NEW.match_id);
END;

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
