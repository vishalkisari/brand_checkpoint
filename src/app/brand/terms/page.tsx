import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCollection, addToCollection, updateCollection } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';

export default function BrandTerms() {
  const { role } = useAuth();
  const [terms, setTerms] = useState<any[]>([]);
  const [term, setTerm] = useState('');
  const [replacement, setReplacement] = useState('');
  const [isForbidden, setIsForbidden] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getCollection('brandTerms');
      setTerms(data);
    }
    load();
  }, []);

  const handleAdd = async () => {
    if (!term.trim()) return;
    const newTerm = {
      id: Date.now().toString(),
      term: term.trim(),
      replacement: replacement.trim() || null,
      isForbidden,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    await addToCollection('brandTerms', newTerm);
    setTerms((prev) => [...prev, newTerm]);
    setTerm('');
    setReplacement('');
    setIsForbidden(false);
  };

  const toggleStatus = async (id: string) => {
    await updateCollection('brandTerms', (items) => {
      const t = items.find((i: any) => i.id === id);
      if (t) t.status = t.status === 'APPROVED' ? 'PENDING' : 'APPROVED';
    });
    const refreshed = await getCollection('brandTerms');
    setTerms(refreshed);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#142B3A' }}>Brand Terms</h1>
      <ul className="list-disc pl-6 mb-4">
        {terms.map((t) => (
          <li key={t.id} className="mb-2 flex items-center justify-between">
            <span>{t.term} {t.isForbidden ? '(Forbidden)' : '(Preferred)'}{t.replacement ? ` → ${t.replacement}` : ''}</span>
            <span className="text-sm font-medium">{t.status}</span>
            {role === 'ADMIN' && (
              <button className="ml-4 text-teal-600 hover:underline" onClick={() => toggleStatus(t.id)}>
                Toggle Status
              </button>
            )}
          </li>
        ))}
      </ul>
      {role === 'ADMIN' && (
        <div className="flex flex-col gap-2 mb-4">
          <input className="border rounded p-2" placeholder="Term" value={term} onChange={(e) => setTerm(e.target.value)} />
          <input className="border rounded p-2" placeholder="Replacement (optional)" value={replacement} onChange={(e) => setReplacement(e.target.value)} />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isForbidden} onChange={(e) => setIsForbidden(e.target.checked)} />
            Forbidden term
          </label>
          <button className="bg-teal-600 text-white px-4 py-2 rounded" onClick={handleAdd}>Add Term</button>
        </div>
      )}
      <div className="mt-6"><Link href="/dashboard" className="text-teal-600 hover:underline">← Back to Dashboard</Link></div>
    </div>
  );
}
