import React from 'react';
import CardIcon from './CardIcon';
import type { PlayerBoard, Snapshot } from '../state/types';

interface Props {
  snapshot: Snapshot | null;
  firstPlayer: string;
  secondPlayer: string;
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

export default function PlayTable({ snapshot, firstPlayer, secondPlayer }: Props) {
  if (!snapshot) {
    return <div className="play-table">盤面情報なし</div>;
  }

  const firstBoard: PlayerBoard | undefined = snapshot.board[firstPlayer];
  const secondBoard: PlayerBoard | undefined = snapshot.board[secondPlayer];

  return (
    <div className="play-table play-table--horizontal">
      <section className="side-area side-area--first">
        <div className="side-area__name">{firstPlayer}</div>
        <div className="side-area__body side-area__body--first">
          <div className="side-area__bench">{renderBench(firstBoard?.bench ?? [])}</div>
          <div className="side-area__active">{renderCardSlot(firstBoard?.active ?? null)}</div>
        </div>
        <div className="side-area__hand">{renderHand(firstBoard?.handSize ?? null)}</div>
      </section>

      <section className="side-area side-area--second">
        <div className="side-area__name">{secondPlayer}</div>
        <div className="side-area__body side-area__body--second">
          <div className="side-area__active">{renderCardSlot(secondBoard?.active ?? null)}</div>
          <div className="side-area__bench">{renderBench(secondBoard?.bench ?? [])}</div>
        </div>
        <div className="side-area__hand">{renderHand(secondBoard?.handSize ?? null)}</div>
      </section>
    </div>
  );
}