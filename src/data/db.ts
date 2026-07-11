import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import type {
  Role,
  TimelineEvent,
  Tool,
  Skill,
  Education,
  Award,
  Project,
  ContributionRole,
  GraphNodeData,
  GraphLinkData,
  CommitTagData,
  GraphData,
  ProfileData,
} from '../types';
import { log } from '../lib/logger';

let db: Database | null = null;
let SQL: SqlJsStatic | null = null;

// Versioned key — bump when schema changes to invalidate stale localStorage caches
const DB_STORAGE_KEY = 'kenji-profile-db-v5';

// Prior versions to clear on retry so stale caches don't survive a schema bump.
const STALE_STORAGE_KEYS = [
  'kenji-profile-db-v4',
  'kenji-profile-db-v3',
  'kenji-profile-db-v2',
  'kenji-profile-db',
];

/**
 * Remove the current version's cache (force re-fetch) plus all known stale keys.
 * Called from the error-retry path in App.tsx.
 */
export function clearStaleStorageKeys(): void {
  localStorage.removeItem(DB_STORAGE_KEY);
  for (const key of STALE_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}

type Row = Record<string, unknown>;

function queryAll(sql: string): Row[] {
  const stmt = getDb().prepare(sql);
  const results: Row[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as Row);
  }
  stmt.free();
  return results;
}

/**
 * Verify that a database has all required tables AND that they're queryable.
 * Checking sqlite_master alone isn't enough — a corrupted or partial database
 * can have table entries but fail on actual SELECT.
 */
function verifyDatabase(database: Database): boolean {
  const required = ['roles', 'timeline_events', 'tools', 'skills', 'education', 'awards', 'projects', 'tag_summary', 'graph_nodes', 'graph_links', 'graph_stats'];
  for (const table of required) {
    try {
      const result = database.exec(`SELECT COUNT(*) FROM ${table} LIMIT 1`);
      if (result.length === 0) {
        log.error('DB', `Verification failed: "${table}" returned no result set`);
        return false;
      }
      const count = result[0].values[0][0];
      log.debug('DB', `  ✓ ${table}: ${count} rows`);
    } catch (e) {
      log.error('DB', `Verification failed on "${table}": ${e instanceof Error ? e.message : String(e)}`);
      return false;
    }
  }
  return true;
}

/**
 * Convert a Uint8Array to a base64 string in chunks to avoid
 * exceeding the call stack with spread operator on large arrays.
 */
function uint8ToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000; // 32KB chunks
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const chunk = bytes.subarray(i, i + CHUNK);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Initialise the in-browser SQLite database.
 *
 * Architecture: Prisma is used at build time to define the schema and seed
 * all profile data. The resulting `.db` file is copied to the public directory
 * and loaded at runtime via sql.js (SQLite compiled to WASM). Contact form
 * messages are written at runtime and persisted to localStorage.
 */
export async function initDatabase(): Promise<Database> {
  if (db) {
    log.debug('DB', 'Database already initialized, reusing');
    return db;
  }

  // ── Step 1: Load sql.js WASM ────────────────────────────
  const baseUrl = import.meta.env.BASE_URL;
  log.info('DB', `Initializing sql.js (loading WASM from ${baseUrl}sql-wasm.wasm)…`);
  try {
    SQL = await initSqlJs({
      locateFile: () => `${baseUrl}sql-wasm.wasm`,
    });
    log.info('DB', 'sql.js WASM loaded successfully');
  } catch (e) {
    log.error('DB', 'Failed to load sql.js WASM', e);
    throw new Error(`Failed to load SQLite WASM engine. The ${baseUrl}sql-wasm.wasm file may be missing or corrupted.`);
  }

  // ── Step 2: Try restoring from localStorage ─────────────
  const stored = localStorage.getItem(DB_STORAGE_KEY);
  if (stored) {
    log.info('DB', 'Found cached database in localStorage, attempting restore…');
    try {
      const uint8 = base64ToUint8(stored);
      log.debug('DB', `Cached database size: ${uint8.length} bytes`);
      const storedDb = new SQL.Database(uint8);
      if (verifyDatabase(storedDb)) {
        db = storedDb;
        log.info('DB', 'Database restored from localStorage cache ✓');
        return db;
      }
      log.warn('DB', 'Cached database failed verification, discarding');
      storedDb.close();
      localStorage.removeItem(DB_STORAGE_KEY);
    } catch (e) {
      log.error('DB', 'Failed to restore from localStorage', e);
      localStorage.removeItem(DB_STORAGE_KEY);
    }
  } else {
    log.debug('DB', 'No cached database in localStorage');
  }

  // ── Step 3: Fetch from /profile.db ──────────────────────
  log.info('FETCH', `Fetching ${baseUrl}profile.db…`);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}profile.db`);
  } catch (e) {
    log.error('FETCH', `Network error fetching ${baseUrl}profile.db`, e);
    throw new Error('Network error while fetching the database file.');
  }

  if (!response.ok) {
    log.error('FETCH', `HTTP ${response.status} ${response.statusText} for ${baseUrl}profile.db`);
    throw new Error(`Failed to load database (HTTP ${response.status} ${response.statusText}).`);
  }

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  log.info('FETCH', `Fetched ${baseUrl}profile.db: ${bytes.length} bytes`);

  // Verify it looks like a SQLite file
  const header = new TextDecoder().decode(bytes.slice(0, 15));
  if (!header.startsWith('SQLite format 3')) {
    log.error('FETCH', `Invalid SQLite header: "${header}" — file may be HTML or corrupted`);
    throw new Error('Downloaded file is not a valid SQLite database (bad header).');
  }
  log.debug('FETCH', 'SQLite header verified ✓');

  // ── Step 4: Load into sql.js ────────────────────────────
  log.info('DB', 'Loading database into sql.js…');
  let freshDb: Database;
  try {
    freshDb = new SQL.Database(bytes);
  } catch (e) {
    log.error('DB', 'Failed to create Database from fetched data', e);
    throw new Error('Could not parse the downloaded database file.');
  }

  log.info('DB', 'Verifying database tables…');
  if (!verifyDatabase(freshDb)) {
    freshDb.close();
    log.error('DB', 'Database verification failed — required tables are missing');
    throw new Error('Database loaded but verification failed — tables missing.');
  }

  db = freshDb;
  log.info('DB', 'Database initialized and verified ✓');
  persist();
  return db;
}

function persist(): void {
  if (!db) return;
  try {
    const data = db.export();
    const b64 = uint8ToBase64(data);
    localStorage.setItem(DB_STORAGE_KEY, b64);
    log.debug('DB', `Persisted database to localStorage (${data.length} bytes)`);
  } catch (e) {
    log.warn('DB', 'Could not persist database to localStorage (non-fatal)', e);
  }
}

export function getDb(): Database {
  if (!db) {
    log.error('DB', 'getDb() called before initialization');
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// ── Helpers for row field access ────────────────────────

function str(r: Row, key: string): string {
  return r[key] as string;
}

function num(r: Row, key: string): number {
  return r[key] as number;
}

function nullableStr(r: Row, key: string): string | null {
  return (r[key] ?? null) as string | null;
}

function bool(r: Row, key: string): boolean {
  return Boolean(r[key]);
}

// ── Typed query functions ───────────────────────────────

function getAllRoles(): Role[] {
  log.debug('QUERY', 'getAllRoles()');
  const rows = queryAll('SELECT * FROM roles ORDER BY start_date DESC');
  const result = rows.map((r): Role => ({
    id: num(r, 'id'),
    company: str(r, 'company'),
    title: str(r, 'title'),
    start_date: str(r, 'start_date'),
    end_date: nullableStr(r, 'end_date'),
    location: str(r, 'location'),
    description: str(r, 'description'),
    is_current: bool(r, 'is_current'),
    achievements: JSON.parse(str(r, 'achievements')) as string[],
  }));
  log.info('QUERY', `getAllRoles: ${result.length} roles`);
  return result;
}

function getAllEvents(): TimelineEvent[] {
  log.debug('QUERY', 'getAllEvents()');
  const rows = queryAll('SELECT * FROM timeline_events ORDER BY date ASC');
  const result = rows.map((r): TimelineEvent => ({
    id: num(r, 'id'),
    role_id: (r.role_id ?? null) as number | null,
    event_type: str(r, 'event_type') as TimelineEvent['event_type'],
    date: str(r, 'date'),
    title: str(r, 'title'),
    description: str(r, 'description'),
    company: r.company as string | undefined,
  }));
  log.info('QUERY', `getAllEvents: ${result.length} events`);
  return result;
}

function getAllTools(): Tool[] {
  log.debug('QUERY', 'getAllTools()');
  const rows = queryAll('SELECT * FROM tools ORDER BY proficiency DESC, name ASC');
  const result = rows.map((r): Tool => ({
    id: num(r, 'id'),
    name: str(r, 'name'),
    category: str(r, 'category'),
    proficiency: num(r, 'proficiency'),
  }));
  log.info('QUERY', `getAllTools: ${result.length} tools`);
  return result;
}

function getAllSkills(): Skill[] {
  log.debug('QUERY', 'getAllSkills()');
  const rows = queryAll('SELECT * FROM skills ORDER BY proficiency DESC, name ASC');
  const result = rows.map((r): Skill => ({
    id: num(r, 'id'),
    name: str(r, 'name'),
    category: str(r, 'category'),
    proficiency: num(r, 'proficiency'),
  }));
  log.info('QUERY', `getAllSkills: ${result.length} skills`);
  return result;
}

function getAllEducation(): Education[] {
  log.debug('QUERY', 'getAllEducation()');
  const rows = queryAll('SELECT * FROM education ORDER BY start_date DESC');
  const result = rows.map((r): Education => ({
    id: num(r, 'id'),
    institution: str(r, 'institution'),
    qualification: str(r, 'qualification'),
    start_date: str(r, 'start_date'),
    end_date: str(r, 'end_date'),
    description: str(r, 'description'),
  }));
  log.info('QUERY', `getAllEducation: ${result.length} entries`);
  return result;
}

function getAllAwards(): Award[] {
  log.debug('QUERY', 'getAllAwards()');
  const rows = queryAll('SELECT * FROM awards ORDER BY date DESC');
  const result = rows.map((r): Award => ({
    id: num(r, 'id'),
    title: str(r, 'title'),
    issuer: str(r, 'issuer'),
    date: str(r, 'date'),
    description: str(r, 'description'),
  }));
  log.info('QUERY', `getAllAwards: ${result.length} awards`);
  return result;
}

function getAllProjects(): Project[] {
  log.debug('QUERY', 'getAllProjects()');
  const rows = queryAll('SELECT * FROM projects ORDER BY last_commit_date DESC');
  const result = rows.map((r): Project => ({
    id: num(r, 'id'),
    name: str(r, 'name'),
    description: str(r, 'description'),
    organisation: str(r, 'organisation'),
    languages: str(r, 'languages'),
    category: str(r, 'category'),
    contribution_role: str(r, 'contribution_role') as ContributionRole,
    last_commit_date: str(r, 'last_commit_date'),
    first_commit_date: str(r, 'first_commit_date'),
    my_commits: num(r, 'my_commits'),
    total_commits: num(r, 'total_commits'),
    is_fork: bool(r, 'is_fork'),
  }));
  log.info('QUERY', `getAllProjects: ${result.length} projects`);
  return result;
}

// ── Graph data queries (force-directed graph from commit analysis) ─────

function getGraphNodes(): GraphNodeData[] {
  log.debug('QUERY', 'getGraphNodes()');
  const rows = queryAll('SELECT * FROM graph_nodes ORDER BY type, commit_count DESC');
  const result = rows.map((r): GraphNodeData => ({
    id: num(r, 'id'),
    nodeId: str(r, 'node_id'),
    name: str(r, 'name'),
    group: str(r, 'group'),
    type: str(r, 'type') as GraphNodeData['type'],
    weight: num(r, 'weight'),
    commitCount: num(r, 'commit_count'),
    color: (r.color ?? null) as string | null,
  }));
  log.info('QUERY', `getGraphNodes: ${result.length} nodes`);
  return result;
}

function getGraphLinks(): GraphLinkData[] {
  log.debug('QUERY', 'getGraphLinks()');
  const rows = queryAll('SELECT * FROM graph_links');
  const result = rows.map((r): GraphLinkData => ({
    id: num(r, 'id'),
    source: str(r, 'source'),
    target: str(r, 'target'),
    strength: num(r, 'strength'),
    kind: str(r, 'kind') as GraphLinkData['kind'],
    cooccurrence: num(r, 'cooccurrence'),
  }));
  log.info('QUERY', `getGraphLinks: ${result.length} links`);
  return result;
}

function getRoleDistribution(): CommitTagData[] {
  log.debug('QUERY', 'getRoleDistribution()');
  const rows = queryAll(
    `SELECT value, count FROM tag_summary WHERE category = 'role' ORDER BY count DESC`
  );
  const result = rows.map((r): CommitTagData => ({
    category: 'role',
    value: str(r, 'value'),
    count: num(r, 'count'),
  }));
  log.info('QUERY', `getRoleDistribution: ${result.length} roles`);
  return result;
}

function getGraphStat(key: string): number {
  const result = getDb().exec(`SELECT value FROM graph_stats WHERE key = '${key}'`);
  const count = result.length > 0 ? (result[0].values[0][0] as number) : 0;
  log.debug('QUERY', `getGraphStat('${key}'): ${count}`);
  return count;
}

function getGraphData(): GraphData {
  return {
    nodes: getGraphNodes(),
    links: getGraphLinks(),
    roleDistribution: getRoleDistribution(),
    totalCommits: getGraphStat('total_commits'),
    totalRepos: getGraphStat('total_repos'),
  };
}

// ── Public interface ───────────────────────────────────────
// The module exports only three functions:
//   initDatabase   — WASM lifecycle (load, cache, fetch, verify)
//   loadProfileData — single entry point that inits + queries all data
//   getDb          — escape hatch for direct SQL (used by verifyDatabase)
//
// All individual query functions are internal. The interface is the test
// surface: stub loadProfileData to test App.tsx, or stub queryAll to test
// individual mappers.

export async function loadProfileData(): Promise<ProfileData> {
  await initDatabase();
  const roles = getAllRoles();
  const events = getAllEvents();
  const tools = getAllTools();
  const skills = getAllSkills();
  const education = getAllEducation();
  const awards = getAllAwards();
  const projects = getAllProjects();
  const graph = getGraphData();

  log.info('DB', `loadProfileData: ${roles.length} roles, ${events.length} events, ${tools.length} tools, ${skills.length} skills, ${education.length} education, ${awards.length} awards, ${projects.length} projects, ${graph.nodes.length} graph nodes, ${graph.links.length} graph links`);

  return { roles, events, tools, skills, education, awards, projects, graph };
}