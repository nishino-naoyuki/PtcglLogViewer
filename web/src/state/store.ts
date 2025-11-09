import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import type {
  ParsedLog,
  Snapshot,
  ViewerContextValue,
  ViewerState
} from './types';
import {
  buildSteps,
  buildSnapshots
} from './utils';

const initialState: ViewerState = {
  loading: false,
  error: null,
  players: [],
  steps: [],
  pointer: -1,
  snapshots: [],
  auto: false
};

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

export const GameStateContext = createContext<ViewerContextValue>(noopCtx);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ViewerState>(initialState);

  const loadParsedLog = useCallback((log: ParsedLog) => {
    try {
      const players = Array.from(new Set((log.players || []).filter(Boolean)));
      const steps = buildSteps(log, players);
      const snapshots = buildSnapshots(log, players);
      setState({
        loading: false,
        error: null,
        players,
        steps,
        pointer: steps.length > 0 ? 0 : -1,
        snapshots,
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
      if (prev.loading || prev.pointer >= prev.steps.length - 1) {
        return { ...prev, auto: false };
      }
      return {
        ...prev,
        pointer: prev.pointer + 1,
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

  useEffect(() => {
    if (!state.auto) return;
    const id = setInterval(() => {
      setState((prev) => {
        if (prev.loading || prev.steps.length === 0) return prev;
        if (prev.pointer >= prev.steps.length - 1) {
          return { ...prev, auto: false };
        }
        return { ...prev, pointer: prev.pointer + 1 };
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

  return React.createElement(GameStateContext.Provider, { value }, children);
}

export function useGameState() {
  return useContext(GameStateContext);
}