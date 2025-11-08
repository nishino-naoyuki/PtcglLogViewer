import CardIcon from './CardIcon';
import type { Snapshot, PlayerBoard } from '../state/types';

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
              <div className="bench-cards">
                {board.bench.length === 0 && (
                  <div className="card-slot empty">（なし）</div>
                )}
                {board.bench.map((card, idx) => (
                  <div key={`${card.name}-${idx}`} className="card-slot">
                    <CardIcon name={card.name} />
                    <span className="card-label">{card.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}