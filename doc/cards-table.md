# cards テーブル仕様

目的: カード基本情報を一元管理する。画像パスやメタデータを格納して CardIcon などが参照できるようにする。

カラム:
- id INTEGER PRIMARY KEY AUTOINCREMENT
- name TEXT NOT NULL UNIQUE  
  - 英語のカード名（検索キー・一意）
- display_name TEXT  
  - 表示用（将来日本語名など）
- type TEXT  
  - 例: "Pokemon", "Trainer", "Energy"
- set_code TEXT  
  - 収録セット識別子
- image_path TEXT  
  - リポジトリ内アセットパス（例: /src/assets/cards/latias.png）
- metadata JSON  
  - 任意の拡張情報（HP, stage, 攻撃など）。SQLite では TEXT として保存。
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

インデックス:
- UNIQUE(name)
- INDEX on type（必要なら追加）

利用例クエリ:
- 名前で検索: SELECT * FROM cards WHERE name LIKE '%' || ? || '%';
- 画像パス取得: SELECT image_path FROM cards WHERE name = ?;

実装メモ:
- 画像ファイルは /web/src/assets/cards/ 配下で管理し、image_path に相対パスを入れる。
- 将来 PostgreSQL に移行する際、metadata を JSONB に変換可能な設計にしておく。