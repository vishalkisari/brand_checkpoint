'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function CampaignsPage() {
  const { user, role } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await fetch('/api/collections/campaigns').then(r => r.json());
    setCampaigns(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const addCampaign = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await fetch('/api/collections/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `camp_${Date.now()}`,
        orgId: 'org_nova',
        title: title.trim(),
        description: desc.trim() || undefined,
        status: 'ACTIVE',
        createdBy: user.name,
        createdAt: new Date().toISOString(),
      }),
    });
    setTitle(''); setDesc('');
    setSaving(false);
    reload();
  };

  if (loading) return <div className="page-content"><p className="text-muted">Loading campaigns…</p></div>;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Campaigns</h1>
        <p className="page-subtitle">Marketing campaigns with Truth Sheets and submission tracking</p>
      </div>
      <div className="page-content">
        {(role === 'ADMIN' || role === 'CREATOR') && (
          <div className="card card-padded mb-4">
            <div className="card-title mb-3">New Campaign</div>
            <div className="form-group">
              <label className="form-label">Campaign Title</label>
              <input className="form-input" placeholder="e.g. Sleep Better — Q1 2025" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <input className="form-input" placeholder="Brief description of campaign goals" value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={addCampaign} disabled={saving}>{saving ? 'Creating…' : '+ Create Campaign'}</button>
          </div>
        )}

        {campaigns.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <div className="empty-title">No campaigns yet</div>
              <div className="empty-desc">Create a campaign to organize your marketing submissions.</div>
            </div>
          </div>
        ) : (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="font-semibold">{c.title}</div>
                      {c.description && <div className="text-sm text-muted mt-1">{c.description}</div>}
                    </td>
                    <td><span className={`badge ${c.status === 'ACTIVE' ? 'badge-approved' : 'badge-draft'}`}>{c.status}</span></td>
                    <td className="text-muted text-sm">{c.createdBy}</td>
                    <td className="text-muted text-sm">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link href={`/campaigns/${c.id}`} className="btn btn-secondary btn-sm">View →</Link>
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
