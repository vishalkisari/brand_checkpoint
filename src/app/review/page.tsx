import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCollection, updateCollection } from '@/lib/storage';

export default function ReviewQueue() {
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const all = await getCollection('submissions');
      const pending = all.filter((s: any) => s.status === 'REVIEW_REQUIRED');
      setSubmissions(pending);
    }
    load();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#142B3A' }}>Review Queue</h1>
      {submissions.length === 0 ? (
        <p>No submissions require review.</p>
      ) : (
        <ul className="list-disc pl-6">
          {submissions.map((s) => (
            <li key={s.id} className="mb-2">
              <Link href={`/review/${s.id}`} className="text-teal-600 hover:underline">
                Submission {s.id} – {s.campaignId}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6">
        <Link href="/dashboard" className="text-teal-600 hover:underline">← Back to Dashboard</Link>
      </div>
    </div>
  );
}
