export type ParsedAction = string | { raw: string; [key: string]: unknown };

export interface ParsedTurn {
  number: number;
  player: string;
  actions?: ParsedAction[];
}

export interface ParsedLog {
  file: string;
  players: string[];
  setup: string[];
  turns: ParsedTurn[];
  summary?: Record<string, unknown>;
}

export interface CardSlot {
  name: string;
}

export interface PlayerBoard {
  active: CardSlot | null;
  bench: CardSlot[];
  prizes: number;
  handSize: number | null;
}

export interface Snapshot {
  turnNumber: number;
  side: 'first' | 'second';
  board: Record<string, PlayerBoard>;
}

export interface ViewerStep {
  id: string;
  turnNumber: number;
  player: string;
  side: 'first' | 'second';
  actions: string[];
}

export interface ViewerState {
  loading: boolean;
  error: string | null;
  players: string[];
  steps: ViewerStep[];
  pointer: number;
  snapshots: Snapshot[];
  auto: boolean;
}

export interface ViewerContextValue {
  loading: boolean;
  error: string | null;
  players: string[];
  pointer: number;
  totalSteps: number;
  hasNext: boolean;
  hasPrev: boolean;
  auto: boolean;
  currentStep: ViewerStep | null;
  currentSnapshot: Snapshot | null;
  next: () => void;
  prev: () => void;
  toggleAuto: () => void;
  loadParsedLog: (log: ParsedLog) => void; // 追加
}