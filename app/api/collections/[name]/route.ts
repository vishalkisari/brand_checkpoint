/**
 * GET  /api/collections/[name] — fetch a collection
 * POST /api/collections/[name] — add item to collection
 */
import { NextRequest } from 'next/server';
import { getCollection, addToCollection } from '@/lib/storage';
import type { Data } from '@/lib/storage';

const ALLOWED_COLLECTIONS: (keyof Data)[] = [
  'organizations',
  'brandFacts',
  'brandTerms',
  'brandRules',
  'campaigns',
  'campaignFacts',
  'submissions',
  'findings',
  'reviewDecisions',
  'activityLogs',
];

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/collections/[name]'>
) {
  const { name } = await ctx.params;
  if (!ALLOWED_COLLECTIONS.includes(name as keyof Data)) {
    return Response.json({ error: 'Unknown collection' }, { status: 400 });
  }
  const items = await getCollection(name as keyof Data);
  return Response.json(items);
}

export async function POST(
  req: NextRequest,
  ctx: RouteContext<'/api/collections/[name]'>
) {
  const { name } = await ctx.params;
  if (!ALLOWED_COLLECTIONS.includes(name as keyof Data)) {
    return Response.json({ error: 'Unknown collection' }, { status: 400 });
  }
  const item = await req.json();
  await addToCollection(name as keyof Data, item);
  return Response.json({ ok: true });
}
