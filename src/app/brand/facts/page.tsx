import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCollection, addToCollection, updateCollection } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';

export default function BrandFacts() {
  const { role } = useAuth();
  const [facts, setFacts] = useState<any[]>([]);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');

  useEffect(() => {
    async function load() {
      const data = await getCollection('brandFacts');
      setFacts(data);
    }
    load();
  }, []);

  const handleAdd = async () => {
    if (!key.trim() || !value.trim()) return;
    const newFact = {
      id: Date.now().toString(),
      key: key.trim(),
      value: value.trim(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    await addToCollection('brandFacts', newFact);
    setFacts((prev) => [...prev, newFact]);
    setKey('');
    setValue('');
  };

  const toggleStatus = async (id: string) => {
    await updateCollection('brandFacts', (items) => {
      const fact = items.find((f: any) => f.id === id);
      if (fact) fact.status = fact.status === 'APPROVED' ? 'PENDING' : 'APPROVED';
    });
    const refreshed = await getCollection('brandFacts');
    setFacts(refreshed);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#142B3A' }}>Brand Facts</h1>
      <ul className="list-disc pl-6 mb-4">
        {facts.map((f) => (
          <li key={f.id} className="mb-2 flex items-center justify-between">
            <span>{f.key}: {f.value} </span>
            <span className="text-sm font-medium">
              {f.status}
            </span>
            {role === 'ADMIN' && (
              <button
                className="ml-4 text-teal-600 hover:underline"
                onClick={() => toggleStatus(f.id)}
              >
                Toggle Status
              </button>
            )}
          </li>
        ))}
      </ul>
      {role === 'ADMIN' && (
        <div className="flex gap-2 mb-4">
          <input
            className="border rounded p-2 flex-1"
            placeholder="Fact key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <input
            className="border rounded p-2 flex-1"
            placeholder="Fact value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button
            className="bg-teal-600 text-white px-4 py-2 rounded"
            onClick={handleAdd}
          >Add Fact</button>
        </div>
      )}
      <div className="mt-6">
        <Link href="/dashboard" className="text-teal-600 hover:underline">← Back to Dashboard</Link>
      </div>
    </div>
  );
}
