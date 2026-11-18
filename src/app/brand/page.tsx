import React, { useEffect, useState } from 'react';
import { getCollection, addToCollection } from '@/lib/storage';
import Link from 'next/link';

export default function BrandKnowledge() {
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    async function load() {
      const items = await getCollection('brandKnowledge');
      setKnowledge(items);
    }
    load();
  }, []);

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    const item = { id: Date.now().toString(), text: newItem.trim() };
    await addToCollection('brandKnowledge', item);
    setKnowledge((prev) => [...prev, item]);
    setNewItem('');
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#142B3A' }}>Brand Knowledge</h1>
      <ul className="list-disc pl-6 mb-4">
        {knowledge.map((k) => (
          <li key={k.id}>{k.text}</li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          className="border rounded p-2 flex-1"
          placeholder="Add new knowledge item"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <button
          className="bg-teal-600 text-white px-4 py-2 rounded"
          onClick={handleAdd}
        >Add</button>
      </div>
      <div className="mt-6">
        <Link href="/dashboard" className="text-teal-600 hover:underline">← Back to Dashboard</Link>
      </div>
    </div>
  );
}
