/**
 * GET /api/submissions/[id]/history — get version history for a submission chain
 */
import { NextRequest } from 'next/server';
import { getCollection } from '@/lib/storage';

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/submissions/[id]/history'>
) {
  const { id } = await ctx.params;
  const all = await getCollection('submissions');

  // Find the root submission (no parentId in chain)
  // Walk backwards to find root
  const findRoot = (subId: string): string => {
    const sub = all.find(s => s.id === subId);
    if (!sub || !sub.parentId) return subId;
    return findRoot(sub.parentId);
  };

  const rootId = findRoot(id);

  // Collect all submissions in this chain
  const chain: typeof all = [];
  const collect = (subId: string) => {
    const sub = all.find(s => s.id === subId);
    if (sub) chain.push(sub);
    // Find children
    const children = all.filter(s => s.parentId === subId);
    for (const child of children) collect(child.id);
  };
  collect(rootId);

  chain.sort((a, b) => a.version - b.version);
  return Response.json(chain);
}
