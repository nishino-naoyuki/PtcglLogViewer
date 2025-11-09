import type {
  ParsedAction,
  ParsedLog,
  PlayerBoard,
  Snapshot,
  ViewerStep
} from './types';

export function initialPlayerBoard(name: string): PlayerBoard {
  return {
    active: null,
    bench: [],
    prizes: 6,
    handSize: null
  };
}

export function cloneBoard(
  board: Record<string, PlayerBoard>
): Record<string, PlayerBoard> {
  const copy: Record<string, PlayerBoard> = {};
  for (const [player, data] of Object.entries(board)) {
    copy[player] = {
      active: data.active ? { ...data.active } : null,
      bench: data.bench.map((card) => ({ ...card })),
      prizes: data.prizes,
      handSize: data.handSize
    };
  }
  return copy;
}

const PLAY_ACTIVE_RE = /^(.+?) played (.+?) to the Active Spot\.?$/i;
const PLAY_BENCH_RE = /^(.+?) played (.+?) to the Bench\.?$/i;
const PROMOTE_ACTIVE_RE = /^(.+?) (?:sent|promoted|switched in) (.+?) to the Active Spot\.?$/i;
const RETREAT_RE = /^(.+?) retreated (.+?) to the Bench\.?$/i;
const EVOLVE_RE =
  /^(.+?) evolved (.+?) to (.+?)(?: on the Bench| on the Active Spot| in the Active Spot| to the Bench)?\.?$/i;
const KO_WITH_OWNER_RE = /^(.+?)'s (.+?) was Knocked Out!?$/i;
const KO_SIMPLE_RE = /^(.+?) was Knocked Out!?$/i;
const ACTIVE_ASSIGN_RE =
  /^(.+?) (?:played|put|sent|moved|switched in|promoted|switches|switch(?:ed)?) (.+?) (?:into|to|onto|in) the Active Spot[.!]?$/i;
const ACTIVE_SWITCH_RE =
  /^(.+?) (?:switched|switches) (?:their |your )?Active Pokémon to (.+?)[.!]?$/i;
const ACTIVE_IS_NOW_RE =
  /^(.+?)(?:'s)? Active Pokémon is (?:now )?(.+?)[.!]?$/i;
const BENCH_ASSIGN_RE =
  /^(.+?) (?:played|put|moved|sent) (.+?) (?:onto|to|into|on) (?:the )?Bench[.!]?$/i;
const BENCH_BENCHED_RE = /^(.+?) benched (.+?)[.!]?$/i;

function extractActionText(action: ParsedAction): string | null {
  if (typeof action === 'string') return action;
  if (action && typeof action.raw === 'string') return action.raw;
  return null;
}

function resolvePlayerName(
  actor?: string,
  fallback?: string,
  players: string[] = []
): string | undefined {
  const candidates = [actor, fallback, ...players];
  for (const name of candidates) {
    const trimmed = name?.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (
      lower === 'your' ||
      lower === 'you' ||
      lower === 'opponent' ||
      lower === 'your opponent' ||
      lower === 'the opponent'
    ) {
      continue;
    }
    return trimmed;
  }
  return undefined;
}

function parseActiveChange(
  line: string,
  fallbackPlayer: string | undefined,
  players: string[]
): { player: string; card: string } | null {
  let match = line.match(ACTIVE_ASSIGN_RE);
  if (match) {
    const player = resolvePlayerName(match[1], fallbackPlayer, players);
    if (player) return { player, card: match[2].trim() };
  }

  match = line.match(ACTIVE_SWITCH_RE);
  if (match) {
    const player = resolvePlayerName(match[1], fallbackPlayer, players);
    if (player) return { player, card: match[2].trim() };
  }

  match = line.match(ACTIVE_IS_NOW_RE);
  if (match) {
    const player = resolvePlayerName(match[1], fallbackPlayer, players);
    if (player) return { player, card: match[2].trim() };
  }

  return null;
}

function ensurePlayerBoard(
  board: Record<string, PlayerBoard>,
  player: string
): PlayerBoard {
  if (!board[player]) {
    board[player] = initialPlayerBoard(player);
  }
  return board[player];
}

function removeBenchCard(board: Record<string, PlayerBoard>, player: string, cardName: string) {
  const pb = ensurePlayerBoard(board, player);
  const idx = pb.bench.findIndex((card) => card.name === cardName);
  if (idx >= 0) {
    const [removed] = pb.bench.splice(idx, 1);
    return removed ?? null;
  }
  return null;
}

function addBenchCard(board: Record<string, PlayerBoard>, player: string, cardName: string) {
  const pb = ensurePlayerBoard(board, player);
  pb.bench.push({ name: cardName });
}

function promoteToActive(
  board: Record<string, PlayerBoard>,
  player: string,
  cardName: string
) {
  const pb = ensurePlayerBoard(board, player);
  const previous = pb.active;
  const benchCard = removeBenchCard(board, player, cardName);
  pb.active = benchCard ?? { name: cardName };

  if (previous && previous.name !== cardName) {
    const already = pb.bench.findIndex((card) => card.name === previous.name);
    if (already >= 0) {
      pb.bench.splice(already, 1);
    }
    pb.bench.push(previous);
  }
}

function removeCardFromBoard(
  board: Record<string, PlayerBoard>,
  player: string,
  cardName: string
): boolean {
  const pb = ensurePlayerBoard(board, player);
  if (pb.active && pb.active.name === cardName) {
    pb.active = null;
    return true;
  }
  const idx = pb.bench.findIndex((card) => card.name === cardName);
  if (idx >= 0) {
    pb.bench.splice(idx, 1);
    return true;
  }
  return false;
}

function removeCardFromAnyPlayer(
  board: Record<string, PlayerBoard>,
  players: string[],
  cardName: string
) {
  for (const player of players) {
    if (removeCardFromBoard(board, player, cardName)) return;
  }
  for (const player of Object.keys(board)) {
    if (removeCardFromBoard(board, player, cardName)) return;
  }
}

function applyActionToBoard(
  board: Record<string, PlayerBoard>,
  raw: string,
  defaultPlayer: string | undefined,
  players: string[]
) {
  const line = raw.trim();
  if (!line) return;

  const activeChange = parseActiveChange(line, defaultPlayer, players);
  if (activeChange) {
    promoteToActive(board, activeChange.player, activeChange.card);
    return;
  }

  let match = line.match(BENCH_ASSIGN_RE);
  if (!match) match = line.match(BENCH_BENCHED_RE);
  if (match) {
    const player = resolvePlayerName(match[1], defaultPlayer, players);
    if (player) {
      const card = match[2].trim();
      removeCardFromBoard(board, player, card);
      addBenchCard(board, player, card);
    }
    return;
  }
}

export function buildInitialSnapshot(
  log: ParsedLog,
  players: string[]
): Snapshot {
  const board: Record<string, PlayerBoard> = {};
  players.forEach((player) => {
    board[player] = initialPlayerBoard(player);
  });

  const prizeRegex = /^(.+?) drew (\d+) cards for the opening hand[.!]?$/i;
  const bonusDrawRegex =
    /^(.+?) drew (\d+) more card[s]? because (.+?) took at least 1 mulligan[.!]?$/i;

  log.setup?.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    applyActionToBoard(board, trimmed, undefined, players);

    let match = trimmed.match(prizeRegex);
    if (match) {
      const [, player, count] = match;
      const resolved = resolvePlayerName(player, undefined, players);
      if (resolved) ensurePlayerBoard(board, resolved).handSize = Number(count);
      return;
    }

    match = trimmed.match(bonusDrawRegex);
    if (match) {
      const [, player, count] = match;
      const resolved = resolvePlayerName(player, undefined, players);
      if (resolved) {
        const pb = ensurePlayerBoard(board, resolved);
        const current = pb.handSize ?? 0;
        pb.handSize = current + Number(count);
      }
    }
  });

  players.forEach((player) => {
    const pb = ensurePlayerBoard(board, player);
    if (!pb.active && pb.bench.length > 0) {
      pb.active = pb.bench.shift() ?? null;
    }
  });

  return {
    turnNumber: 0,
    side: 'first',
    board
  };
}

export function buildSnapshots(
  log: ParsedLog,
  players: string[]
): Snapshot[] {
  const initial = buildInitialSnapshot(log, players);
  const snapshots: Snapshot[] = [initial];
  let workingBoard = cloneBoard(initial.board);

  log.turns.forEach((turn) => {
    (turn.actions ?? []).forEach((action) => {
      const raw = extractActionText(action);
      if (!raw) return;
      applyActionToBoard(workingBoard, raw, turn.player, players);
    });

    snapshots.push({
      turnNumber: turn.number,
      side: turn.player === players[0] ? 'first' : 'second',
      board: cloneBoard(workingBoard)
    });
  });

  return snapshots;
}

export function buildSteps(
  log: ParsedLog,
  players: string[]
): ViewerStep[] {
  const first = players[0] ?? '';
  return log.turns.map((turn, index) => ({
    id: `${turn.number}-${index}`,
    turnNumber: turn.number,
    player: turn.player,
    side: turn.player === first ? 'first' : 'second',
    actions:
      (turn.actions ?? []).map((action) => {
        const raw = extractActionText(action);
        if (raw) return raw;
        return typeof action === 'string' ? action : JSON.stringify(action);
      }) ?? []
  }));
}