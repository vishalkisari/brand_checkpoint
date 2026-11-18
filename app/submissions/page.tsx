'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'APPROVED' ? 'badge-approved'
    : status === 'REJECTED' ? 'badge-rejected'
    : status === 'CHANGES_REQUESTED' ? 'badge-changes'
    : status === 'REVIEW_REQUIRED' ? 'badge-high'
    : 'badge-pending';
  return <span className={`badge ${cls}`}>{status.replace(/_/g, ' ')}</span>;
}

export default function SubmissionsPage() {
  const { role } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const [subs, camps] = await Promise.all([
      fetch('/api/collections/submissions').then(r => r.json()),
      fetch('/api/collections/campaigns').then(r => r.json()),
    ]);
    setSubmissions(Array.isArray(subs) ? subs : []);
    setCampaigns(Array.isArray(camps) ? camps : []);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const campMap = Object.fromEntries(campaigns.map(c => [c.id, c.title]));

  const filtered = filter === 'ALL'
    ? submissions
    : submissions.filter(s => s.status === filter);

  const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const counts = {
    ALL: submissions.length,
    REVIEW_REQUIRED: submissions.filter(s => s.status === 'REVIEW_REQUIRED').length,
    APPROVED: submissions.filter(s => s.status === 'APPROVED').length,
    CHANGES_REQUESTED: submissions.filter(s => s.status === 'CHANGES_REQUESTED').length,
    REJECTED: submissions.filter(s => s.status === 'REJECTED').length,
  };

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">All Submissions</h1>
            <p className="page-subtitle">Complete submission history with version tracking</p>
          </div>
          {(role === 'CREATOR' || role === 'ADMIN') && (
            <Link href="/submit" className="btn btn-primary">+ Submit Content</Link>
          )}
        </div>
      </div>

      <div className="page-content">
        {/* Filter tabs */}
        <div className="tabs">
          {[
            { key: 'ALL', label: `All (${counts.ALL})` },
            { key: 'REVIEW_REQUIRED', label: `Needs Review (${counts.REVIEW_REQUIRED})` },
            { key: 'CHANGES_REQUESTED', label: `Changes Requested (${counts.CHANGES_REQUESTED})` },
            { key: 'APPROVED', label: `Approved (${counts.APPROVED})` },
            { key: 'REJECTED', label: `Rejected (${counts.REJECTED})` },
          ].map(f => (
            <button key={f.key} className={`tab-btn ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-muted">Loading…</div>
        ) : sorted.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-title">No submissions found</div>
              <div className="empty-desc">
                {filter !== 'ALL' ? 'No submissions match this filter.' : 'Submit content to get started.'}
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Version</th>
                  <th>Submitted By</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="font-semibold">{s.title}</div>
                      {s.parentId && <div className="text-sm text-muted mt-1">↩ Revision of earlier submission</div>}
                    </td>
                    <td className="text-muted text-sm">{campMap[s.campaignId] ?? s.campaignId}</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td className="text-muted text-sm">v{s.version}</td>
                    <td className="text-muted text-sm">{s.createdBy}</td>
                    <td className="text-muted text-sm">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link href={`/submissions/${s.id}`} className="btn btn-secondary btn-sm">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
