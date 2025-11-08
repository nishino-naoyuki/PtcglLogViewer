# ターン再生ビューワー — アーキテクチャ設計

目的  
ptcgl 形式の試合ログ（解析済 JSON）を読み取り、1ターン（先攻/後攻）単位で視覚的に再生するアプリケーションのアーキテクチャを定義する。

要約（高レベル）
- フロントエンド（ブラウザ）: React ベースで UI/アニメーションを実装。parsed JSON を読み込み、ターンごとの状態差分を適用して再生する。
- 軽量バックエンド（開発用プロキシ）: Pokémon TCG API へのリクエストを仲介し、画像 URL をキャッシュして返す（APIキーとレート対策）。
- データ入力: doc/logsample/parsed/*.json（既存のパーサ出力）を読み込み、Action リストを再生対象とする。
- 状態管理: ターン開始・先攻終了・後攻終了のスナップショットを保持し、Next/Back/Auto をサポート。

コンポーネント構成（責務）
- Backend (scripts/card_image_proxy.js)
  - Pokémon TCG API を叩きカード情報を取得（image.large / image.small）。
  - レスポンスをメモリ or ファイルでキャッシュ（TTL: 24h 推奨）。
  - 環境変数: PTCG_API_KEY（設定あれば X-Api-Key ヘッダ使用）。
  - エンドポイント: /card-image?name=<name> → { name, url }。

- Frontend (web/)
  - App: 全体レイアウト・ルーティング（単一ページ）
  - Loader: parsed JSON をロードして正規化（プレイヤー順・初期場の構築）
  - State Manager: currentTurn, currentSide ('first'|'second'), snapshots[], actionQueue, playing, speed
    - 推奨: Redux (小規模なら React Context + useReducer)
  - Renderer (PlayTable): ActiveArea, Bench, Stadium, Prize の描画とカードアイコン表示
  - CardIcon: カード名を受けて画像 URL を取得（proxy 経由）して画像表示、未取得時はプレースホルダ
  - Controls: Next/Back/Auto/Pause/Slider
  - ActionLog: Raw テキスト表示・デバッグ用
  - Animation Engine: requestAnimationFrame ベースでアクションを逐次実行（Promise で await 可能にする）

データフロー
1. parsed JSON を Loader が読み込み、初期「盤面状態（state）」を生成する。初期 state はスナップショット[0] に保存。  
2. ユーザーが Next を押すと State Manager が currentTurn/currentSide に対応する actions[] を取得し、Animation Engine に渡す。  
3. Animation Engine は各 action を解釈して Renderer に差分コマンドを送る（例: attach → 対象カードにエネアイコンを追加）。各コマンドを await で逐次実行する。  
4. アクション群の再生が完了したら、その時点の state をスナップショットとして保存し表示を停止。Back は直前スナップショットを復元する。  
5. CardIcon は表示時に proxy を叩き、取得した画像を localStorage / IndexedDB にキャッシュする。

状態モデル（例）
- State {
    players: [{ name, prizesRemaining, handCount, bench: [CardInstance], active: CardInstance }],
    stadium: Stadium | null,
    turnNumber: int,
    side: 'first'|'second',
    historyIndex: int
  }
- CardInstance {
    id: unique, name, hp?, damageCounters, energies: { fire: n, water: n, ... }, attachments: [], statusEffects: []
  }

アクション解釈マップ（代表）
- draw → handCount++（可視化では「手札プレビュー」に追加）
- play → bench.push(card) / active = card
- attach → card.energies[TYPE]++
- evolve → replace parent CardInstance with evolved instance (retain attachments where適用)
- attack → card.damageCounters += X; 　KO 判定時は knockout action を発行
- knockout → 対象 card を discard / LostZone / Prize に移動、攻撃側 prizesRemaining-- 等
- other / unknown → raw 表示で注記

スナップショット戦略
- 各「プレイヤーターン終了」ごとに完全スナップショットを保存（Turn 単位なら先攻終了・後攻終了で2つ）。
- メモリ節約: 長い試合は N ターン毎にフル保存、それ以外は差分ログのみ保存。Diff 適用で復元。

カード画像取得・キャッシュ設計
- フロー: CardIcon → proxy(/card-image?name=) → PTCG API → proxy が JSON から images.large を抽出して返却。  
- Proxy はメモリキャッシュ / ワークスペース内ファイルキャッシュ(.cache/card-img.json) を維持。  
- フロントは localStorage / service worker cache に保存して再利用。  
- 名前マッピング: ログ内のカード名（日本語/記号）を英語名や API に合わせて正規化する変換レイヤを用意する。

運用上の注意（短く）
- PTCG API レート制限に注意。大量の並列要求は proxy でスロットルする。  
- カード名の不一致に備え、部分検索やバックアップのテキスト表示を用意する。  
- ログの曖昧箇所（手札下置き等）は UI で「不確定」ラベルを表示する。

実装技術（推奨）
- フロント: React + Vite、TypeScript 推奨
- 状態: Redux Toolkit / React Query（リモート画像取得管理）
- バックエンド: Node.js（express でも可）または、簡易サーバ（scripts/card_image_proxy.js）
- アニメ: CSS トランジション + requestAnimationFrame、anime.js を必要に応じて導入
- 開発環境: dev container（Ubuntu 24.04）。ブラウザ起動: `"$BROWSER" http://localhost:5173`（フロント） / `"$BROWSER" http://localhost:3001/card-image?name=Drakloak`（proxy テスト）

ファイル構成案（ワークスペース）
- /doc
  - TURN_VIEWER_SPEC.md
  - TURN_VIEWER_UI.md
  - TURN_VIEWER_ARCHITECTURE.md    ← 本ファイル
- /scripts
  - parse_logsample.js
  - card_image_proxy.js
- /web
  - package.json
  - src/
    - App.tsx
    - components/
      - PlayTable.tsx
      - PlayerPanel.tsx
      - Controls.tsx
      - CardIcon.tsx
      - ActionLog.tsx
    - state/
      - store.ts
      - slices/
        - gameState.ts
    - api/
      - pokemonTcg.ts
- /doc/logsample/parsed/*.json

起動手順（開発）
1. proxy を起動（dev container 内で）
   - node scripts/card_image_proxy.js
2. web を起動
   - cd web && npm install && npm run dev
3. ブラウザで確認
   - `"$BROWSER" http://localhost:5173`

MVP 実装優先度（短）
1. JSON ロード → 初期盤面表示  
2. Next/Back（ターン単位）でスナップショット復元  
3. CardIcon による画像取得（proxy 経由・キャッシュ）  
4. カード移動 / ダメージ / KO の簡易アニメーション  
5. Auto 再生・速度調整・ActionLog

拡張案（将来）
- マルチログ一括読み込み・比較再生  
- カード名の自動正規化とローカル画像プリフェッチ  
- プレイ解析（主要イベントのハイライト抽出）

以上。実装用の雛形コード / proxy の追加をワークスペースに作成しますか？