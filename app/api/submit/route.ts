/**
 * POST /api/submit — create a new submission and trigger analysis
 */
import { NextRequest } from 'next/server';
import { addToCollection, logActivity } from '@/lib/storage';
import { runFullAnalysis } from '@/lib/orchestrator';
import type { Submission } from '@/lib/storage';

export async function POST(req: NextRequest) {
  const { campaignId, orgId, title, content, createdBy, parentId } = await req.json();

  if (!campaignId || !content?.trim() || !createdBy) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const submissionId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const submission: Submission = {
    id: submissionId,
    campaignId,
    orgId: orgId ?? 'org_nova',
    title: title ?? 'Untitled Submission',
    content: content.trim(),
    contentType: 'TEXT',
    status: 'PENDING',
    version: 1,
    parentId: parentId ?? undefined,
    createdBy,
    createdAt: now,
    updatedAt: now,
  };

  await addToCollection('submissions', submission);

  await logActivity({
    submissionId,
    campaignId,
    actor: createdBy,
    action: 'SUBMISSION_CREATED',
    details: title,
  });

  // Run analysis asynchronously but await it here so the response includes findings
  const result = await runFullAnalysis(submissionId, content.trim(), createdBy);

  return Response.json({
    submissionId,
    status: result.submissionStatus,
    findingsCount: result.allFindings.length,
    overallRisk: result.overallRisk,
    summary: result.summary,
    toneAssessment: result.toneAssessment,
    aiMode: result.aiMode,
  });
}
