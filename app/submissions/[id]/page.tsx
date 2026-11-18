'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function SeverityBadge({ severity }: { severity: string }) {
  const cls = severity === 'CRITICAL' ? 'badge-critical'
    : severity === 'HIGH' ? 'badge-high'
    : severity === 'MEDIUM' ? 'badge-medium'
    : 'badge-low';
  return <span className={`badge ${cls}`}>{severity}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'APPROVED' ? 'badge-approved'
    : status === 'REJECTED' ? 'badge-rejected'
    : status === 'CHANGES_REQUESTED' ? 'badge-changes'
    : status === 'REVIEW_REQUIRED' ? 'badge-high'
    : 'badge-pending';
  return <span className={`badge ${cls}`}>{status.replace(/_/g, ' ')}</span>;
}

interface Finding {
  id: string;
  source: 'DETERMINISTIC' | 'AI';
  category: string;
  issue: string;
  excerpt: string;
  severity: string;
  evidence: string;
  suggestedFix?: string;
  status: string;
}

export default function SubmissionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { role, user } = useAuth();
  const router = useRouter();

  const [id, setId] = useState('');
  const [submission, setSubmission] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Review form
  const [decision, setDecision] = useState<'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED'>('APPROVED');
  const [comments, setComments] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Resubmit form
  const [resubmitContent, setResubmitContent] = useState('');
  const [resubmitNotes, setResubmitNotes] = useState('');
  const [resubmitting, setResubmitting] = useState(false);
  const [showResubmit, setShowResubmit] = useState(false);

  useEffect(() => { params.then(p => setId(p.id)); }, [params]);

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [subs, finds, decs, hist, camps] = await Promise.all([
      fetch('/api/collections/submissions').then(r => r.json()),
      fetch(`/api/submissions/${id}/findings`).then(r => r.json()),
      fetch(`/api/submissions/${id}/review`).then(r => r.json()),
      fetch(`/api/submissions/${id}/history`).then(r => r.json()),
      fetch('/api/collections/campaigns').then(r => r.json()),
    ]);
    const sub = (Array.isArray(subs) ? subs : []).find((s: any) => s.id === id);
    setSubmission(sub ?? null);
    if (sub) {
      const camp = (Array.isArray(camps) ? camps : []).find((c: any) => c.id === sub.campaignId);
      setCampaign(camp ?? null);
      setResubmitContent(sub.content);
    }
    setFindings(Array.isArray(finds) ? finds : []);
    setDecisions(Array.isArray(decs) ? decs : []);
    setHistory(Array.isArray(hist) ? hist : []);
    setLoading(false);
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  const submitReview = async () => {
    if (!comments.trim()) {
      alert('Please add review comments.');
      return;
    }
    setSubmittingReview(true);
    await fetch(`/api/submissions/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, comments, reviewerId: user.name }),
    });
    setSubmittingReview(false);
    setComments('');
    reload();
  };

  const handleResubmit = async () => {
    if (!resubmitContent.trim()) return;
    setResubmitting(true);
    const res = await fetch('/api/resubmit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentId: id,
        content: resubmitContent.trim(),
        createdBy: user.name,
        notes: resubmitNotes.trim(),
      }),
    });
    const data = await res.json();
    setResubmitting(false);
    if (data.submissionId) {
      router.push(`/submissions/${data.submissionId}`);
    }
  };

  const dismissFinding = async (findingId: string) => {
    await fetch(`/api/submissions/${id}/findings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ findingId, status: 'DISMISSED' }),
    });
    reload();
  };

  if (loading) return <div className="page-content"><p className="text-muted">Loading submission…</p></div>;
  if (!submission) return <div className="page-content"><div className="card"><div className="empty-state"><div className="empty-title">Submission not found</div></div></div></div>;

  const openFindings = findings.filter(f => f.status === 'OPEN');
  const criticalCount = openFindings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = openFindings.filter(f => f.severity === 'HIGH').length;
  const latestDecision = decisions.length > 0 ? decisions[decisions.length - 1] : null;

  const canReview = role === 'REVIEWER' || role === 'ADMIN';
  const canResubmit = (role === 'CREATOR' || role === 'ADMIN') &&
    (submission.status === 'CHANGES_REQUESTED' || submission.status === 'REVIEW_REQUIRED');

  return (
    <>
      <div className="page-header">
        <div className="flex items-center gap-2 text-sm text-muted mb-2">
          <Link href="/submissions" className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }}>← All Submissions</Link>
          {campaign && <><span>·</span><Link href={`/campaigns/${campaign.id}`} className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }}>{campaign.title}</Link></>}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">{submission.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={submission.status} />
              <span className="badge badge-draft">v{submission.version}</span>
              {submission.parentId && <span className="badge badge-det">↩ Revision</span>}
              <span className="text-sm text-muted">· {submission.createdBy} · {new Date(submission.createdAt).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {canResubmit && (
              <button className="btn btn-secondary" onClick={() => setShowResubmit(!showResubmit)}>
                ✏️ Submit Correction
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Alert banners */}
        {criticalCount > 0 && (
          <div className="alert alert-error">
            <span>🚨</span>
            <span><strong>{criticalCount} CRITICAL issue{criticalCount > 1 ? 's' : ''}</strong> found — this content cannot be published without correction.</span>
          </div>
        )}
        {latestDecision && (
          <div className={`alert ${latestDecision.decision === 'APPROVED' ? 'alert-success' : latestDecision.decision === 'REJECTED' ? 'alert-error' : 'alert-warning'}`}>
            <span>{latestDecision.decision === 'APPROVED' ? '✅' : latestDecision.decision === 'REJECTED' ? '❌' : '⚠️'}</span>
            <span>
              <strong>{latestDecision.decision.replace('_', ' ')}</strong> by {latestDecision.reviewerId} on {new Date(latestDecision.createdAt).toLocaleString()}
              {latestDecision.comments && <> — "{latestDecision.comments}"</>}
            </span>
          </div>
        )}

        {/* Resubmit form */}
        {showResubmit && (
          <div className="card card-padded mb-4" style={{ borderLeft: '4px solid var(--teal)' }}>
            <div className="card-title mb-2">Submit Correction</div>
            <p className="text-sm text-muted mb-3">Edit the content below to address the findings, then submit the revision.</p>
            <div className="form-group">
              <label className="form-label">Revised Content</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: 180, fontFamily: 'inherit' }}
                value={resubmitContent}
                onChange={e => setResubmitContent(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Revision Notes (optional)</label>
              <input
                className="form-input"
                placeholder="Describe what you changed…"
                value={resubmitNotes}
                onChange={e => setResubmitNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={handleResubmit} disabled={resubmitting || !resubmitContent.trim()}>
                {resubmitting ? <><span className="spinner" /> Analyzing & Submitting…</> : '🔍 Submit Revision'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowResubmit(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="split-view">
          {/* LEFT — Findings */}
          <div>
            {/* Findings summary */}
            <div className="card mb-4">
              <div className="card-header">
                <span className="card-title">🔍 Analysis Findings ({openFindings.length} open)</span>
                <div className="flex gap-2">
                  {criticalCount > 0 && <span className="badge badge-critical">{criticalCount} Critical</span>}
                  {highCount > 0 && <span className="badge badge-high">{highCount} High</span>}
                </div>
              </div>
              <div style={{ padding: '12px 16px' }}>
                {findings.length === 0 ? (
                  <div className="empty-state" style={{ padding: 24 }}>
                    <div className="empty-icon">✅</div>
                    <div className="empty-title">No findings</div>
                    <div className="empty-desc">Content passed all brand compliance checks.</div>
                  </div>
                ) : (
                  <>
                    {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(sev => {
                      const sevFindings = findings.filter(f => f.severity === sev);
                      if (sevFindings.length === 0) return null;
                      return (
                        <div key={sev} className="mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <SeverityBadge severity={sev} />
                            <span className="text-sm text-muted">{sevFindings.length} finding{sevFindings.length > 1 ? 's' : ''}</span>
                          </div>
                          {sevFindings.map(f => (
                            <div key={f.id} className="finding-card" style={{ opacity: f.status === 'DISMISSED' ? 0.5 : 1 }}>
                              <div className="finding-header" onClick={() => setExpandedFinding(expandedFinding === f.id ? null : f.id)}>
                                <div style={{ flex: 1 }}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`badge ${f.source === 'AI' ? 'badge-ai' : 'badge-det'}`}>
                                      {f.source === 'AI' ? '🤖 AI' : '⚙️ Rule'}
                                    </span>
                                    <span className="text-sm text-muted">{f.category}</span>
                                    {f.status !== 'OPEN' && <span className="badge badge-draft">{f.status}</span>}
                                  </div>
                                  <div className="font-semibold" style={{ fontSize: 13.5 }}>{f.issue}</div>
                                </div>
                                <span className="text-muted text-sm">{expandedFinding === f.id ? '▲' : '▼'}</span>
                              </div>

                              {expandedFinding === f.id && (
                                <div className="finding-body">
                                  {f.excerpt && (
                                    <div className="finding-excerpt">"{f.excerpt}"</div>
                                  )}
                                  <div className="finding-evidence">{f.evidence}</div>
                                  {f.suggestedFix && (
                                    <div className="finding-fix">💡 {f.suggestedFix}</div>
                                  )}
                                  {role === 'REVIEWER' && f.status === 'OPEN' && (
                                    <button
                                      className="btn btn-secondary btn-sm mt-2"
                                      onClick={() => dismissFinding(f.id)}
                                    >
                                      Dismiss Finding
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>

            {/* Version History */}
            {history.length > 1 && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">📜 Version History</span>
                </div>
                <table className="table">
                  <thead><tr><th>Version</th><th>Status</th><th>Date</th><th></th></tr></thead>
                  <tbody>
                    {history.map(h => (
                      <tr key={h.id} style={{ background: h.id === id ? 'var(--teal-pale)' : undefined }}>
                        <td className="font-semibold">v{h.version} {h.id === id && <span className="badge badge-det" style={{ marginLeft: 4 }}>current</span>}</td>
                        <td><StatusBadge status={h.status} /></td>
                        <td className="text-muted text-sm">{new Date(h.createdAt).toLocaleDateString()}</td>
                        <td>
                          {h.id !== id && <Link href={`/submissions/${h.id}`} className="btn btn-ghost btn-sm">View</Link>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* RIGHT — Content + Review */}
          <div>
            {/* Original content */}
            <div className="card mb-4">
              <div className="card-header">
                <span className="card-title">📄 Submitted Content</span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <pre style={{
                  fontFamily: 'inherit',
                  fontSize: 13.5,
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  background: 'var(--surface)',
                  padding: '14px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  maxHeight: 320,
                  overflowY: 'auto',
                }}>
                  {submission.content}
                </pre>
              </div>
            </div>

            {/* Review panel */}
            {canReview && (submission.status === 'REVIEW_REQUIRED' || submission.status === 'PENDING') && (
              <div className="card mb-4">
                <div className="card-header">
                  <span className="card-title">📋 Reviewer Decision</span>
                </div>
                <div className="card-padded">
                  <div className="form-group">
                    <label className="form-label">Decision</label>
                    <div className="flex gap-2">
                      {(['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'] as const).map(d => (
                        <button
                          key={d}
                          className={`btn btn-sm ${decision === d
                            ? d === 'APPROVED' ? 'btn-success'
                              : d === 'REJECTED' ? 'btn-danger'
                              : 'btn-secondary'
                            : 'btn-secondary'}`}
                          onClick={() => setDecision(d)}
                          style={decision === d && d === 'CHANGES_REQUESTED' ? { background: '#7C3AED', color: '#fff' } : undefined}
                        >
                          {d === 'APPROVED' ? '✅ Approve' : d === 'CHANGES_REQUESTED' ? '⚠️ Request Changes' : '❌ Reject'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Review Comments (required)</label>
                    <textarea
                      className="form-textarea"
                      style={{ minHeight: 100 }}
                      placeholder="Explain your decision — what must change, what was done well…"
                      value={comments}
                      onChange={e => setComments(e.target.value)}
                    />
                  </div>
                  <button
                    className={`btn ${decision === 'APPROVED' ? 'btn-success' : decision === 'REJECTED' ? 'btn-danger' : 'btn-primary'}`}
                    onClick={submitReview}
                    disabled={submittingReview || !comments.trim()}
                  >
                    {submittingReview ? <><span className="spinner" /> Submitting…</> : `Submit ${decision.replace('_', ' ')} Decision`}
                  </button>
                </div>
              </div>
            )}

            {/* Previous decisions */}
            {decisions.length > 0 && (
              <div className="card">
                <div className="card-header"><span className="card-title">🗂️ Review History</span></div>
                <div className="timeline" style={{ padding: '12px 20px' }}>
                  {[...decisions].reverse().map(d => (
                    <div key={d.id} className="timeline-item">
                      <div className="timeline-dot" style={{
                        background: d.decision === 'APPROVED' ? 'var(--green-pale)' : d.decision === 'REJECTED' ? 'var(--red-pale)' : 'var(--amber-pale)',
                        color: d.decision === 'APPROVED' ? 'var(--green)' : d.decision === 'REJECTED' ? 'var(--red)' : 'var(--amber)',
                      }}>
                        {d.decision === 'APPROVED' ? '✓' : d.decision === 'REJECTED' ? '✕' : '!'}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-action">
                          <span className={`badge ${d.decision === 'APPROVED' ? 'badge-approved' : d.decision === 'REJECTED' ? 'badge-rejected' : 'badge-changes'}`}>
                            {d.decision.replace('_', ' ')}
                          </span>
                          {' '}by <strong>{d.reviewerId}</strong>
                        </div>
                        <div className="timeline-meta">{new Date(d.createdAt).toLocaleString()}</div>
                        {d.comments && <div className="timeline-detail">"{d.comments}"</div>}
                        <div className="timeline-meta mt-1">
                          Findings: {d.findingsSummary.total} total ({d.findingsSummary.critical} critical, {d.findingsSummary.high} high)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
