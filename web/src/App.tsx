import Controls from './components/Controls';
import ActionLog from './components/ActionLog';
import PlayTable from './components/PlayTable';
import PlayerPanel from './components/PlayerPanel';
import { useGameState } from './state/store';

export default function App() {
  const {
    loading,
    error,
    players,
    currentSnapshot,
    currentStep,
    totalSteps,
    pointer
  } = useGameState();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1 className="app-title">PTCGL Turn Viewer</h1>
          <p className="app-subtitle">
            {loading && 'ログ読み込み中...'}
            {error && `エラー: ${error}`}
            {!loading && !error && currentStep
              ? `Turn ${currentStep.turnNumber} - ${currentStep.player}`
              : '準備完了'}
          </p>
        </div>
        <div className="turn-indicator">
          ステップ {totalSteps === 0 ? 0 : pointer + 1}/{totalSteps}
        </div>
      </header>

      <main className="app-main">
        <aside className="player-panels">
          {players.map((player) => (
            <PlayerPanel
              key={player}
              player={player}
              snapshot={currentSnapshot?.board[player]}
            />
          ))}
        </aside>
        <section className="play-area">
          <PlayTable snapshot={currentSnapshot} />
        </section>
      </main>

      <footer className="app-footer">
        <Controls />
        <ActionLog step={currentStep} />
      </footer>
    </div>
  );
}