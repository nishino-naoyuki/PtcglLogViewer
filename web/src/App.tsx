import React from 'react';
import Controls from './components/Controls';
import PlayTable from './components/PlayTable';
import ActionLog from './components/ActionLog';
import LogLoader from './components/LogLoader';
import { GameStateProvider, useGameState } from './state/store';
import prizeCardImage from './assets/prizes/prizecard.png';

function Viewer() {
  const {
    currentSnapshot,
    currentStep,
    players,
    pointer,
    totalSteps
  } = useGameState();

  const topName = players[0] ?? '相手';
  const bottomName = players[1] ?? players[0] ?? 'こちら';

  const topPrizes = currentSnapshot?.board?.[topName]?.prizes;
  const bottomPrizes = currentSnapshot?.board?.[bottomName]?.prizes;

  const renderPrizeRow = (count: unknown) => {
    if (typeof count !== 'number' || Number.isNaN(count)) {
      return <span className="scoreboard__prize-text">残りサイド: ?</span>;
    }
    const safeCount = Math.max(0, Math.min(6, Math.trunc(count)));
    return (
      <div className="scoreboard__prize-wrapper">
        <div className="scoreboard__prize-cards">
          {Array.from({ length: safeCount }).map((_, index) => (
            <img
              key={index}
              src={prizeCardImage}
              alt="サイドカード"
              className="scoreboard__prize-card"
              draggable={false}
            />
          ))}
        </div>
        <span className="scoreboard__prize-text">残りサイド: {safeCount}</span>
      </div>
    );
  };

  return (
    <div className="app-shell">
      <header className="scoreboard">
        <div className="scoreboard__side">
          <span className="scoreboard__player">{topName}</span>
          {renderPrizeRow(topPrizes)}
        </div>
        <div className="scoreboard__center">
          <div className="scoreboard__turn">
            現在ターン: {currentStep?.turnNumber ?? 0}
          </div>
          <div className="scoreboard__step">
            ステップ: {totalSteps === 0 ? '-' : `${pointer + 1} / ${totalSteps}`}
          </div>
        </div>
        <div className="scoreboard__side">
          <span className="scoreboard__player">{bottomName}</span>
          {renderPrizeRow(bottomPrizes)}
        </div>
      </header>
      <main className="viewer-layout">
        <PlayTable snapshot={currentSnapshot} />
        <aside className="viewer-sidebar">
          <ActionLog step={currentStep} />
          <Controls />
        </aside>
      </main>
      <section className="loader-section">
        <LogLoader />
      </section>
    </div>
  );
}

export default function App() {
  return (
    <GameStateProvider>
      <Viewer />
    </GameStateProvider>
  );
}