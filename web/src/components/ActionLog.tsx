import React from 'react';
import type { ViewerStep } from '../state/types';
import { translateAction } from '../state/translate';

interface Props {
  step: ViewerStep | null;
}

export default function ActionLog({ step }: Props) {
  if (!step) {
    return <div className="action-log">ステップ情報なし</div>;
  }

  return (
    <div className="action-log">
      <h2>Turn {step.turnNumber} / {step.player}</h2>
      <ul>
        {step.actions.length === 0 && <li>ログがありません。</li>}
        {step.actions.map((a, i) => (
          <li key={i}>{translateAction(a)}</li>
        ))}
      </ul>
    </div>
  );
}