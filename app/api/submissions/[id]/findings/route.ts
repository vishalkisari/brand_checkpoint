/**
 * GET  /api/submissions/[id]/findings — get findings for a submission
 * POST /api/submissions/[id]/findings — update finding status
 */
import { NextRequest } from 'next/server';
import { getCollection, updateCollection } from '@/lib/storage';

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/submissions/[id]/findings'>
) {
  const { id } = await ctx.params;
  const all = await getCollection('findings');
  return Response.json(all.filter(f => f.submissionId === id));
}

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<'/api/submissions/[id]/findings'>
) {
  const { id } = await ctx.params;
  const { findingId, status } = await req.json();
  await updateCollection('findings', items => {
    const f = items.find(f => f.id === findingId && f.submissionId === id);
    if (f) f.status = status;
  });
  return Response.json({ ok: true });
}
