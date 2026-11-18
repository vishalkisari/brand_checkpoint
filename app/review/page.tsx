'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

function SeverityDot({ severity }: { severity: string }) {
  const color = severity === 'CRITICAL' ? 'var(--red)' : severity === 'HIGH' ? '#D97706' : severity === 'MEDIUM' ? '#F59E0B' : 'var(--green)';
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, marginRight: 4 }} />;
}

export default function ReviewQueue() {
  const { role, user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [findingCounts, setFindingCounts] = useState<Record<string, { critical: number; high: number; total: number }>>({});
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const [subs, camps, finds] = await Promise.all([
      fetch('/api/collections/submissions').then(r => r.json()),
      fetch('/api/collections/campaigns').then(r => r.json()),
      fetch('/api/collections/findings').then(r => r.json()),
    ]);
    const allSubs: any[] = Array.isArray(subs) ? subs : [];
    const allFinds: any[] = Array.isArray(finds) ? finds : [];

    // Filter to review queue: REVIEW_REQUIRED or PENDING
    const queue = allSubs.filter(s => s.status === 'REVIEW_REQUIRED' || s.status === 'PENDING');
    setSubmissions([...queue].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setCampaigns(Array.isArray(camps) ? camps : []);

    // Build finding counts per submission
    const counts: Record<string, { critical: number; high: number; total: number }> = {};
    for (const sub of queue) {
      const sf = allFinds.filter(f => f.submissionId === sub.id && f.status === 'OPEN');
      counts[sub.id] = {
        total: sf.length,
        critical: sf.filter(f => f.severity === 'CRITICAL').length,
        high: sf.filter(f => f.severity === 'HIGH').length,
      };
    }
    setFindingCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const campMap = Object.fromEntries(campaigns.map(c => [c.id, c.title]));

  const prioritized = [...submissions].sort((a, b) => {
    const ac = findingCounts[a.id] ?? { critical: 0, high: 0 };
    const bc = findingCounts[b.id] ?? { critical: 0, high: 0 };
    if (bc.critical !== ac.critical) return bc.critical - ac.critical;
    if (bc.high !== ac.high) return bc.high - ac.high;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Review Queue</h1>
        <p className="page-subtitle">
          {submissions.length} submission{submissions.length !== 1 ? 's' : ''} awaiting review — sorted by severity
        </p>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="text-muted">Loading…</div>
        ) : prioritized.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">🎉</div>
              <div className="empty-title">Review queue is empty</div>
              <div className="empty-desc">All submissions have been reviewed. Great work!</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {prioritized.map(s => {
              const fc = findingCounts[s.id] ?? { critical: 0, high: 0, total: 0 };
              const riskLevel = fc.critical > 0 ? 'CRITICAL' : fc.high > 0 ? 'HIGH' : fc.total > 0 ? 'MEDIUM' : 'LOW';
              const borderColor = riskLevel === 'CRITICAL' ? 'var(--red)' : riskLevel === 'HIGH' ? '#D97706' : riskLevel === 'MEDIUM' ? '#F59E0B' : 'var(--green)';

              return (
                <div key={s.id} className="card" style={{ borderLeft: `4px solid ${borderColor}` }}>
                  <div className="card-padded">
                    <div className="flex items-center justify-between">
                      <div style={{ flex: 1 }}>
                        <div className="flex items-center gap-2 mb-1">
                          {fc.critical > 0 && <span className="badge badge-critical">🚨 {fc.critical} Critical</span>}
                          {fc.high > 0 && <span className="badge badge-high">⚠️ {fc.high} High</span>}
                          {fc.total === 0 && <span className="badge badge-approved">✓ No Issues</span>}
                          <span className="badge badge-draft">v{s.version}</span>
                        </div>
                        <div className="font-semibold" style={{ fontSize: 15 }}>{s.title}</div>
                        <div className="text-sm text-muted mt-1">
                          Campaign: {campMap[s.campaignId] ?? s.campaignId} · Submitted by {s.createdBy} · {new Date(s.createdAt).toLocaleString()}
                        </div>
                        {s.parentId && <div className="text-sm mt-1" style={{ color: 'var(--teal)' }}>↩ Revised submission</div>}
                      </div>
                      <div className="flex gap-2" style={{ marginLeft: 20 }}>
                        <Link href={`/submissions/${s.id}`} className="btn btn-primary btn-sm">Review →</Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
