import type { ParsedLog } from '../state/types';

const TURN_HEADER_RE = /^Turn #\s*(\d+)\s*-\s*(.+?)'s Turn/i;
const PLAYER_LINE_RE =
  /^(.*?) (?:chose|won|decided|drew|played|attached|evolved|used|is now|took|put|flipped|revealed|reveals|searches|conceded|wins)/i;
const OPENING_DRAW_RE = /(.+?) drew 7 cards for the opening hand/i;

function extractPlayersFromSetup(lines: string[]): string[] {
  const players = new Set<string>();
  lines.forEach((line) => {
    const match = line.match(PLAYER_LINE_RE);
    if (match) players.add(match[1].trim());
    const opening = line.match(OPENING_DRAW_RE);
    if (opening) players.add(opening[1].trim());
  });
  return Array.from(players);
}

export function parsePtcglLog(raw: string, fileName = 'pasted-log'): ParsedLog {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { file: fileName, players: [], setup: [], turns: [] };
  }

  const setup: string[] = [];
  const turns: ParsedLog['turns'] = [];
  let currentTurn: { number: number; player: string; actions: string[] } | null =
    null;

  let i = 0;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (TURN_HEADER_RE.test(line)) break;
    setup.push(line);
  }

  for (; i < lines.length; i++) {
    const line = lines[i];
    const header = line.match(TURN_HEADER_RE);
    if (header) {
      if (currentTurn) turns.push(currentTurn);
      currentTurn = {
        number: Number(header[1]),
        player: header[2].trim(),
        actions: []
      };
      continue;
    }
    if (!currentTurn) {
      setup.push(line);
    } else {
      currentTurn.actions.push(line);
    }
  }
  if (currentTurn) turns.push(currentTurn);

  const playerSet = new Set<string>();
  extractPlayersFromSetup(setup).forEach((p) => playerSet.add(p));
  turns.forEach((turn) => {
    if (turn.player) playerSet.add(turn.player);
  });

  return {
    file: fileName,
    players: Array.from(playerSet),
    setup,
    turns
  };
}

export function looksLikeParsedLog(value: unknown): value is ParsedLog {
  if (!value || typeof value !== 'object') return false;
  const obj = value as ParsedLog;
  return (
    typeof obj.file === 'string' &&
    Array.isArray(obj.players) &&
    Array.isArray(obj.setup) &&
    Array.isArray(obj.turns)
  );
}