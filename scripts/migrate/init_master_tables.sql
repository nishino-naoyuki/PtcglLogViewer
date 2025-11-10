PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS effects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  param_schema TEXT, -- JSON 文字列
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT,
  type_id INTEGER,
  effect_codes TEXT, -- 暫定: カンマ区切りで effect.code を格納。将来 junction table に移行
  image_path TEXT,   -- URL を想定
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(type_id) REFERENCES types(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_cards_type_id ON cards(type_id);

-- 初期 types（7種類）
INSERT OR IGNORE INTO types (name) VALUES
  ('ポケモン'),
  ('基本エネルギー'),
  ('特殊エネルギー'),
  ('道具'),
  ('グッズ'),
  ('サポート'),
  ('スタジアム');

-- 初期 effects（命名ルールに従う）
INSERT OR IGNORE INTO effects (code, name) VALUES
  ('GET_DRAW', 'Get Draw'),
  ('GET_SEARCH', 'Get Search'),
  ('GET_TO_HAND', 'Get to Hand'),
  ('ATTACH', 'Attach Energy'),
  ('DAMAGE', 'Damage'),
  ('KO', 'Knock Out'),
  ('EVOLVE', 'Evolve'),
  ('SWITCH', 'Switch'),
  ('PUT_BENCH', 'Put to Bench'),
  ('DISCARD', 'Discard'),
  ('SHUFFLE', 'Shuffle');