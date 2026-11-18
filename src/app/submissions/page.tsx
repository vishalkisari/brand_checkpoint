import React, { useEffect, useState } from 'react';
import { getCollection, addToCollection } from '@/lib/storage';
import { runFullAnalysis } from '@/lib/gemini';
import Link from 'next/link';

export default function Submissions() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const [camps, subs] = await Promise.all([
        getCollection('campaigns'),
        getCollection('submissions'),
      ]);
      setCampaigns(camps);
      setSubmissions(subs);
    }
    load();
  }, []);

  const handleSubmit = async () => {
    if (!selectedCampaign || !content.trim()) return;
    setLoading(true);
    const submissionId = Date.now().toString();
    const newSubmission = {
      id: submissionId,
      campaignId: selectedCampaign,
      content: content.trim(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    await addToCollection('submissions', newSubmission);
    setSubmissions((prev) => [...prev, newSubmission]);
    // Run analysis (deterministic + Gemini)
    const findings = await runFullAnalysis(submissionId, content.trim(), selectedCampaign);
    // Update submission status based on findings
    const newStatus = findings.some((f: any) => f.severity === 'HIGH' || f.severity === 'CRITICAL')
      ? 'REVIEW_REQUIRED'
      : 'APPROVED';
    // Update collection directly via storage update function
    const { updateCollection } = await import('@/lib/storage');
    await updateCollection('submissions', (items) => {
      const idx = items.findIndex((i: any) => i.id === submissionId);
      if (idx !== -1) items[idx].status = newStatus;
    });
    // Refresh list
    const refreshed = await getCollection('submissions');
    setSubmissions(refreshed);
    setContent('');
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#142B3A' }}>Content Submissions</h1>

      <div className="mb-8">
        <select
          className="border rounded p-2 mr-2"
          value={selectedCampaign}
          onChange={(e) => setSelectedCampaign(e.target.value)}
        >
          <option value="">Select Campaign</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <textarea
          className="border rounded p-2 w-full h-32 mt-2"
          placeholder="Paste marketing copy here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          className="bg-teal-600 text-white px-4 py-2 rounded mt-2"
          onClick={handleSubmit}
          disabled={loading}
        >{loading ? 'Analyzing…' : 'Submit for Review'}</button>
      </div>

      <h2 className="text-2xl font-semibold mb-4" style={{ color: '#238C83' }}>Previous Submissions</h2>
      <ul className="list-disc pl-6">
        {submissions.map((s) => (
          <li key={s.id} className="mb-2">
            <Link href={`/submissions/${s.id}`} className="text-teal-600 hover:underline">
              {s.id} – {s.status}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Link href="/dashboard" className="text-teal-600 hover:underline">← Back to Dashboard</Link>
      </div>
    </div>
  );
}
