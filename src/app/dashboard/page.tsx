import React, { useEffect, useState } from 'react';
import { getCollection, addToCollection } from '@/lib/storage';
import Link from 'next/link';

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [pending, setPending] = useState<number>(0);

  useEffect(() => {
    async function load() {
      const allCampaigns = await getCollection('campaigns');
      setCampaigns(allCampaigns);
      const allSubmissions = await getCollection('submissions');
      const pendingCount = allSubmissions.filter((s) => s.status === 'PENDING').length;
      setPending(pendingCount);
    }
    load();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#142B3A' }}>Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#238C83' }}>Active Campaigns</h2>
          <p>{campaigns.length}</p>
          <Link href="/campaigns" className="text-teal-600 hover:underline">View campaigns</Link>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#238C83' }}>Pending Reviews</h2>
          <p>{pending}</p>
          <Link href="/review" className="text-teal-600 hover:underline">Go to review queue</Link>
        </div>
      </div>
    </div>
  );
}
