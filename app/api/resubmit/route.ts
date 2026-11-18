/**
 * POST /api/resubmit — creator correction and resubmission
 */
import { NextRequest } from 'next/server';
import { getCollection, addToCollection, updateCollection, logActivity } from '@/lib/storage';
import { runFullAnalysis } from '@/lib/orchestrator';
import type { Submission } from '@/lib/storage';

export async function POST(req: NextRequest) {
  const { parentId, content, createdBy, notes } = await req.json();

  if (!parentId || !content?.trim() || !createdBy) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const submissions = await getCollection('submissions');
  const parent = submissions.find(s => s.id === parentId);
  if (!parent) {
    return Response.json({ error: 'Parent submission not found' }, { status: 404 });
  }

  const submissionId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const newSub: Submission = {
    id: submissionId,
    campaignId: parent.campaignId,
    orgId: parent.orgId,
    title: parent.title,
    content: content.trim(),
    contentType: parent.contentType,
    status: 'PENDING',
    version: parent.version + 1,
    parentId,
    createdBy,
    createdAt: now,
    updatedAt: now,
  };

  await addToCollection('submissions', newSub);

  await logActivity({
    submissionId,
    campaignId: parent.campaignId,
    actor: createdBy,
    action: 'RESUBMISSION_CREATED',
    details: `Revision of ${parentId}${notes ? `: ${notes}` : ''}`,
  });

  const result = await runFullAnalysis(submissionId, content.trim(), createdBy);

  return Response.json({
    submissionId,
    status: result.submissionStatus,
    findingsCount: result.allFindings.length,
    overallRisk: result.overallRisk,
    summary: result.summary,
    aiMode: result.aiMode,
  });
}
