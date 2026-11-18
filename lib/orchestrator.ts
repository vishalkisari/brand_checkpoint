/**
 * TAARA — full analysis orchestrator.
 * Merges deterministic + AI findings, persists everything, logs activity.
 */
import { runDeterministicAnalysis } from '@/lib/analysis';
import { runGeminiAnalysis, type GeminiAnalysisResult } from '@/lib/gemini';
import { addToCollection, updateCollection, logActivity, getCollection } from '@/lib/storage';
import type { Finding, Submission } from '@/lib/storage';

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export interface FullAnalysisResult extends GeminiAnalysisResult {
  allFindings: Finding[];
  submissionStatus: Submission['status'];
}

export async function runFullAnalysis(
  submissionId: string,
  content: string,
  actor: string
): Promise<FullAnalysisResult> {
  // Run both analyses in parallel
  const [deterministicResult, geminiResult] = await Promise.all([
    runDeterministicAnalysis(submissionId, content),
    runGeminiAnalysis(submissionId, content),
  ]);

  // Deduplicate: if AI and deterministic both flag same term in same category, prefer AI (richer evidence)
  const deterministicFindings = deterministicResult.findings;
  const aiFindings = geminiResult.findings;

  // Merge: deduplicate by (category, issue substring)
  const seen = new Set<string>();
  const merged: Omit<Finding, 'id' | 'createdAt'>[] = [];

  for (const f of [...aiFindings, ...deterministicFindings]) {
    const key = `${f.category}:${f.issue.slice(0, 40).toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(f);
    }
  }

  // Persist all findings
  const now = new Date().toISOString();
  const persisted: Finding[] = merged.map(f => ({
    ...f,
    id: newId('fnd'),
    createdAt: now,
  }));

  for (const finding of persisted) {
    await addToCollection('findings', finding);
  }

  // Determine submission status from findings
  const hasCritical = persisted.some(f => f.severity === 'CRITICAL');
  const hasHigh = persisted.some(f => f.severity === 'HIGH');
  const submissionStatus: Submission['status'] =
    hasCritical || hasHigh ? 'REVIEW_REQUIRED' : persisted.length > 0 ? 'REVIEW_REQUIRED' : 'APPROVED';

  // Update submission
  await updateCollection('submissions', items => {
    const sub = items.find(s => s.id === submissionId);
    if (sub) {
      sub.status = submissionStatus;
      sub.updatedAt = now;
    }
  });

  // Log activity
  await logActivity({
    submissionId,
    actor,
    action: 'ANALYSIS_COMPLETE',
    details: `${persisted.length} finding(s): ${persisted.filter(f => f.severity === 'CRITICAL').length} critical, ${persisted.filter(f => f.severity === 'HIGH').length} high, ${persisted.filter(f => f.severity === 'MEDIUM').length} medium, ${persisted.filter(f => f.severity === 'LOW').length} low. AI mode: ${geminiResult.aiMode}`,
  });

  return {
    ...geminiResult,
    allFindings: persisted,
    submissionStatus,
  };
}
