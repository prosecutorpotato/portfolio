/** Auto-generated from Prisma schema -- DO NOT EDIT. Columns match sql.js runtime. */

export interface Role {
    id: string;
    company: string;
    title: string;
    startDate: string;
    endDate: string | null;
    location: string;
    description: string;
    isCurrent: boolean;
    achievements: string[]; // stored as JSON string in DB, parsed at query time
    createdAt: string;
    updatedAt: string;
}

export interface TimelineEvent {
    id: string;
    roleId: string | null;
    eventType: string;
    date: string;
    title: string;
    description: string;
    company: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Tool {
    id: string;
    name: string;
    category: string;
    proficiency: number;
    createdAt: string;
    updatedAt: string;
}

export interface Skill {
    id: string;
    name: string;
    category: string;
    proficiency: number;
    createdAt: string;
    updatedAt: string;
}

export interface Education {
    id: string;
    institution: string;
    qualification: string;
    startDate: string;
    endDate: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface Award {
    id: string;
    title: string;
    issuer: string;
    date: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    organisation: string;
    languages: string;
    category: string;
    contributionRole: string;
    lastCommitDate: string;
    firstCommitDate: string;
    myCommits: number;
    totalCommits: number;
    isFork: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface GraphNodeData {
    id: string;
    nodeId: string;
    name: string;
    group: string;
    type: string;
    weight: number;
    commitCount: number;
    color: string | null;
    createdAt: string;
}

export interface GraphLinkData {
    id: string;
    source: string;
    target: string;
    strength: number;
    kind: string;
    cooccurrence: number;
}

// -- runtime tables (created by build pipeline, not in schema)
/** Aggregated graph stats. */
export interface GraphStatRow { key: string; value: number; }

/** Tag counts from commit_tags purge step. */
export interface TagSummaryRow { category: string; value: string; count: number; }
