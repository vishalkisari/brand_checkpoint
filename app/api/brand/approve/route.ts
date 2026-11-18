/**
 * POST /api/brand/approve — approve or archive a brand knowledge item
 */
import { NextRequest } from 'next/server';
import { updateCollection, logActivity } from '@/lib/storage';
import type { Data } from '@/lib/storage';

const BRAND_COLLECTIONS = ['brandFacts', 'brandTerms', 'brandRules'] as const;

export async function POST(req: NextRequest) {
  const { collection, id, status, actor } = await req.json();

  if (!BRAND_COLLECTIONS.includes(collection)) {
    return Response.json({ error: 'Invalid collection' }, { status: 400 });
  }
  if (!['APPROVED', 'ARCHIVED', 'PENDING'].includes(status)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 });
  }

  await updateCollection(collection as keyof Data, items => {
    const item = (items as any[]).find((i: any) => i.id === id);
    if (item) {
      item.status = status;
      if (status === 'APPROVED') item.approvedAt = new Date().toISOString();
    }
  });

  await logActivity({
    actor,
    action: `BRAND_${status}`,
    details: `${collection} item ${id} set to ${status}`,
  });

  return Response.json({ ok: true });
}
