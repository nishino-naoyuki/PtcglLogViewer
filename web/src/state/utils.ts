import type {
  ParsedLog,
  PlayerBoard,
  Snapshot,
  ViewerStep
} from './types';

function initialPlayerBoard(name: string): PlayerBoard {
  return {
    active: null,
    bench: [],
    prizes: 6,
    handSize: null
  };
}

export function buildInitialSnapshot(
  log: ParsedLog,
  players: string[]
): Snapshot {
  const board: Record<string, PlayerBoard> = {};
  players.forEach((player) => {
    board[player] = initialPlayerBoard(player);
  });

  const activeRegex = /^(.+?) played (.+) to the Active Spot\.$/;
  const benchRegex = /^(.+?) played (.+) to the Bench\.$/;
  const prizeRegex = /^(.+?) drew (\d+) cards for the opening hand\.$/;
  const bonusDrawRegex =
    /^(.+?) drew (\d+) more card[s]? because (.+?) took at least 1 mulligan\.$/;

  log.setup?.forEach((line) => {
    let match = activeRegex.exec(line);
    if (match) {
      const [, player, card] = match;
      if (board[player]) {
        board[player].active = { name: card };
      }
      return;
    }

    match = benchRegex.exec(line);
    if (match) {
      const [, player, card] = match;
      if (board[player]) {
        board[player].bench.push({ name: card });
      }
      return;
    }

    match = prizeRegex.exec(line);
    if (match) {
      const [, player, count] = match;
      if (board[player]) {
        board[player].handSize = Number(count);
      }
      return;
    }

    match = bonusDrawRegex.exec(line);
    if (match) {
      const [, player, count] = match;
      if (board[player]) {
        const current = board[player].handSize ?? 0;
        board[player].handSize = current + Number(count);
      }
    }
  });

  return {
    turnNumber: 0,
    side: 'first',
    board
  };
}

export function buildSteps(
  log: ParsedLog,
  players: string[]
): ViewerStep[] {
  const first = players[0] ?? '';
  return log.turns.map((turn, idx) => ({
    id: `${turn.number}-${idx}`,
    turnNumber: turn.number,
    player: turn.player,
    side: turn.player === first ? 'first' : 'second',
    actions: turn.actions?.slice() ?? []
  }));
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