'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface AnalysisResult {
  submissionId: string;
  status: string;
  findingsCount: number;
  overallRisk: string;
  summary: string;
  toneAssessment: string;
  aiMode: 'live' | 'demo';
}

export default function SubmitPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignId, setCampaignId] = useState(searchParams.get('campaign') ?? '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/collections/campaigns').then(r => r.json()).then(data => {
      const camps = Array.isArray(data) ? data.filter((c: any) => c.status === 'ACTIVE') : [];
      setCampaigns(camps);
      if (!campaignId && camps.length > 0) setCampaignId(camps[0].id);
    });
  }, []);

  const handleSubmit = async () => {
    if (!campaignId || !content.trim()) {
      setError('Please select a campaign and enter content.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          orgId: 'org_nova',
          title: title.trim() || 'Untitled Submission',
          content: content.trim(),
          createdBy: user.name,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? 'Submission failed');
        setLoading(false);
        return;
      }

      const data: AnalysisResult = await res.json();
      setResult(data);
      setLoading(false);
    } catch (e) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const riskColor = (risk: string) =>
    risk === 'CRITICAL' ? 'var(--red)' :
    risk === 'HIGH' ? '#D97706' :
    risk === 'MEDIUM' ? '#92400E' :
    'var(--green)';

  if (result) {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Analysis Complete</h1>
          <p className="page-subtitle">Your submission has been analyzed and queued for review.</p>
        </div>
        <div className="page-content">
          <div className="card card-padded mb-4" style={{ borderTop: `4px solid ${riskColor(result.overallRisk)}` }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-bold" style={{ fontSize: 18 }}>
                  Overall Risk: <span style={{ color: riskColor(result.overallRisk) }}>{result.overallRisk}</span>
                </div>
                <div className="text-sm text-muted mt-1">{result.findingsCount} finding(s) identified</div>
              </div>
              <span className={`badge ${result.aiMode === 'live' ? 'badge-ai' : 'badge-det'}`}>
                {result.aiMode === 'live' ? '🤖 AI: Live' : '🤖 AI: Demo mode'}
              </span>
            </div>
            {result.toneAssessment && (
              <div className="mb-3">
                <div className="form-label">Tone Assessment</div>
                <div className="text-sm">{result.toneAssessment}</div>
              </div>
            )}
            {result.summary && (
              <div>
                <div className="form-label">Summary</div>
                <div className="text-sm">{result.summary}</div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              className="btn btn-primary"
              onClick={() => router.push(`/submissions/${result.submissionId}`)}
            >
              View Full Report →
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => { setResult(null); setContent(''); setTitle(''); }}
            >
              Submit Another
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Submit Content for Review</h1>
        <p className="page-subtitle">Content will be analyzed for brand compliance before entering the review queue.</p>
      </div>
      <div className="page-content">
        {error && <div className="alert alert-error mb-3">{error}</div>}

        <div className="card card-padded">
          <div className="form-group">
            <label className="form-label">Campaign</label>
            <select className="form-select" value={campaignId} onChange={e => setCampaignId(e.target.value)}>
              <option value="">Select a campaign…</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Submission Title</label>
            <input
              className="form-input"
              placeholder="e.g. Email Subject Line Test"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Marketing Content</label>
            <textarea
              className="form-textarea"
              style={{ minHeight: 240 }}
              placeholder="Paste marketing copy, email body, ad copy, social post, or other content here…"
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            <div className="text-sm text-muted mt-1">{content.length} characters · {content.trim().split(/\s+/).filter(Boolean).length} words</div>
          </div>

          <div className="alert alert-info mb-3">
            <span>🤖</span>
            <span>Content will be analyzed using deterministic brand rules + {process.env.NEXT_PUBLIC_AI_MODE === 'live' ? 'live Gemini AI' : 'AI heuristics (add GEMINI_API_KEY for full AI analysis)'}.</span>
          </div>

          <button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={loading || !campaignId || !content.trim()}
          >
            {loading ? (
              <><span className="spinner" /> Analyzing…</>
            ) : (
              '🔍 Analyze & Submit'
            )}
          </button>
          {loading && (
            <div className="alert alert-info mt-3">
              Running analysis (deterministic checks + AI)… this may take a few seconds.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
