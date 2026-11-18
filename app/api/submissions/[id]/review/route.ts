/**
 * POST /api/submissions/[id]/review — submit a reviewer decision
 */
import { NextRequest } from 'next/server';
import { getCollection, addToCollection, updateCollection, logActivity } from '@/lib/storage';

export async function POST(
  req: NextRequest,
  ctx: RouteContext<'/api/submissions/[id]/review'>
) {
  const { id } = await ctx.params;
  const { decision, comments, reviewerId } = await req.json();

  if (!['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'].includes(decision)) {
    return Response.json({ error: 'Invalid decision' }, { status: 400 });
  }

  const submissions = await getCollection('submissions');
  const submission = submissions.find(s => s.id === id);
  if (!submission) {
    return Response.json({ error: 'Submission not found' }, { status: 404 });
  }

  const findings = await getCollection('findings');
  const subFindings = findings.filter(f => f.submissionId === id);
  const summary = {
    total: subFindings.length,
    critical: subFindings.filter(f => f.severity === 'CRITICAL').length,
    high: subFindings.filter(f => f.severity === 'HIGH').length,
    medium: subFindings.filter(f => f.severity === 'MEDIUM').length,
    low: subFindings.filter(f => f.severity === 'LOW').length,
  };

  const decisionRecord = {
    id: `rdec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    submissionId: id,
    reviewerId,
    decision,
    comments,
    findingsSummary: summary,
    createdAt: new Date().toISOString(),
  };

  await addToCollection('reviewDecisions', decisionRecord);

  // Update submission status
  const newStatus = decision === 'APPROVED' ? 'APPROVED'
    : decision === 'CHANGES_REQUESTED' ? 'CHANGES_REQUESTED'
    : 'REJECTED';

  await updateCollection('submissions', items => {
    const s = items.find(s => s.id === id);
    if (s) {
      s.status = newStatus;
      s.updatedAt = new Date().toISOString();
    }
  });

  await logActivity({
    submissionId: id,
    actor: reviewerId,
    action: `REVIEW_${decision}`,
    details: comments,
  });

  return Response.json({ ok: true, decision: decisionRecord });
}

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/submissions/[id]/review'>
) {
  const { id } = await ctx.params;
  const all = await getCollection('reviewDecisions');
  return Response.json(all.filter(d => d.submissionId === id));
}
