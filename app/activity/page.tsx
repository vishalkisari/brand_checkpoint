'use client';
import React, { useEffect, useState, useCallback } from 'react';

const ACTION_ICONS: Record<string, string> = {
  SUBMISSION_CREATED: '📝',
  RESUBMISSION_CREATED: '↩',
  ANALYSIS_COMPLETE: '🔍',
  REVIEW_APPROVED: '✅',
  REVIEW_CHANGES_REQUESTED: '⚠️',
  REVIEW_REJECTED: '❌',
  BRAND_APPROVED: '📋',
  BRAND_ARCHIVED: '🗄️',
  BRAND_PENDING: '🔄',
  SEED_COMPLETE: '🌱',
  DEFAULT: '•',
};

const ACTION_COLORS: Record<string, string> = {
  REVIEW_APPROVED: 'var(--green)',
  REVIEW_REJECTED: 'var(--red)',
  REVIEW_CHANGES_REQUESTED: 'var(--amber)',
  ANALYSIS_COMPLETE: 'var(--teal)',
  SUBMISSION_CREATED: 'var(--navy-mid)',
  RESUBMISSION_CREATED: '#7C3AED',
};

function formatAction(action: string) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await fetch('/api/collections/activityLogs').then(r => r.json());
    const sorted = [...(Array.isArray(data) ? data : [])].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
    setLogs(sorted);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const categories = ['ALL', 'SUBMISSION', 'REVIEW', 'BRAND', 'ANALYSIS'];
  const filtered = filter === 'ALL'
    ? logs
    : logs.filter(l => l.action.startsWith(filter));

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Activity Log</h1>
            <p className="page-subtitle">Complete audit trail of all platform activity</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={reload}>↻ Refresh</button>
        </div>
      </div>

      <div className="page-content">
        {/* Category filters */}
        <div className="tabs">
          {categories.map(cat => {
            const count = cat === 'ALL' ? logs.length : logs.filter(l => l.action.startsWith(cat)).length;
            return (
              <button key={cat} className={`tab-btn ${filter === cat ? 'active' : ''}`} onClick={() => setFilter(cat)}>
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-muted">Loading activity…</div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">📜</div>
              <div className="empty-title">No activity yet</div>
              <div className="empty-desc">Seed the NOVA demo data from the Dashboard to see a full audit trail.</div>
            </div>
          </div>
        ) : (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}></th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Details</th>
                  <th>Submission</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => {
                  const icon = ACTION_ICONS[log.action] ?? ACTION_ICONS.DEFAULT;
                  const color = ACTION_COLORS[log.action] ?? 'var(--slate)';
                  return (
                    <tr key={log.id}>
                      <td style={{ textAlign: 'center', fontSize: 16 }}>{icon}</td>
                      <td>
                        <span className="font-semibold" style={{ color }}>
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="text-sm">
                        <span className="badge badge-det">{log.actor}</span>
                      </td>
                      <td className="text-sm text-muted" style={{ maxWidth: 300 }}>
                        {log.details ?? '—'}
                      </td>
                      <td className="text-sm">
                        {log.submissionId ? (
                          <a href={`/submissions/${log.submissionId}`} style={{ color: 'var(--teal)', textDecoration: 'none' }}>
                            {log.submissionId.slice(0, 16)}…
                          </a>
                        ) : '—'}
                      </td>
                      <td className="text-sm text-muted" style={{ whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
