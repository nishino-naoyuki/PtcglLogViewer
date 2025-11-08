import { useGameState } from '../state/store';

export default function Controls() {
  const { loading, next, prev, hasNext, hasPrev, auto, toggleAuto } =
    useGameState();

  return (
    <div className="controls">
      <button onClick={prev} disabled={loading || !hasPrev}>
        ◀ 前へ
      </button>
      <button onClick={next} disabled={loading || !hasNext}>
        次へ ▶
      </button>
      <button onClick={toggleAuto} disabled={loading || !hasNext}>
        {auto ? '停止' : '自動再生'}
      </button>
    </div>
  );
}