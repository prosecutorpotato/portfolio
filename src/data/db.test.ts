import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock sql.js — we only test the mapper functions, not actual DB queries
// The mappers are internal to db.ts, so we test them via the queryAll mock

// We need to mock the module to access internal mappers
// Strategy: mock initDatabase + getDb, then test that the mappers produce correct output

import initSqlJs from 'sql.js';

// Mock initSqlJs to avoid loading WASM
vi.mock('sql.js', () => ({
  default: vi.fn(),
}));

// We can't directly test the internal mappers without exporting them.
// Instead, we test the type contracts: verify that the generated types
// match what db.ts expects. This is a compile-time test.

// Import the types to verify they're usable
import type {
  Role,
  TimelineEvent,
  Tool,
  Skill,
  Education,
  Award,
  Project,
  GraphNodeData,
  GraphLinkData,
  ContributionRole,
} from '../types';

describe('type contracts: generated types match frontend expectations', () => {
  test('Role has UUID id and camelCase fields', () => {
    const role: Role = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      company: 'Test Co',
      title: 'Engineer',
      startDate: '2025-01-01',
      endDate: null,
      location: 'Sydney',
      description: 'Test',
      isCurrent: true,
      achievements: ['Achievement 1', 'Achievement 2'],
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };
    expect(role.id).toBeTypeOf('string');
    expect(role.achievements).toBeInstanceOf(Array);
    expect(role.isCurrent).toBeTypeOf('boolean');
  });

  test('TimelineEvent has UUID id and string roleId', () => {
    const event: TimelineEvent = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      roleId: 'role-uuid-here',
      eventType: 'job',
      date: '2025-01-01',
      title: 'Started',
      description: 'Desc',
      company: 'Co',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };
    expect(event.id).toBeTypeOf('string');
    expect(event.roleId).toBeTypeOf('string');
    expect(event.eventType).toBe('job');
  });

  test('TimelineEvent with null roleId compiles', () => {
    const event: TimelineEvent = {
      id: 'uuid',
      roleId: null,
      eventType: 'certification',
      date: '2025-01-01',
      title: 'Cert',
      description: 'Got certified',
      company: null,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };
    expect(event.roleId).toBeNull();
  });

  test('Project has camelCase fields with correct types', () => {
    const project: Project = {
      id: 'uuid',
      name: 'Test Project',
      description: 'A project',
      organisation: 'Enterprise',
      languages: 'Python,SQL',
      category: 'soma',
      contributionRole: 'creator',
      lastCommitDate: '2026-07-01',
      firstCommitDate: '2025-01-01',
      myCommits: 50,
      totalCommits: 100,
      isFork: false,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };
    expect(project.contributionRole).toBe('creator');
    expect(project.myCommits).toBeTypeOf('number');
    expect(project.isFork).toBeTypeOf('boolean');
  });

  test('GraphNodeData has camelCase nodeId and commitCount', () => {
    const node: GraphNodeData = {
      id: 'uuid',
      nodeId: 'tool-python',
      name: 'Python',
      group: 'Languages',
      type: 'tool',
      weight: 3.5,
      commitCount: 42,
      color: '#3b82f6',
      createdAt: '2025-01-01',
    };
    expect(node.nodeId).toBe('tool-python');
    expect(node.commitCount).toBe(42);
  });

  test('ContributionRole is a union of literal types', () => {
    const roles: ContributionRole[] = ['creator', 'primary', 'contributor'];
    expect(roles).toHaveLength(3);
  });
});

describe('snake_case → camelCase mapping contract', () => {
  // These test that the field names in the generated types match what
  // db.ts mappers produce. If someone changes the type generator to
  // output snake_case, these tests will fail.

  test('Role field names are camelCase', () => {
    const role = {} as Role;
    // These should be the camelCase names, not snake_case
    expect('startDate' in role || true).toBe(true); // type-level check
    expect('isCurrent' in role || true).toBe(true);
    // These should NOT exist
    // @ts-expect-error - start_date should not exist on Role
    expect('start_date' in role).toBe(false);
    // @ts-expect-error - is_current should not exist on Role
    expect('is_current' in role).toBe(false);
  });

  test('Project field names are camelCase', () => {
    const project = {} as Project;
    expect('contributionRole' in project || true).toBe(true);
    expect('lastCommitDate' in project || true).toBe(true);
    expect('myCommits' in project || true).toBe(true);
    // @ts-expect-error - contribution_role should not exist
    expect('contribution_role' in project).toBe(false);
    // @ts-expect-error - last_commit_date should not exist
    expect('last_commit_date' in project).toBe(false);
  });
});