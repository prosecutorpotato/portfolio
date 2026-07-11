// ── Domain Types ──────────────────────────────────────────

export type EventType = 'job' | 'promotion' | 'certification' | 'award' | 'education';

export interface Role {
  id: number;
  company: string;
  title: string;
  start_date: string;   // ISO date
  end_date: string | null;
  location: string;
  description: string;
  is_current: boolean;
  achievements: string[];
}

export interface TimelineEvent {
  id: number;
  role_id: number | null;
  event_type: EventType;
  date: string;         // ISO date
  title: string;
  description: string;
  company?: string;
}

export interface Tool {
  id: number;
  name: string;
  category: string;
  proficiency: number;  // 1-5
}

export interface Skill {
  id: number;
  name: string;
  category: string;
  proficiency: number;  // 1-5
}

export interface Education {
  id: number;
  institution: string;
  qualification: string;
  start_date: string;
  end_date: string;
  description: string;
}

export interface Award {
  id: number;
  title: string;
  issuer: string;
  date: string;
  description: string;
}

export type ContributionRole = 'creator' | 'primary' | 'contributor';

export interface Project {
  id: number;
  name: string;
  description: string;
  organisation: string;
  languages: string;
  category: string;
  contribution_role: ContributionRole;
  last_commit_date: string;
  first_commit_date: string;
  my_commits: number;
  total_commits: number;
  is_fork: boolean;
}

// ── Graph types (force-directed graph from commit analysis) ────────────

export interface GraphNodeData {
  id: number;
  nodeId: string;
  name: string;
  group: string;
  type: 'hub' | 'tool' | 'feature';
  weight: number;
  commitCount: number;
  color: string | null;
}

export interface GraphLinkData {
  id: number;
  source: string;  // node_id
  target: string;  // node_id
  strength: number;
  kind: 'membership' | 'related' | 'cooccurrence';
  cooccurrence: number;
}

export interface CommitTagData {
  category: 'role';
  value: string;
  count: number;
}

export interface GraphData {
  nodes: GraphNodeData[];
  links: GraphLinkData[];
  roleDistribution: CommitTagData[];
  totalCommits: number;
  totalRepos: number;
}

export interface ProfileData {
  roles: Role[];
  events: TimelineEvent[];
  tools: Tool[];
  skills: Skill[];
  education: Education[];
  awards: Award[];
  projects: Project[];
  graph: GraphData;
}