'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Stats {
  campaigns: number;
  submissions: number;
  pending: number;
  approved: number;
  findings: number;
  critical: number;
}

interface RecentSub {
  id: string;
  title: string;
  status: string;
  campaignId: string;
  createdAt: string;
  version: number;
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'APPROVED' ? 'badge-approved'
    : status === 'REJECTED' ? 'badge-rejected'
    : status === 'CHANGES_REQUESTED' ? 'badge-changes'
    : status === 'REVIEW_REQUIRED' ? 'badge-high'
    : 'badge-pending';
  return <span className={`badge ${cls}`}>{status.replace('_', ' ')}</span>;
}

export default function Dashboard() {
  const { role } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentSub[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  const load = useCallback(async () => {
    const [subRes, findRes, campRes] = await Promise.all([
      fetch('/api/collections/submissions').then(r => r.json()),
      fetch('/api/collections/findings').then(r => r.json()),
      fetch('/api/collections/campaigns').then(r => r.json()),
    ]);
    const subs: any[] = Array.isArray(subRes) ? subRes : [];
    const finds: any[] = Array.isArray(findRes) ? findRes : [];
    const camps: any[] = Array.isArray(campRes) ? campRes : [];
    setStats({
      campaigns: camps.length,
      submissions: subs.length,
      pending: subs.filter((s: any) => s.status === 'REVIEW_REQUIRED' || s.status === 'PENDING').length,
      approved: subs.filter((s: any) => s.status === 'APPROVED').length,
      findings: finds.length,
      critical: finds.filter((f: any) => f.severity === 'CRITICAL').length,
    });
    setRecent([...subs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6));
  }, []);

  useEffect(() => { load(); }, [load]);

  const seed = async () => {
    setSeeding(true);
    setSeedMsg('');
    const res = await fetch('/api/seed', { method: 'POST' });
    const data = await res.json();
    setSeedMsg(data.message ?? 'Done');
    await load();
    setSeeding(false);
  };

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Brand governance at a glance — NOVA Wellness</p>
          </div>
          {role === 'ADMIN' && (
            <button className="btn btn-secondary btn-sm" onClick={seed} disabled={seeding}>
              {seeding ? <><span className="spinner" /> Seeding…</> : '🌱 Seed NOVA Demo'}
            </button>
          )}
        </div>
        {seedMsg && <div className={`alert ${seedMsg.includes('Already') ? 'alert-info' : 'alert-success'} mt-3`}>{seedMsg}</div>}
      </div>

      <div className="page-content">
        {/* KPI Stats */}
        <div className="stats-grid mb-4">
          {[
            { label: 'Campaigns', value: stats?.campaigns ?? '—', color: 'var(--teal)', link: '/campaigns' },
            { label: 'Submissions', value: stats?.submissions ?? '—', color: 'var(--navy-mid)', link: '/submissions' },
            { label: 'Pending Review', value: stats?.pending ?? '—', color: 'var(--amber)', link: '/review' },
            { label: 'Approved', value: stats?.approved ?? '—', color: 'var(--green)', link: '/submissions' },
            { label: 'Total Findings', value: stats?.findings ?? '—', color: 'var(--slate)', link: '/submissions' },
            { label: 'Critical Issues', value: stats?.critical ?? '—', color: 'var(--red)', link: '/review' },
          ].map(s => (
            <Link href={s.link} key={s.label} style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ borderTop: `3px solid ${s.color}`, cursor: 'pointer' }}>
                <div className="stat-value" style={{ color: s.color }}>{String(s.value)}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Submissions */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Submissions</span>
            <Link href="/submissions" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-title">No submissions yet</div>
              <div className="empty-desc">
                {role === 'ADMIN' ? 'Seed the NOVA demo data to see a complete example.' : 'Submit marketing content for review to get started.'}
              </div>
              {role === 'ADMIN' && <button className="btn btn-primary mt-3" onClick={seed} disabled={seeding}>🌱 Seed Demo Data</button>}
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Version</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recent.map(s => (
                  <tr key={s.id}>
                    <td className="font-semibold truncate" style={{ maxWidth: 220 }}>{s.title}</td>
                    <td className="text-muted text-sm">{s.campaignId}</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td className="text-muted text-sm">v{s.version}</td>
                    <td className="text-muted text-sm">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link href={`/submissions/${s.id}`} className="btn btn-ghost btn-sm">Review →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick links */}
        <div className="grid-3 mt-4">
          {[
            { href: '/brand', icon: '📋', title: 'Brand Knowledge', desc: 'Manage facts, terms & rules' },
            { href: '/submit', icon: '📝', title: 'Submit Content', desc: 'Submit marketing copy for review' },
            { href: '/review', icon: '🔍', title: 'Review Queue', desc: 'Review pending submissions' },
          ].map(l => (
            <Link href={l.href} key={l.href} style={{ textDecoration: 'none' }}>
              <div className="card card-padded" style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow)')}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{l.icon}</div>
                <div className="font-semibold" style={{ fontSize: 15, marginBottom: 4 }}>{l.title}</div>
                <div className="text-sm text-muted">{l.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
