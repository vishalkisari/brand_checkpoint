import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/brand', label: 'Brand Knowledge' },
  { href: '/campaigns', label: 'Campaigns' },
  { href: '/submissions', label: 'Content Submission' },
  { href: '/review', label: 'Review Queue' },
];

export default function Sidebar() {
  const { role, setRole } = useAuth();

  return (
    <aside
      style={{
        width: '248px',
        minHeight: '100vh',
        backgroundColor: '#F7F8F6',
        padding: '32px',
        boxSizing: 'border-box',
      }}
    >
      <h1 className="text-2xl font-bold mb-8" style={{ color: '#142B3A' }}>
        TAARA
      </h1>
      <nav className="flex flex-col gap-4">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="text-lg hover:text-teal-600">
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-12">
        <label className="block mb-2 font-medium">Demo Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="w-full p-2 border rounded"
        >
          <option value="ADMIN">Admin</option>
          <option value="CREATOR">Creator</option>
          <option value="REVIEWER">Reviewer</option>
        </select>
      </div>
    </aside>
  );
}
