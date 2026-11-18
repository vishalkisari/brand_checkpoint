'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

type Tab = 'facts' | 'terms' | 'rules';

function ApprovalBadge({ status }: { status: string }) {
  const cls = status === 'APPROVED' ? 'badge-approved' : status === 'ARCHIVED' ? 'badge-rejected' : 'badge-pending';
  return <span className={`badge ${cls}`}>{status}</span>;
}

function ApproveBtn({ collection, id, status, actor, onDone }: {
  collection: string; id: string; status: string; actor: string; onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const toggle = async (newStatus: string) => {
    setLoading(true);
    await fetch('/api/brand/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection, id, status: newStatus, actor }),
    });
    setLoading(false);
    onDone();
  };

  if (status === 'APPROVED') {
    return <button className="btn btn-secondary btn-sm" onClick={() => toggle('ARCHIVED')} disabled={loading}>Archive</button>;
  }
  if (status === 'ARCHIVED') {
    return <button className="btn btn-secondary btn-sm" onClick={() => toggle('PENDING')} disabled={loading}>Restore</button>;
  }
  return <button className="btn btn-success btn-sm" onClick={() => toggle('APPROVED')} disabled={loading}>{loading ? '…' : '✓ Approve'}</button>;
}

export default function BrandPage() {
  const { role, user } = useAuth();
  const [tab, setTab] = useState<Tab>('facts');
  const [facts, setFacts] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [factKey, setFactKey] = useState('');
  const [factVal, setFactVal] = useState('');
  const [termTerm, setTermTerm] = useState('');
  const [termRepl, setTermRepl] = useState('');
  const [termForbid, setTermForbid] = useState(true);
  const [ruleDesc, setRuleDesc] = useState('');
  const [rulePattern, setRulePattern] = useState('');
  const [ruleType, setRuleType] = useState('GENERAL');
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const [f, t, r] = await Promise.all([
      fetch('/api/collections/brandFacts').then(x => x.json()),
      fetch('/api/collections/brandTerms').then(x => x.json()),
      fetch('/api/collections/brandRules').then(x => x.json()),
    ]);
    setFacts(Array.isArray(f) ? f : []);
    setTerms(Array.isArray(t) ? t : []);
    setRules(Array.isArray(r) ? r : []);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const addFact = async () => {
    if (!factKey.trim() || !factVal.trim()) return;
    setSaving(true);
    await fetch('/api/collections/brandFacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `fact_${Date.now()}`,
        orgId: 'org_nova',
        key: factKey.trim(),
        value: factVal.trim(),
        status: 'PENDING',
        createdBy: user.name,
        createdAt: new Date().toISOString(),
      }),
    });
    setFactKey(''); setFactVal('');
    setSaving(false);
    reload();
  };

  const addTerm = async () => {
    if (!termTerm.trim()) return;
    setSaving(true);
    await fetch('/api/collections/brandTerms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `term_${Date.now()}`,
        orgId: 'org_nova',
        term: termTerm.trim(),
        replacement: termRepl.trim() || undefined,
        isForbidden: termForbid,
        status: 'PENDING',
        createdBy: user.name,
        createdAt: new Date().toISOString(),
      }),
    });
    setTermTerm(''); setTermRepl('');
    setSaving(false);
    reload();
  };

  const addRule = async () => {
    if (!ruleDesc.trim()) return;
    setSaving(true);
    await fetch('/api/collections/brandRules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `rule_${Date.now()}`,
        orgId: 'org_nova',
        description: ruleDesc.trim(),
        pattern: rulePattern.trim() || undefined,
        ruleType,
        status: 'PENDING',
        createdBy: user.name,
        createdAt: new Date().toISOString(),
      }),
    });
    setRuleDesc(''); setRulePattern('');
    setSaving(false);
    reload();
  };

  if (loading) return <div className="page-content"><p className="text-muted">Loading brand knowledge…</p></div>;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Brand Knowledge</h1>
        <p className="page-subtitle">Approved facts, terminology, and rules used in content analysis</p>
      </div>
      <div className="page-content">
        <div className="tabs">
          {(['facts', 'terms', 'rules'] as Tab[]).map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t === 'facts' ? `📌 Facts (${facts.length})` : t === 'terms' ? `🔤 Terms (${terms.length})` : `📏 Rules (${rules.length})`}
            </button>
          ))}
        </div>

        {/* FACTS */}
        {tab === 'facts' && (
          <>
            {role === 'ADMIN' && (
              <div className="card card-padded mb-4">
                <div className="card-title mb-3">Add Brand Fact</div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Fact Key</label>
                    <input className="form-input" placeholder="e.g. Year Founded" value={factKey} onChange={e => setFactKey(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Approved Value</label>
                    <input className="form-input" placeholder="e.g. 2019" value={factVal} onChange={e => setFactVal(e.target.value)} />
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={addFact} disabled={saving}>Add Fact</button>
              </div>
            )}
            <div className="card">
              <table className="table">
                <thead><tr><th>Key</th><th>Approved Value</th><th>Status</th><th>Added By</th>{role === 'ADMIN' && <th>Action</th>}</tr></thead>
                <tbody>
                  {facts.length === 0 && <tr><td colSpan={5} className="text-center text-muted" style={{padding:32}}>No facts yet</td></tr>}
                  {facts.map(f => (
                    <tr key={f.id}>
                      <td className="font-semibold">{f.key}</td>
                      <td style={{ maxWidth: 320, wordBreak: 'break-word' }}>{f.value}</td>
                      <td><ApprovalBadge status={f.status} /></td>
                      <td className="text-muted text-sm">{f.createdBy}</td>
                      {role === 'ADMIN' && <td><ApproveBtn collection="brandFacts" id={f.id} status={f.status} actor={user.name} onDone={reload} /></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* TERMS */}
        {tab === 'terms' && (
          <>
            {role === 'ADMIN' && (
              <div className="card card-padded mb-4">
                <div className="card-title mb-3">Add Term</div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Term</label>
                    <input className="form-input" placeholder="e.g. cure" value={termTerm} onChange={e => setTermTerm(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Replacement (optional)</label>
                    <input className="form-input" placeholder="e.g. support" value={termRepl} onChange={e => setTermRepl(e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={termForbid} onChange={e => setTermForbid(e.target.checked)} />
                    <span className="text-sm">Forbidden (must not appear in content)</span>
                  </label>
                </div>
                <button className="btn btn-primary btn-sm" onClick={addTerm} disabled={saving}>Add Term</button>
              </div>
            )}
            <div className="card">
              <table className="table">
                <thead><tr><th>Term</th><th>Type</th><th>Replacement</th><th>Status</th>{role === 'ADMIN' && <th>Action</th>}</tr></thead>
                <tbody>
                  {terms.length === 0 && <tr><td colSpan={5} className="text-center text-muted" style={{padding:32}}>No terms yet</td></tr>}
                  {terms.map(t => (
                    <tr key={t.id}>
                      <td className="font-semibold">{t.term}</td>
                      <td><span className={`badge ${t.isForbidden ? 'badge-rejected' : 'badge-approved'}`}>{t.isForbidden ? '🚫 Forbidden' : '✓ Preferred'}</span></td>
                      <td className="text-muted">{t.replacement ?? '—'}</td>
                      <td><ApprovalBadge status={t.status} /></td>
                      {role === 'ADMIN' && <td><ApproveBtn collection="brandTerms" id={t.id} status={t.status} actor={user.name} onDone={reload} /></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* RULES */}
        {tab === 'rules' && (
          <>
            {role === 'ADMIN' && (
              <div className="card card-padded mb-4">
                <div className="card-title mb-3">Add Rule</div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-input" placeholder="e.g. All health claims must include FDA disclaimer" value={ruleDesc} onChange={e => setRuleDesc(e.target.value)} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Pattern (regex, optional)</label>
                    <input className="form-input" placeholder="e.g. \\bcures\\b" value={rulePattern} onChange={e => setRulePattern(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rule Type</label>
                    <select className="form-select" value={ruleType} onChange={e => setRuleType(e.target.value)}>
                      {['LEGAL', 'CLAIM', 'TONE', 'STRUCTURE', 'GENERAL'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={addRule} disabled={saving}>Add Rule</button>
              </div>
            )}
            <div className="card">
              <table className="table">
                <thead><tr><th>Description</th><th>Type</th><th>Pattern</th><th>Status</th>{role === 'ADMIN' && <th>Action</th>}</tr></thead>
                <tbody>
                  {rules.length === 0 && <tr><td colSpan={5} className="text-center text-muted" style={{padding:32}}>No rules yet</td></tr>}
                  {rules.map(r => (
                    <tr key={r.id}>
                      <td style={{ maxWidth: 280 }}>{r.description}</td>
                      <td><span className={`badge ${r.ruleType === 'LEGAL' ? 'badge-critical' : r.ruleType === 'CLAIM' ? 'badge-high' : 'badge-medium'}`}>{r.ruleType}</span></td>
                      <td><code style={{ fontSize: 11, background: 'var(--surface-2)', padding: '2px 5px', borderRadius: 4 }}>{r.pattern ?? '—'}</code></td>
                      <td><ApprovalBadge status={r.status} /></td>
                      {role === 'ADMIN' && <td><ApproveBtn collection="brandRules" id={r.id} status={r.status} actor={user.name} onDone={reload} /></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
