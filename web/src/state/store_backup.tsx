import React,
  { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  ParsedLog,
  Snapshot,
  ViewerContextValue,
  ViewerState,
  ViewerStep
} from './types';
import { buildInitialSnapshot, buildSteps, cloneBoard } from './utils';

// 初期 state
const initialState: ViewerState = {
  loading: false,
  error: null,
  players: [],
  steps: [],
  pointer: -1,
  snapshots: [],
  auto: false
};

// noop コンテキスト（型安全のため）
const noopCtx: ViewerContextValue = {
  loading: false,
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
  toggleAuto: () => undefined,
  loadParsedLog: (_log: ParsedLog) => undefined
};

// export して使えるようにする
export const GameStateContext = createContext<ViewerContextValue>(noopCtx);

// 簡易スナップショット計算（MVP）
function computeSnapshotForStep(
  steps: ViewerStep[],
  snapshots: Snapshot[],
  pointer: number
): Snapshot | null {
  if (pointer < 0 || pointer >= steps.length) return snapshots[0] ?? null;
  if (snapshots[pointer + 1]) return snapshots[pointer + 1];
  const prev = snapshots[pointer] ?? snapshots[0] ?? null;
  if (!prev) return null;
  const boardCopy = cloneBoard(prev.board);
  const next = steps[pointer + 1];
  return {
    turnNumber: next.turnNumber,
    side: next.side,
    board: boardCopy
  };
}

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ViewerState>(initialState);

  const loadParsedLog = useCallback((log: ParsedLog) => {
    try {
      const players = Array.from(new Set((log.players || []).filter(Boolean)));
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
        error: err instanceof Error ? err.message : 'ログ読み込みエラー'
      }));
    }
  }, []);

  const next = useCallback(() => {
    setState((prev) => {
      if (prev.loading || prev.pointer >= prev.steps.length - 1) return { ...prev, auto: false };
      const snapshots = [...prev.snapshots];
      const snap = computeSnapshotForStep(prev.steps, snapshots, prev.pointer);
      if (snap) snapshots[prev.pointer + 1] = snap;
      return {
        ...prev,
        pointer: prev.pointer + 1,
        snapshots,
        auto: prev.pointer + 1 >= prev.steps.length - 1 ? false : prev.auto
      };
    });
  }, []);

  const prev = useCallback(() => {
    setState((s) => {
      if (s.loading || s.pointer <= 0) return s;
      return { ...s, pointer: s.pointer - 1, auto: false };
    });
  }, []);

  const toggleAuto = useCallback(() => {
    setState((s) => {
      if (s.loading || s.steps.length === 0) return s;
      if (s.pointer >= s.steps.length - 1) return s;
      return { ...s, auto: !s.auto };
    });
  }, []);

  // 自動再生
  useEffect(() => {
    if (!state.auto) return;
    const id = setInterval(() => {
      setState((prev) => {
        if (prev.loading || prev.steps.length === 0) return prev;
        if (prev.pointer >= prev.steps.length - 1) {
          return { ...prev, auto: false };
        }
        const snapshots = [...prev.snapshots];
        const snap = computeSnapshotForStep(prev.steps, snapshots, prev.pointer);
        if (snap) snapshots[prev.pointer + 1] = snap;
        return { ...prev, pointer: prev.pointer + 1, snapshots };
      });
    }, 1500);
    return () => clearInterval(id);
  }, [state.auto, state.steps.length]);

  const value = useMemo<ViewerContextValue>(() => {
    const { players, steps, pointer, snapshots, loading, error, auto } = state;
    const currentStep = pointer >= 0 ? steps[pointer] ?? null : null;
    const currentSnapshot =
      pointer >= 0 ? snapshots[pointer + 1] ?? snapshots[pointer] ?? null : snapshots[0] ?? null;
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
      toggleAuto,
      loadParsedLog
    };
  }, [state, next, prev, toggleAuto, loadParsedLog]);

  return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>;
}

export function useGameState() {
  return useContext(GameStateContext);
}