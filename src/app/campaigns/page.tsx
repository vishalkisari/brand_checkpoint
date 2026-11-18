import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCollection, addToCollection } from '@/lib/storage';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [title, setTitle] = useState('');

  useEffect(() => {
    async function load() {
      const data = await getCollection('campaigns');
      setCampaigns(data);
    }
    load();
  }, []);

  const handleAdd = async () => {
    if (!title.trim()) return;
    const newCampaign = {
      id: Date.now().toString(),
      title: title.trim(),
      createdAt: new Date().toISOString(),
    };
    await addToCollection('campaigns', newCampaign);
    setCampaigns((prev) => [...prev, newCampaign]);
    setTitle('');
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#142B3A' }}>Campaigns</h1>
      <ul className="list-disc pl-6 mb-4">
        {campaigns.map((c) => (
          <li key={c.id} className="mb-2">
            <Link href={`/campaigns/${c.id}`} className="text-teal-600 hover:underline">
              {c.title}
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex gap-2 mb-4">
        <input
          className="border rounded p-2 flex-1"
          placeholder="New campaign title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          className="bg-teal-600 text-white px-4 py-2 rounded"
          onClick={handleAdd}
        >Add Campaign</button>
      </div>
      <div className="mt-6">
        <Link href="/dashboard" className="text-teal-600 hover:underline">← Back to Dashboard</Link>
      </div>
    </div>
  );
}
