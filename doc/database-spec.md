# PTCGL Log Viewer — データベース仕様書（cards / types / effects）

作成日: 2025-11-10  
目的: カード基本情報とカード種別・効果種別をマスター化して管理する。UI や検索での参照を効率化するため、まずは以下の3テーブルを用意する。

設計方針（簡潔）
- 軽量な SQLite を想定。将来 PostgreSQL 等へ移行しやすい正規化設計。
- まずはマスター3テーブルのみ：types（カード種別）、effects（効果種別）、cards（カード情報）。
- 画像はリポジトリ外部の URL を想定し、cards.image_path に URL を格納する。

エンティティ
- types: カードの分類（固定マスター。code は不要）
- effects: 効果の分類（code を保持。ルール：手札に加える系の code は "GET_" プレフィックス。手札に加えない直接的な効果は簡略化した英語名）
- cards: 各カードの基本情報。type_id を参照し、effects は暫定的に effect_codes（カンマ区切り）で保管。将来 junction table に移行可。

テーブル定義（仕様／カラム）

- types
  - id INTEGER PRIMARY KEY AUTOINCREMENT
  - name TEXT NOT NULL UNIQUE
    - 値（初期マスター）: ポケモン, 基本エネルギー, 特殊エネルギー, 道具, グッズ, サポート, スタジアム
  - description TEXT NULL
  - created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

- effects
  - id INTEGER PRIMARY KEY AUTOINCREMENT
  - code TEXT NOT NULL UNIQUE
    - 命名ルール:
      - 手札に加える系: GET_ を先頭につける（例: GET_DRAW, GET_SEARCH, GET_TO_HAND）
      - それ以外: 効果名の短い英語（例: ATTACH, DAMAGE, KO, EVOLVE, SWITCH, PUT_BENCH, DISCARD, SHUFFLE）
  - name TEXT NOT NULL      -- 表示名（英語 / 説明）
  - description TEXT NULL
  - param_schema TEXT NULL  -- 効果パラメータの説明（JSON 文字列）
  - created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

- cards
  - id INTEGER PRIMARY KEY AUTOINCREMENT
  - name TEXT NOT NULL UNIQUE        -- 英語名称（検索キー）
  - display_name TEXT NULL           -- 表示名（将来日本語）
  - type_id INTEGER NULL REFERENCES types(id) ON DELETE SET NULL
  - effect_codes TEXT NULL           -- 暫定: カンマ区切りで effects.code を格納（将来 cards_effects に移行）
  - image_path TEXT NULL             -- 画像 URL を想定（例: https://.../latias_ex.png）
  - metadata TEXT NULL               -- JSON を文字列で格納（hp, stage, abilities など）
  - created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

インデックス / 制約
- types.name UNIQUE
- effects.code UNIQUE
- cards.name UNIQUE
- cards.type_id に対する INDEX（検索高速化のため）

利用例クエリ（SQLite 風）
- 全 types を取得:
  SELECT * FROM types ORDER BY id;
- 全 effects を取得:
  SELECT * FROM effects ORDER BY id;
- カードとタイプを結合して取得:
  SELECT c.*, t.name as type_name FROM cards c LEFT JOIN types t ON c.type_id = t.id WHERE c.name LIKE '%' || ? || '%';
- effects による暫定検索:
  SELECT * FROM cards WHERE effect_codes LIKE '%' || ? || '%';

マイグレーション / 実装メモ
- 将来的に effects の多対多が必要になれば cards_effects (card_id, effect_id) を追加して移行する。
- CardIcon 等は cards.image_path（URL）を直接参照して表示。
- metadata は UI でパースして利用する。

初期データ（推奨）
- types: 「ポケモン」「基本エネルギー」「特殊エネルギー」「道具」「グッズ」「サポート」「スタジアム」
- effects（例）:
  - GET_DRAW, name: "Get Draw"（手札に加える系）
  - GET_SEARCH, name: "Get Search"（手札に加える系）
  - ATTACH, name: "Attach Energy"
  - DAMAGE, name: "Damage"
  - KO, name: "Knock Out"
  - EVOLVE, name: "Evolve"
  - SWITCH, name: "Switch"
  - PUT_BENCH, name: "Put to Bench"（ベンチに直接出す系）
  - DISCARD, name: "Discard"
  - SHUFFLE, name: "Shuffle"

備考
- まずはこの3テーブルで開始。cards.image_path は URL を格納するため、アセット配置の運用と分離できます。