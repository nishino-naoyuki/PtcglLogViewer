import React from 'react';
import CardIcon from './CardIcon';
import type { PlayerBoard, Snapshot } from '../state/types';

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
  if (!bench || bench.length === 0) {
    return <div className="card-slot empty">（なし）</div>;
  }
  return bench.map((card, index) => (
    <div key={`${card.name}-${index}`} className="card-slot">
      <CardIcon name={card.name} />
      <span className="card-label">{card.name}</span>
    </div>
  ));
}

function renderHand(handSize: PlayerBoard['handSize']) {
  if (handSize == null) {
    return <div className="hand-display unknown">手札: ? 枚</div>;
  }
  return <div className="hand-display">手札: {handSize} 枚</div>;
}

export default function PlayTable({ snapshot }: Props) {
  if (!snapshot) {
    return <div className="play-table">盤面情報なし</div>;
  }

  const playerNames = Object.keys(snapshot.board);
  const opponentName = playerNames[0] ?? '相手';
  const selfName = playerNames[1] ?? playerNames[0] ?? 'こちら';

  const opponentBoard: PlayerBoard | undefined = snapshot.board[opponentName];
  const selfBoard: PlayerBoard | undefined = snapshot.board[selfName];

  return (
    <div className="play-table">
      <section className="player-area opponent-area">
        <div className="player-area__name">{opponentName}</div>
        <div className="player-area__hand">{renderHand(opponentBoard?.handSize ?? null)}</div>
        <div className="player-area__bench bench-vertical">
          {opponentBoard ? renderBench(opponentBoard.bench) : <div className="card-slot empty">（なし）</div>}
        </div>
        <div className="player-area__active">{renderCardSlot(opponentBoard?.active ?? null)}</div>
      </section>

      <section className="player-area self-area">
        <div className="player-area__active">{renderCardSlot(selfBoard?.active ?? null)}</div>
        <div className="player-area__bench bench-horizontal">
          {selfBoard ? renderBench(selfBoard.bench) : <div className="card-slot empty">（なし）</div>}
        </div>
        <div className="player-area__hand">{renderHand(selfBoard?.handSize ?? null)}</div>
        <div className="player-area__name">{selfName}</div>
      </section>
    </div>
  );
}