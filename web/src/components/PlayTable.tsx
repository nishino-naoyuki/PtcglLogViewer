import React from 'react';
import type { PlayerBoard, Snapshot } from '../state/types';
import CardIcon from './CardIcon';

interface Props {
  snapshot: Snapshot | null;
}

function renderCardSlot(card: PlayerBoard['active']) {
  if (!card) {
    return <div className="card-slot empty">（なし）</div>;
  }
  return (
    <div className="card-slot">
      <CardIcon name={card.name} />
      <span className="card-label">{card.name}</span>
    </div>
  );
}

function renderBench(bench: PlayerBoard['bench']) {
  if (bench.length === 0) {
    return <div className="card-slot empty">（なし）</div>;
  }
  return bench.map((card, index) => (
    <div key={`${card.name}-${index}`} className="card-slot">
      <CardIcon name={card.name} />
      <span className="card-label">{card.name}</span>
    </div>
  ));
}

export default function PlayTable({ snapshot }: Props) {
  if (!snapshot) {
    return <div className="play-table">盤面情報なし</div>;
  }

  const players = Object.keys(snapshot.board);

  return (
    <div className="play-table">
      {players.map((player, index) => {
        const board = snapshot.board[player];
        const orientation =
          index === 0 ? 'player-side top-side' : 'player-side bottom-side';
        return (
          <div key={player} className={orientation}>
            <div className="player-name">{player}</div>
            <div className="active-section">
              <div className="section-title">バトル場</div>
              {renderCardSlot(board.active)}
            </div>
            <div className="bench-section">
              <div className="section-title">ベンチ</div>
              <div className="bench-cards">{renderBench(board.bench)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}