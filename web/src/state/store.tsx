import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import type {
  PlayerBoard,
  Snapshot,
  ViewerContextValue,
  ViewerState,
  ViewerStep,
  ParsedLog
} from './types';
import { buildInitialSnapshot, buildSteps, cloneBoard } from './utils';

const initialState: ViewerState = {
  loading: true,
  error: null,
  players: [],
  steps: [],
  pointer: -1,
  snapshots: [],
  auto: false
};

const GameStateContext = createContext<ViewerContextValue>({
  loading: true,
  error: null,
  players: [],
  pointer: -1,
  totalSteps: 0,
  hasNext: false,
  hasPrev: false,
  auto: false,
  currentStep: null,
  currentSnapshot: null,
  next: () => undefined,
  prev: () => undefined,
  toggleAuto: () => undefined
});

async function fetchSampleLog(): Promise<ParsedLog> {
  const response = await fetch('/sample-log.json');
  if (!response.ok) {
    throw new Error('ログファイルの取得に失敗しました。');
  }
  return response.json();
}

function computeSnapshotForStep(
  steps: ViewerStep[],
  snapshots: Snapshot[],
  pointer: number
): Snapshot | null {
  if (pointer < 0 || pointer >= steps.length) {
    return snapshots[0] ?? null;
  }
  if (snapshots[pointer + 1]) {
    return snapshots[pointer + 1];
  }

  const prevSnapshot = snapshots[pointer] ?? snapshots[0];
  if (!prevSnapshot) return null;

  const nextStep = steps[pointer + 1];
  if (!nextStep) return prevSnapshot;

  const boardCopy: Record<string, PlayerBoard> = cloneBoard(prevSnapshot.board);

  // TODO: 実際のアクションに応じた盤面更新は今後実装
  const nextSnapshot: Snapshot = {
    turnNumber: nextStep.turnNumber,
    side: nextStep.side,
    board: boardCopy
  };
  return nextSnapshot;
}

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ViewerState>(initialState);

  useEffect(() => {
    (async () => {
      try {
        const log = await fetchSampleLog();
        const players = Array.from(
          new Set(log.players.filter((name) => !!name))
        );
        const initialSnapshot = buildInitialSnapshot(log, players);
        const steps = buildSteps(log, players);
        setState({
          loading: false,
          error: null,
          players,
          steps,
          pointer: steps.length > 0 ? 0 : -1,
          snapshots: [initialSnapshot],
          auto: false
        });
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : '未知のエラー'
        }));
      }
    })();
  }, []);

  useEffect(() => {
    if (!state.auto) return;
    if (!state.hasNext) return;
    const timer = setInterval(() => {
      setState((prev) => {
        if (prev.loading || prev.steps.length === 0) return prev;
        if (prev.pointer >= prev.steps.length - 1) {
          return { ...prev, auto: false };
        }
        const maybeNextSnapshot = computeSnapshotForStep(
          prev.steps,
          prev.snapshots,
          prev.pointer
        );
        const snapshots = [...prev.snapshots];
        if (maybeNextSnapshot) {
          snapshots[prev.pointer + 1] = maybeNextSnapshot;
        }
        return {
          ...prev,
          pointer: prev.pointer + 1,
          snapshots,
          auto:
            prev.pointer + 1 >= prev.steps.length - 1 ? false : prev.auto
        };
      });
    }, 1500);
    return () => clearInterval(timer);
  }, [state.auto, state.pointer, state.hasNext, state.steps.length]);

  const next = useCallback(() => {
    setState((prev) => {
      if (prev.loading || prev.pointer >= prev.steps.length - 1) {
        return { ...prev, auto: false };
      }
      const snapshots = [...prev.snapshots];
      const snapshot = computeSnapshotForStep(
        prev.steps,
        snapshots,
        prev.pointer
      );
      if (snapshot) {
        snapshots[prev.pointer + 1] = snapshot;
      }
      return {
        ...prev,
        pointer: prev.pointer + 1,
        snapshots,
        auto:
          prev.pointer + 1 >= prev.steps.length - 1 ? false : prev.auto
      };
    });
  }, []);

  const prev = useCallback(() => {
    setState((prevState) => {
      if (prevState.loading || prevState.pointer <= 0) {
        return prevState;
      }
      return {
        ...prevState,
        pointer: prevState.pointer - 1,
        auto: false
      };
    });
  }, []);

  const toggleAuto = useCallback(() => {
    setState((prevState) => {
      if (prevState.loading || prevState.steps.length === 0) {
        return prevState;
      }
      if (prevState.pointer >= prevState.steps.length - 1) {
        return prevState;
      }
      return { ...prevState, auto: !prevState.auto };
    });
  }, []);

  const value = useMemo<ViewerContextValue>(() => {
    const { players, steps, pointer, snapshots, loading, error, auto } = state;
    const currentStep = pointer >= 0 ? steps[pointer] ?? null : null;
    const currentSnapshot =
      pointer >= 0
        ? snapshots[pointer + 1] ?? snapshots[pointer] ?? null
        : snapshots[0] ?? null;

    return {
      loading,
      error,
      players,
      pointer,
      totalSteps: steps.length,
      hasNext: pointer < steps.length - 1,
      hasPrev: pointer > 0,
      auto,
      currentStep,
      currentSnapshot,
      next,
      prev,
      toggleAuto
    };
  }, [state, next, prev, toggleAuto]);

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  return useContext(GameStateContext);
}