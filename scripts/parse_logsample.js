const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const LOG_DIR = path.join(ROOT, 'doc', 'logsample');
const OUT_DIR = path.join(LOG_DIR, 'parsed');

if (!fs.existsSync(LOG_DIR)) {
  console.error('logsample フォルダが見つかりません:', LOG_DIR);
  process.exit(1);
}
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function safeName(name) {
  return name.replace(/[\/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
}

function extractPlayersFromSetup(lines) {
  const players = new Set();
  const re = /^(.*?) (?:chose|won|decided|drew|played|attached|evolved|used|is now)/i;
  for (const ln of lines) {
    const m = ln.match(re);
    if (m) players.add(m[1].trim());
    const opening = ln.match(/(.+?) drew 7 cards for the opening hand/i);
    if (opening) players.add(opening[1].trim());
  }
  return Array.from(players);
}

function parseLog(text, filename) {
  const lines = text.split(/\r?\n/);
  const setup = [];
  const turns = [];
  let currentTurn = null;

  const turnHeaderRe = /^Turn #\s*(\d+)\s*-\s*(.+?)'s Turn/i;
  const drawRe = /drew (\d+) cards?/i;
  const drawSingleRe = /drew a card/i;
  const playedRe = /played (.+?)(?: to the (Active Spot|Bench|Stadium spot|Bench|Active Spot))?\.?$/i;
  const attachRe = /attached (.+?) to (.+?)(?: in the Active Spot| on the Bench| in the Active Spot| on the Bench)?\.?$/i;
  const evolveRe = /evolved (.+?) to (.+?)(?: on the Bench| on the Active Spot| in the Active Spot| to the Bench)?\.?$/i;
  const attackRe = /(.+?)'s (.+?) used (.+?) on (.+?) for (\d+) damage/i;
  const extraWeakRe = /took (\d+) more damage because of (.+?) Weakness/i;
  const koRe = /(.+?) was Knocked Out!?/i;
  const vstarEvolveRe = /evolved (.+?) to (.+?VSTAR|V STAR)/i;
  const vstarUseRe = /(Legacy Star|Apex Dragon|VSTAR)/i;
  const specialCondRe = /is now (Burned|Poisoned|Asleep|Paralyzed|Confused)/i;
  const prizeRe = /took a Prize card/i;
  const winnerRe = /(You conceded\.|wins\.?|wins!|conceded\.)/i;
  const pokemonCheckupRe = /^Pokémon Checkup/i;

  // collect setup until first turn
  let i = 0;
  for (; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (!ln) continue;
    const th = ln.match(turnHeaderRe);
    if (th) break;
    setup.push(ln);
  }

  // parse turns
  for (; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    const th = raw.match(turnHeaderRe);
    if (th) {
      if (currentTurn) turns.push(currentTurn);
      currentTurn = { number: Number(th[1]), player: th[2].trim(), actions: [] };
      continue;
    }
    if (!currentTurn) {
      // stray lines before any Turn header
      setup.push(raw);
      continue;
    }

    const action = { raw };

    // detect types
    if (drawRe.test(raw) || drawSingleRe.test(raw)) {
      const m = raw.match(drawRe);
      action.type = 'draw';
      action.count = m ? Number(m[1]) : (drawSingleRe.test(raw) ? 1 : undefined);
    } else if (attachRe.test(raw)) {
      const m = raw.match(attachRe);
      action.type = 'attach';
      action.energy = m[1].trim();
      action.target = m[2].trim();
    } else if (attackRe.test(raw)) {
      const m = raw.match(attackRe);
      action.type = 'attack';
      action.attackerOwner = m[1].trim();
      action.attacker = m[2].trim();
      action.attack = m[3].trim();
      action.target = m[4].trim();
      action.damage = Number(m[5]);
      const extra = raw.match(extraWeakRe);
      if (extra) {
        action.extra_damage = Number(extra[1]);
        action.extra_reason = extra[2].trim();
      }
    } else if (evolveRe.test(raw)) {
      const m = raw.match(evolveRe);
      action.type = 'evolve';
      action.from = m[1].trim();
      action.to = m[2].trim();
      if (vstarEvolveRe.test(raw) || /VSTAR/i.test(m[2])) action.to_vstar = true;
    } else if (playedRe.test(raw)) {
      const m = raw.match(playedRe);
      action.type = 'play';
      action.card = m[1].trim();
      action.to = m[2] ? m[2].trim() : null;
    } else if (raw.match(koRe)) {
      const m = raw.match(koRe);
      action.type = 'knockout';
      action.target = m[1].trim();
    } else if (vstarUseRe.test(raw)) {
      action.type = 'vstar';
      action.detail = raw;
    } else if (specialCondRe.test(raw)) {
      const m = raw.match(specialCondRe);
      action.type = 'special_condition';
      action.condition = m[1];
      action.target = raw.split(' is now ')[0].trim();
    } else if (prizeRe.test(raw)) {
      action.type = 'prize';
    } else if (pokemonCheckupRe.test(raw)) {
      action.type = 'pokemon_checkup';
    } else if (winnerRe.test(raw)) {
      action.type = 'result';
      action.detail = raw;
    } else {
      action.type = 'other';
    }

    // add action
    currentTurn.actions.push(action);
  }
  if (currentTurn) turns.push(currentTurn);

  // summary building
  const players = extractPlayersFromSetup(setup);
  const summary = {
    turn_count: turns.length,
    players,
    knockouts: [],
    vstar: [],
    special_conditions: [],
    result: { winner: null, method: null, final_turn: null }
  };

  // aggregate from actions
  turns.forEach(t => {
    t.actions.forEach(a => {
      if (a.type === 'knockout') {
        summary.knockouts.push({ turn: t.number, raw: a.raw, target: a.target });
      }
      if (a.type === 'vstar') summary.vstar.push({ turn: t.number, raw: a.raw });
      if (a.type === 'special_condition') summary.special_conditions.push({ turn: t.number, raw: a.raw, condition: a.condition, target: a.target });
      if (a.type === 'result') {
        if (/conceded/i.test(a.detail) || /You conceded/i.test(a.detail)) {
          summary.result.method = 'concession';
          // winner is typically the other player; try to infer
          const other = players.find(p => !t.player || p !== t.player);
          summary.result.winner = other || null;
        } else {
          const m = a.detail.match(/(.+?) wins/i);
          summary.result.winner = m ? m[1].trim() : summary.result.winner;
        }
        summary.result.final_turn = t.number;
      }
      if (a.type === 'attack' && /Apex Dragon|Legacy Star|VSTAR/i.test(a.raw)) {
        summary.vstar.push({ turn: t.number, attack: a.attack, raw: a.raw, target: a.target, damage: a.damage });
      }
    });
  });

  return {
    file: filename,
    players,
    setup,
    turns,
    summary
  };
}

const files = fs.readdirSync(LOG_DIR).filter(f => /\.txt$/i.test(f) && f !== 'parsed' && !fs.statSync(path.join(LOG_DIR, f)).isDirectory());
const results = [];

for (const f of files) {
  try {
    const p = path.join(LOG_DIR, f);
    const text = fs.readFileSync(p, 'utf8');
    const parsed = parseLog(text, f);
    const outName = safeName(f) + '.json';
    const outPath = path.join(OUT_DIR, outName);
    fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2), 'utf8');
    results.push({ file: f, out: path.relative(ROOT, outPath), players: parsed.players, turns: parsed.turns.length });
  } catch (err) {
    console.error('parse error', f, err);
  }
}

const summaryMd = [
  '# logsample parsed summary',
  '',
  `Parsed files: ${results.length}`,
  '',
  results.map(r => `- ${r.file} → ${r.out} — players: ${r.players.join(', ') || 'unknown'} — turns: ${r.turns}`).join('\n')
].join('\n');

fs.writeFileSync(path.join(OUT_DIR, 'SUMMARY.md'), summaryMd, 'utf8');

console.log('Done. Parsed', results.length, 'files. Outputs in', OUT_DIR);