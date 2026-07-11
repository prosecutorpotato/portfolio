/**
 * Structured logger for the profile website.
 *
 * All log entries are tagged with a category and timestamp so they can be
 * easily filtered in the browser DevTools console. Errors are also collected
 * into an in-memory ring buffer so the ErrorScreen can display a real-time
 * log trail (not just the latest message).
 *
 * Categories:
 *   DB    — database initialization, WASM load, queries
 *   FETCH — network requests (profile.db, sql-wasm.wasm)
 *   QUERY — SQL query execution
 *   FORM  — contact form submissions
 *   NAV   — navigation / scroll
 *   D3    — visualization rendering
 *   APP   — general app lifecycle
 */

export type LogCategory = 'DB' | 'FETCH' | 'QUERY' | 'FORM' | 'NAV' | 'D3' | 'APP';
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  timestamp: string;
  category: LogCategory;
  level: LogLevel;
  message: string;
  data?: unknown;
}

const BUFFER_SIZE = 100;
const logBuffer: LogEntry[] = [];
const listeners: Set<(entries: LogEntry[]) => void> = new Set();

const CATEGORY_STYLES: Record<LogCategory, string> = {
  DB: 'color: #29b5e8; font-weight: bold',
  FETCH: 'color: #e8740c; font-weight: bold',
  QUERY: 'color: #8b5cf6; font-weight: bold',
  FORM: 'color: #10b981; font-weight: bold',
  NAV: 'color: #2563eb; font-weight: bold',
  D3: 'color: #f43f5e; font-weight: bold',
  APP: 'color: #475569; font-weight: bold',
};

const LEVEL_STYLES: Record<LogLevel, string> = {
  info: 'color: #0f172a',
  warn: 'color: #e8740c',
  error: 'color: #f43f5e; font-weight: bold',
  debug: 'color: #94a3b8',
};

function emit(category: LogCategory, level: LogLevel, message: string, data?: unknown): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    category,
    level,
    message,
    data,
  };

  logBuffer.push(entry);
  if (logBuffer.length > BUFFER_SIZE) logBuffer.shift();

  // Notify listeners (ErrorScreen terminal)
  for (const listener of listeners) {
    listener([...logBuffer]);
  }

  // Console output with styled prefix
  const prefix = `%c[${category}]%c ${level.toUpperCase()}%c ${message}`;
  const catStyle = CATEGORY_STYLES[category];
  const lvlStyle = LEVEL_STYLES[level];
  const msgStyle = 'color: inherit';

  if (level === 'error') {
    console.error(prefix, catStyle, lvlStyle, msgStyle, data ?? '');
  } else if (level === 'warn') {
    console.warn(prefix, catStyle, lvlStyle, msgStyle, data ?? '');
  } else if (level === 'debug') {
    console.debug(prefix, catStyle, lvlStyle, msgStyle, data ?? '');
  } else {
    console.log(prefix, catStyle, lvlStyle, msgStyle, data ?? '');
  }
}

export const log = {
  info: (category: LogCategory, message: string, data?: unknown) => emit(category, 'info', message, data),
  warn: (category: LogCategory, message: string, data?: unknown) => emit(category, 'warn', message, data),
  error: (category: LogCategory, message: string, data?: unknown) => emit(category, 'error', message, data),
  debug: (category: LogCategory, message: string, data?: unknown) => emit(category, 'debug', message, data),
};

export function getLogBuffer(): LogEntry[] {
  return [...logBuffer];
}

export function subscribeToLogs(callback: (entries: LogEntry[]) => void): () => void {
  listeners.add(callback);
  callback([...logBuffer]);
  return () => listeners.delete(callback);
}

export function clearLogs(): void {
  logBuffer.length = 0;
  for (const listener of listeners) {
    listener([]);
  }
}