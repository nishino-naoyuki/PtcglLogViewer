const translators: { pattern: RegExp; template: (match: RegExpMatchArray) => string }[] = [
  { pattern: /^(.+?) drew (\d+) cards?/, template: ([, player, count]) => `${player} がカードを ${count} 枚引いた` },
  { pattern: /^(.+?) drew a card/, template: ([, player]) => `${player} がカードを 1 枚引いた` },
  { pattern: /^(.+?) drew (.+?)\./, template: ([, player, card]) => `${player} が ${card}を引いた` },
  { pattern: /^(.+?) shuffled their deck\./, template: ([, player]) => `${player} がデッキをシャッフルした` },
  { pattern: /^(.+?) played (.+?) to the Active Spot/, template: ([, player, card]) => `${player} が ${card} をバトル場に出した` },
  { pattern: /^(.+?) played (.+?) to the Bench/, template: ([, player, card]) => `${player} が ${card} をベンチに置いた` },
  { pattern: /^(.+?) played (.+?) to the Stadium spot\./, template: ([, player, stadium]) => `${player} がスタジアム${stadium} を出した` },
  { pattern: /^(.+?) played (.+?)\./, template: ([, player, card]) => `${player} が ${card}\u3000を使った` },
  { pattern: /^(.+?) attached (.+?) to (.+)/, template: ([, player, card, target]) => `${player} が ${card} を ${target} に付けた` },
  { pattern: /^(.+?) evolved (.+?) to (.+)/, template: ([, player, from, to]) => `${player} が ${from} を ${to} に進化させた` },
  { pattern: /^(.+?)'s (.+?) used (.+?) on (.+?) for (\d+) damage/, template: ([, owner, pokemon, move, target, dmg]) => `${owner} の ${pokemon} が ${move} を ${target} に使い ${dmg} ダメージ` },
  { pattern: /^(.+?)'s (.+?) used (.+?)\./, template: ([, owner, pokemon, move]) => `${owner}が ${pokemon} ${move}を使った` },
  { pattern: /^(.+?) retreated (.+?) to the Bench/, template: ([, player, card]) => `${player} が ${card} をベンチに下げた` },
  { pattern: /^(.+?)'s (.+?) was Knocked Out!*/, template: ([, player, card]) => `${player} の ${card} がきぜつした` },
  { pattern: /^(.+?) was Knocked Out!*/, template: ([, card]) => `${card} がきぜつした` },
  { pattern: /^(.+?) took a Prize card/, template: ([, player]) => `${player} がサイドを 1 枚取った` },
  { pattern: /^(.+?) took (\d+) Prize cards?\./, template: ([, player, count]) => `${player}はサイドを ${count} 枚取得` },
  { pattern: /^(\d+) cards were discarded from (.+?)'s (.+?)\./, template: ([, count, owner, target]) => `${owner}'s ${target}から${count}枚のカードがトラッシュへ送られた` },
  { pattern: /^(.+?) wins!?/, template: ([, player]) => `${player} の勝利` },
  { pattern: /^You conceded\./, template: () => `あなたは投了した` },
  { pattern: /^(.+?) conceded\./, template: ([, player]) => `${player} が投了した` },
  { pattern: /^(.+?) is now in the Active Spot\./, template: ([, subject]) => `${subject} がバトル場に出た` },
  { pattern: /^A card was added to (.+?)'s hand\./, template: ([, player]) => `${player}が一枚カードを手にした！` },
  { pattern: /^(.+?) was added to (.+?)'s hand\./, template: ([, card, player]) => `${player}は${card}を手に入れた` },
  { pattern: /^Technical Machine: Evolution was discarded from (.+?)\./, template: ([, target]) => `Technical Machine: Evolution が ${target}から剥がされトラッシュへ送られた` },
  { pattern: /^(.+?)'s (.+?) was switched with (.+?)'s (.+?) to become the Active Pokémon\./, template: ([, ownerFrom, from, ownerTo, to]) => `${ownerFrom}'s ${from} が ${ownerTo}'s ${to} に代わってバトル場に呼び出された` },
  { pattern: /^(.+?) put a damage counter on (.+?)'s (.+?)\./, template: ([, player, owner, target]) => `${player} は ${owner ? owner + 'の ' : ''}${target}にダメカンを１つ置いた` },
  { pattern: /^(.+?) put (\d+) damage counters on (.+?)'s (.+?)\./, template: ([, player, count, owner, target]) => `${player}は ${owner ? owner + 'の ' : ''}${target}に${count}個ダメカンを置いた` }
];

export function translateAction(raw: string): string {
  for (const { pattern, template } of translators) {
    const match = raw.match(pattern);
    if (match) return template(match);
  }
  return raw;
}