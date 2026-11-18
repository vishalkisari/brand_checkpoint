import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.resolve(process.cwd(), 'data.json');

type Data = {
  organizations: any[];
  profiles: any[];
  memberships: any[];
  brandFacts: any[];
  brandTerms: any[];
  brandRules: any[];
  brandDocuments: any[];
  campaigns: any[];
  campaignFacts: any[];
  submissions: any[];
  submissionVersions: any[];
  analysisRuns: any[];
  findings: any[];
  reviewDecisions: any[];
  activityLogs: any[];
};

let cache: Data | null = null;

async function loadData(): Promise<Data> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    cache = JSON.parse(raw) as Data;
  } catch (e) {
    // initialize empty structure
    cache = {
      organizations: [],
      profiles: [],
      memberships: [],
      brandFacts: [],
      brandTerms: [],
      brandRules: [],
      brandDocuments: [],
      campaigns: [],
      campaignFacts: [],
      submissions: [],
      submissionVersions: [],
      analysisRuns: [],
      findings: [],
      reviewDecisions: [],
      activityLogs: [],
    };
    await saveData();
  }
  return cache;
}

async function saveData(): Promise<void> {
  if (!cache) return;
  await fs.writeFile(DATA_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

export async function getCollection<T extends keyof Data>(name: T): Promise<Data[T]> {
  const data = await loadData();
  return data[name];
}

export async function addToCollection<T extends keyof Data>(name: T, item: any): Promise<void> {
  const data = await loadData();
  // @ts-ignore
  data[name].push(item);
  await saveData();
}

export async function updateCollection<T extends keyof Data>(name: T, updater: (items: Data[T]) => void): Promise<void> {
  const data = await loadData();
  // @ts-ignore
  updater(data[name]);
  await saveData();
}

export async function clearData(): Promise<void> {
  cache = {
    organizations: [],
    profiles: [],
    memberships: [],
    brandFacts: [],
    brandTerms: [],
    brandRules: [],
    brandDocuments: [],
    campaigns: [],
    campaignFacts: [],
    submissions: [],
    submissionVersions: [],
    analysisRuns: [],
    findings: [],
    reviewDecisions: [],
    activityLogs: [],
  };
  await saveData();
}
