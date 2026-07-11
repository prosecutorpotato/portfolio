import { useEffect, useState } from 'react';
import { getLogBuffer, subscribeToLogs, type LogEntry, type LogLevel } from '../lib/logger';

interface ErrorScreenProps {
  error: string;
  onRetry: () => void;
}

function levelIcon(level: LogLevel): string {
  switch (level) {
    case 'error': return '!';
    case 'warn': return '⚠';
    case 'info': return '>';
    case 'debug': return '·';
  }
}

export function ErrorScreen({ error, onRetry }: ErrorScreenProps) {
  const [logs, setLogs] = useState<LogEntry[]>(getLogBuffer());

  useEffect(() => {
    const unsubscribe = subscribeToLogs((entries: LogEntry[]) => setLogs([...entries]));
    return unsubscribe;
  }, []);

  return (
    <div className="error-screen">
      <div className="error-screen__grid" aria-hidden="true" />
      <div className="error-screen__glow" aria-hidden="true" />

      <div className="error-screen__content">
        <div className="error-screen__code">
          <span className="error-screen__code-bracket">{'{'}</span>
          <span className="error-screen__code-key">"status"</span>
          <span className="error-screen__code-colon">: </span>
          <span className="error-screen__code-value">503</span>
          <span className="error-screen__code-comma">,</span>
          <br />
          <span className="error-screen__code-space">{'  '}</span>
          <span className="error-screen__code-key">"message"</span>
          <span className="error-screen__code-colon">: </span>
          <span className="error-screen__code-value-string">"{error}"</span>
          <span className="error-screen__code-bracket">{'}'}</span>
        </div>

        <h1 className="error-screen__title">
          The data pipeline <span className="error-screen__title-accent">broke</span>.
        </h1>

        <p className="error-screen__subtitle">
          Something went wrong loading the database. This is probably a stale cache
          or a failed WASM initialization. Try refreshing — or reach me directly.
        </p>

        <div className="error-screen__actions">
          <button className="error-screen__btn error-screen__btn--primary" onClick={onRetry}>
            Try again
          </button>
          <a
            href="mailto:kenjisison2@gmail.com"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = 'mailto:kenjisison2@gmail.com';
            }}
            className="error-screen__btn error-screen__btn--secondary"
          >
            Email me
          </a>
          <a
            href="https://www.linkedin.com/in/kenji-sison/"
            target="_blank"
            rel="noopener noreferrer"
            className="error-screen__btn error-screen__btn--secondary"
          >
            LinkedIn
          </a>
        </div>

        <div className="error-screen__email-direct">
          <span className="error-screen__email-label">Or copy:</span>
          <code className="error-screen__email-code">kenjisison2@gmail.com</code>
        </div>

        <div className="error-screen__terminal">
          <div className="error-screen__terminal-bar">
            <span className="error-screen__terminal-dot error-screen__terminal-dot--red" />
            <span className="error-screen__terminal-dot error-screen__terminal-dot--yellow" />
            <span className="error-screen__terminal-dot error-screen__terminal-dot--green" />
            <span className="error-screen__terminal-title">error.log — live</span>
          </div>
          <div className="error-screen__terminal-body">
            {logs.length === 0 ? (
              <p>
                <span className="error-screen__terminal-prompt">$</span> No logs yet…
              </p>
            ) : (
              logs.map((entry, i) => (
                <p
                  key={i}
                  className={`error-screen__log-line error-screen__log-line--${entry.level}`}
                >
                  <span className="error-screen__log-time">
                    {entry.timestamp.substring(11, 19)}
                  </span>
                  <span className="error-screen__log-cat">{entry.category}</span>
                  <span className="error-screen__log-icon">{levelIcon(entry.level)}</span>
                  <span className="error-screen__log-msg">{entry.message}</span>
                </p>
              ))
            )}
            <p className="error-screen__terminal-cursor">
              <span className="error-screen__terminal-prompt">{'>'}</span>{' '}
              <span className="error-screen__cursor">█</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}