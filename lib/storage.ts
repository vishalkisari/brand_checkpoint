/**
 * TAARA — persistent JSON-file storage layer.
 * Runs ONLY on the server (Node.js fs). Client pages must call API routes.
 */
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.resolve(process.cwd(), 'data.json');

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type FindingStatus = 'OPEN' | 'ADDRESSED' | 'DISMISSED';
export type SubmissionStatus = 'DRAFT' | 'PENDING' | 'REVIEW_REQUIRED' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'ARCHIVED';

export interface Organization {
  id: string;
  name: string;
  logoUrl?: string;
  createdAt: string;
}

export interface BrandFact {
  id: string;
  orgId: string;
  key: string;
  value: string;
  status: ApprovalStatus;
  createdBy: string;
  createdAt: string;
  approvedAt?: string;
}

export interface BrandTerm {
  id: string;
  orgId: string;
  term: string;
  replacement?: string;
  isForbidden: boolean;
  status: ApprovalStatus;
  createdBy: string;
  createdAt: string;
}

export interface BrandRule {
  id: string;
  orgId: string;
  description: string;
  pattern?: string; // regex string to match violations
  ruleType: 'TONE' | 'CLAIM' | 'STRUCTURE' | 'LEGAL' | 'GENERAL';
  status: ApprovalStatus;
  createdBy: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  orgId: string;
  title: string;
  description?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdBy: string;
  createdAt: string;
}

export interface CampaignFact {
  id: string;
  campaignId: string;
  key: string;
  value: string;
  required: boolean;
  status: ApprovalStatus;
  createdAt: string;
}

export interface Submission {
  id: string;
  campaignId: string;
  orgId: string;
  title: string;
  content: string;
  contentType: 'TEXT' | 'HTML';
  status: SubmissionStatus;
  version: number;
  parentId?: string; // for resubmissions
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Finding {
  id: string;
  submissionId: string;
  source: 'DETERMINISTIC' | 'AI';
  category: string;
  issue: string;
  excerpt: string;
  severity: Severity;
  evidence: string;
  suggestedFix?: string;
  status: FindingStatus;
  createdAt: string;
}

export interface ReviewDecision {
  id: string;
  submissionId: string;
  reviewerId: string;
  decision: 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED';
  comments: string;
  findingsSummary: { total: number; critical: number; high: number; medium: number; low: number };
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  submissionId?: string;
  campaignId?: string;
  orgId?: string;
  actor: string;
  action: string;
  details?: string;
  createdAt: string;
}

export interface Data {
  organizations: Organization[];
  brandFacts: BrandFact[];
  brandTerms: BrandTerm[];
  brandRules: BrandRule[];
  campaigns: Campaign[];
  campaignFacts: CampaignFact[];
  submissions: Submission[];
  findings: Finding[];
  reviewDecisions: ReviewDecision[];
  activityLogs: ActivityLog[];
}

const EMPTY: Data = {
  organizations: [],
  brandFacts: [],
  brandTerms: [],
  brandRules: [],
  campaigns: [],
  campaignFacts: [],
  submissions: [],
  findings: [],
  reviewDecisions: [],
  activityLogs: [],
};

let cache: Data | null = null;

export async function loadData(): Promise<Data> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    cache = { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    cache = JSON.parse(JSON.stringify(EMPTY));
    await saveData();
  }
  return cache!;
}

export async function saveData(): Promise<void> {
  if (!cache) return;
  await fs.writeFile(DATA_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

export function invalidateCache(): void {
  cache = null;
}

export async function getCollection<T extends keyof Data>(name: T): Promise<Data[T]> {
  const data = await loadData();
  return data[name];
}

export async function addToCollection<T extends keyof Data>(name: T, item: Data[T][number]): Promise<void> {
  const data = await loadData();
  (data[name] as any[]).push(item);
  await saveData();
}

export async function updateCollection<T extends keyof Data>(
  name: T,
  updater: (items: Data[T]) => void
): Promise<void> {
  const data = await loadData();
  updater(data[name]);
  await saveData();
}

export async function replaceData(newData: Partial<Data>): Promise<void> {
  const data = await loadData();
  Object.assign(data, newData);
  await saveData();
}

export async function logActivity(entry: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<void> {
  const data = await loadData();
  data.activityLogs.push({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    ...entry,
  });
  await saveData();
}
