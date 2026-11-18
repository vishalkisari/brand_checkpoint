'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function CampaignDetail({ params }: { params: Promise<{ id: string }> }) {
  const { role, user } = useAuth();
  const [id, setId] = useState('');
  const [campaign, setCampaign] = useState<any>(null);
  const [facts, setFacts] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [factKey, setFactKey] = useState('');
  const [factVal, setFactVal] = useState('');
  const [required, setRequired] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  const reload = useCallback(async () => {
    if (!id) return;
    const [camps, allFacts, allSubs] = await Promise.all([
      fetch('/api/collections/campaigns').then(r => r.json()),
      fetch('/api/collections/campaignFacts').then(r => r.json()),
      fetch('/api/collections/submissions').then(r => r.json()),
    ]);
    const c = (Array.isArray(camps) ? camps : []).find((c: any) => c.id === id);
    setCampaign(c ?? null);
    setFacts((Array.isArray(allFacts) ? allFacts : []).filter((f: any) => f.campaignId === id));
    setSubmissions((Array.isArray(allSubs) ? allSubs : []).filter((s: any) => s.campaignId === id));
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  const addFact = async () => {
    if (!factKey.trim() || !factVal.trim()) return;
    setSaving(true);
    await fetch('/api/collections/campaignFacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `cfact_${Date.now()}`,
        campaignId: id,
        key: factKey.trim(),
        value: factVal.trim(),
        required,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      }),
    });
    setFactKey(''); setFactVal('');
    setSaving(false);
    reload();
  };

  if (!campaign) return (
    <div className="page-content">
      <div className="card"><div className="empty-state"><div className="empty-icon">🎯</div><div className="empty-title">Campaign not found</div></div></div>
    </div>
  );

  const statusCounts = {
    total: submissions.length,
    approved: submissions.filter(s => s.status === 'APPROVED').length,
    review: submissions.filter(s => s.status === 'REVIEW_REQUIRED' || s.status === 'PENDING').length,
  };

  return (
    <>
      <div className="page-header">
        <div className="flex items-center gap-2 text-sm text-muted mb-2">
          <Link href="/campaigns" className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }}>← Campaigns</Link>
        </div>
        <h1 className="page-title">{campaign.title}</h1>
        {campaign.description && <p className="page-subtitle">{campaign.description}</p>}
      </div>
      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid mb-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-card"><div className="stat-value">{statusCounts.total}</div><div className="stat-label">Total Submissions</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--green)' }}>{statusCounts.approved}</div><div className="stat-label">Approved</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--amber)' }}>{statusCounts.review}</div><div className="stat-label">Pending Review</div></div>
        </div>

        <div className="split-view">
          {/* Truth Sheet */}
          <div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">📋 Campaign Truth Sheet</span>
                <span className="badge badge-approved">{facts.filter(f => f.status === 'APPROVED').length} Approved</span>
              </div>
              <div style={{ padding: '0 0 8px' }}>
                {facts.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px' }}>
                    <div className="empty-title">No Truth Sheet items yet</div>
                  </div>
                ) : (
                  <table className="table">
                    <thead><tr><th>Key</th><th>Required Value</th><th>Required?</th><th>Status</th></tr></thead>
                    <tbody>
                      {facts.map(f => (
                        <tr key={f.id}>
                          <td className="font-semibold">{f.key}</td>
                          <td style={{ maxWidth: 220, wordBreak: 'break-word', fontSize: 12.5 }}>{f.value}</td>
                          <td>{f.required ? <span className="badge badge-critical">Required</span> : <span className="badge badge-draft">Optional</span>}</td>
                          <td><span className={`badge ${f.status === 'APPROVED' ? 'badge-approved' : 'badge-pending'}`}>{f.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {role === 'ADMIN' && (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
                    <div className="card-title mb-3 text-sm">Add Truth Sheet Item</div>
                    <div className="grid-2 mb-2">
                      <input className="form-input" placeholder="Key (e.g. Disclaimer)" value={factKey} onChange={e => setFactKey(e.target.value)} />
                      <input className="form-input" placeholder="Required value" value={factVal} onChange={e => setFactVal(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-3">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                        <input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)} />
                        Required
                      </label>
                      <button className="btn btn-primary btn-sm" onClick={addFact} disabled={saving}>Add</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submissions */}
          <div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">📂 Submissions</span>
                <Link href={`/submit?campaign=${id}`} className="btn btn-primary btn-sm">+ Submit Content</Link>
              </div>
              {submissions.length === 0 ? (
                <div className="empty-state" style={{ padding: 32 }}>
                  <div className="empty-title">No submissions yet</div>
                </div>
              ) : (
                <table className="table">
                  <thead><tr><th>Title</th><th>Status</th><th>v</th><th></th></tr></thead>
                  <tbody>
                    {[...submissions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(s => (
                      <tr key={s.id}>
                        <td className="font-semibold truncate" style={{ maxWidth: 160 }}>{s.title}</td>
                        <td>
                          <span className={`badge ${s.status === 'APPROVED' ? 'badge-approved' : s.status === 'REJECTED' ? 'badge-rejected' : s.status === 'CHANGES_REQUESTED' ? 'badge-changes' : 'badge-high'}`}>
                            {s.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="text-muted text-sm">v{s.version}</td>
                        <td><Link href={`/submissions/${s.id}`} className="btn btn-ghost btn-sm">View</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
