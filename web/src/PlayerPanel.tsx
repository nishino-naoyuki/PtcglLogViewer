import CardIcon from './components/CardIcon';
import type { PlayerBoard } from './state/types';

interface Props {
  player: string;
  snapshot?: PlayerBoard;
}

export default function PlayerPanel({ player, snapshot }: Props) {
  return (
    <section className="player-panel">
      <h2>{player}</h2>
      {snapshot ? (
        <>
          <div>残りサイド: {snapshot.prizes}</div>
          <div>手札枚数: {snapshot.handSize ?? '不明'}</div>
          <div className="panel-active">
            <strong>バトル場</strong>
            <div className="panel-card">
              {snapshot.active ? (
                <>
                  <CardIcon name={snapshot.active.name} />
                  <span>{snapshot.active.name}</span>
                </>
              ) : (
                <span>なし</span>
              )}
            </div>
          </div>
        </>
      ) : (
        <p>情報なし</p>
      )}
    </section>
  );
}