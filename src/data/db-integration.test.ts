import { describe, test, expect } from 'vitest';
import initSqlJs from 'sql.js';
import { readFileSync } from 'fs';
import { join, resolve } from 'path';

// Load the actual profile.db committed to the repo
const DB_PATH = resolve(import.meta.dirname, '..', '..', 'public', 'profile.db');

describe('profile.db integration', () => {
  let db: Awaited<ReturnType<typeof initSqlJs>> extends { Database: infer D } ? D : never;

  test('profile.db file exists', () => {
    const buffer = readFileSync(DB_PATH);
    expect(buffer.length).toBeGreaterThan(1000);
    // SQLite header check
    const header = buffer.subarray(0, 15).toString('ascii');
    expect(header).toContain('SQLite format 3');
  });

  test('loads into sql.js and all expected tables are queryable', async () => {
    const SQL = await initSqlJs({
      locateFile: () => resolve(import.meta.dirname, '..', '..', 'public', 'sql-wasm.wasm'),
    });
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(new Uint8Array(buffer)) as any;

    const requiredTables = [
      'roles', 'timeline_events', 'tools', 'skills', 'education',
      'awards', 'projects', 'graph_nodes', 'graph_links', 'graph_stats', 'tag_summary',
    ];

    for (const table of requiredTables) {
      const result = db.exec(`SELECT COUNT(*) FROM ${table}`);
      expect(result.length).toBeGreaterThan(0);
      const count = result[0].values[0][0];
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('roles table has expected row count', () => {
    const result = db.exec('SELECT COUNT(*) FROM roles');
    const count = result[0].values[0][0] as number;
    expect(count).toBe(4);
  });

  test('projects table has expected row count', () => {
    const result = db.exec('SELECT COUNT(*) FROM projects');
    const count = result[0].values[0][0] as number;
    expect(count).toBe(32);
  });

  test('all role IDs are UUIDs', () => {
    const result = db.exec('SELECT id FROM roles');
    for (const row of result[0].values) {
      const id = row[0] as string;
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    }
  });

  test('timeline_events role_id foreign keys reference valid roles', () => {
    const result = db.exec(`
      SELECT COUNT(*) FROM timeline_events te
      LEFT JOIN roles r ON te.role_id = r.id
      WHERE te.role_id IS NOT NULL AND r.id IS NULL
    `);
    const orphanCount = result[0].values[0][0] as number;
    expect(orphanCount).toBe(0);
  });

  test('graph_stats contains total_commits and total_repos', () => {
    const result = db.exec('SELECT key FROM graph_stats');
    const keys = result[0].values.map(v => v[0] as string);
    expect(keys).toContain('total_commits');
    expect(keys).toContain('total_repos');
  });
});