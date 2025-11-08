# フォルダ構成（Node.js + Express 前提）

目的  
このドキュメントは本プロジェクトの推奨フォルダ構成と各フォルダ／主要ファイルの役割、開発起動手順（Express をバックエンドに使用）をまとめたものです。

トップ構成（推奨ツリー）
- /workspaces/PtcglLogViewer
  - .cache/                            # 動的キャッシュ（カード画像など）
  - doc/
    - logsample/                       # 元ログ（.txt）
    - logsample/parsed/                # 既存の解析済JSON
    - TURN_VIEWER_SPEC.md
    - TURN_VIEWER_UI.md
    - TURN_VIEWER_ARCHITECTURE.md
    - FOLDER_STRUCTURE.md              ← （本ファイル）
  - scripts/
    - parse_logsample.js               # 既存のログ解析スクリプト
    - (以前の簡易 proxy があればここに)
  - server/                            # Express バックエンド（カード画像プロキシ等）
    - package.json
    - src/
      - index.js                       # Express 起点（/card-image エンドポイントなど）
      - cache.js                       # キャッシュ用ユーティリティ（.cache 配下保存）
      - ptcgApi.js                     # PTCG API 呼び出しラッパー（APIキー処理・正規化）
      - normalizeName.js               # ログ名→API検索名 正規化ロジック
  - web/                               # フロントエンド（React + Vite 想定）
    - package.json
    - vite.config.ts
    - src/
      - main.tsx / main.jsx
      - App.tsx
      - components/
        - PlayTable.tsx
        - PlayerPanel.tsx
        - Controls.tsx
        - CardIcon.tsx                 # 画像取得ロジックを持つ（server に問い合わせ）
        - ActionLog.tsx
      - state/
        - store.ts
        - slices/
          - gameState.ts
      - api/
        - pokemonTcg.ts                # server 経由でカード画像を取得するクライアント
    - public/                          # 固定アセット（プレースホルダ画像等）
  - .devcontainer/                     # （存在するなら）devcontainer 設定
  - package.json                       # ルート（開発補助スクリプト：concurrently 等）
  - README.md

各要素の説明（簡潔）
- server/src/index.js
  - Express サーバ。エンドポイント例:
    - GET /card-image?name=<name>  → { name, url }（PTCG API を叩き image.large を返す）
  - キャッシュ機構（メモリ + ワークスペース/.cache/card-img.json）
  - 環境変数:
    - PTCG_API_KEY（任意、ヘッダ X-Api-Key にセット）
    - CARD_PROXY_PORT（既定: 3001）
    - CARD_CACHE_PATH（既定: .cache/card-img.json）
- server/src/normalizeName.js
  - ログ内の日本語表記や記号を API 検索しやすい文字列に変換
  - 部分一致→最良候補選択のロジックを収容
- web/src/components/CardIcon.tsx
  - カード名を渡すと server の /card-image を叩き画像URLを取得・キャッシュして表示
  - 取得失敗時はプレースホルダを表示
- scripts/parse_logsample.js
  - doc/logsample/*.txt を解析して doc/logsample/parsed/*.json を生成する既存スクリプト

推奨 package.json のスクリプト（例：ルート）
- ルート package.json（開発時の便宜）
  - "dev:server": "node server/src/index.js"  または "nodemon server/src/index.js"
  - "dev:web": "cd web && npm run dev"
  - "dev": "concurrently \"npm:dev:server\" \"npm:dev:web\""  （concurrently を利用する場合）
  - "start": "node server/src/index.js"  （プロダクション向け）

起動手順（開発環境: dev container / Ubuntu 24.04）
1. server を起動
   - cd /workspaces/PtcglLogViewer/server
   - npm install
   - CARD_PROXY_PORT=3001 PTCG_API_KEY=<your_key> node src/index.js
   - （または）npm run dev
2. web を起動
   - cd /workspaces/PtcglLogViewer/web
   - npm install
   - npm run dev
3. ブラウザで確認
   - "$BROWSER" http://localhost:5173  （フロント）
   - "$BROWSER" http://localhost:3001/card-image?name=Drakloak  （プロキシ動作確認）

キャッシュ場所
- ディスクキャッシュ: /workspaces/PtcglLogViewer/.cache/card-img.json
- ブラウザ側: localStorage または service worker CacheStorage を推奨

注意点 / 運用メモ
- PTCG API のレート制限に注意。server 側で同時実行数や新規取得頻度を制限すること。  
- カード名の正規化は重要（ログの日本語／英語の揺れに対処）。部分一致ロジックの実装を推奨。  
- dev 用プロキシはセキュリティ簡略化（公開サーバでの運用は API キー管理と CORS 設定に注意）。

拡張案（短く）
- server に /card-metadata キャッシュを追加（画像以外のカード情報を保持）  
- service worker を導入して画像プリフェッチ（次ターン想定のカードを事前取得）  
- ルート package.json に Docker / docker-compose 用のコマンドを追加

以上。