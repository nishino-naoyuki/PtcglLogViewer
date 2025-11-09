import React, { useRef, useState } from 'react';
import type { ParsedLog } from '../state/types';
import { useGameState } from '../state/store';

function normalizeText(raw: string): ParsedLog {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { file: 'empty', players: [], setup: [], turns: [] };
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && (Array.isArray(parsed.turns) || Array.isArray(parsed.setup))) {
      return parsed as ParsedLog;
    }
  } catch {
    // fall through
  }
  const lines = trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return { file: 'pasted-log', players: [], setup: lines, turns: [] };
}

export default function LogLoader() {
  const { loadParsedLog } = useGameState();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingText, setPendingText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setPendingText(text);
    setFileName(file.name);
    setError(null);
  };

  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPendingText(event.target.value);
    setFileName(null);
    setError(null);
  };

  const handleStart = () => {
    if (!pendingText.trim()) {
      setError('ログを入力してください。');
      return;
    }
    const parsed = normalizeText(pendingText);
    loadParsedLog(parsed);
    setError(null);
  };

  const handleReset = () => {
    setPendingText('');
    setFileName(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="log-loader">
      <h3>ログを読み込む</h3>
      <p className="log-loader__hint">
        PTCGL のログファイル（JSON / TXT）を選択するか、テキストを貼り付けて「開始」を押してください。
      </p>
      <div className="log-loader__input">
        <label className="log-loader__label">
          ファイルを選択
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt,.log"
            onChange={handleFileChange}
          />
        </label>
        {fileName && <span className="log-loader__filename">選択中: {fileName}</span>}
      </div>
      <textarea
        className="log-loader__textarea"
        placeholder="ログをここに貼り付け"
        value={pendingText}
        onChange={handleTextareaChange}
        rows={8}
      />
      {error && <div className="log-loader__error">{error}</div>}
      <div className="log-loader__actions">
        <button type="button" onClick={handleStart}>
          開始
        </button>
        <button type="button" onClick={handleReset}>
          クリア
        </button>
      </div>
    </div>
  );
}