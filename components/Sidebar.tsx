'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, type Role } from '@/context/AuthContext';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles?: Role[];
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '◉' },
    ],
  },
  {
    label: 'Brand',
    items: [
      { href: '/brand', label: 'Brand Knowledge', icon: '📋' },
    ],
  },
  {
    label: 'Campaigns',
    items: [
      { href: '/campaigns', label: 'Campaigns', icon: '🎯' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/submit', label: 'Submit Content', icon: '📝', roles: ['CREATOR', 'ADMIN'] },
      { href: '/submissions', label: 'All Submissions', icon: '📂' },
      { href: '/review', label: 'Review Queue', icon: '🔍', roles: ['REVIEWER', 'ADMIN'] },
    ],
  },
  {
    label: 'Audit',
    items: [
      { href: '/activity', label: 'Activity Log', icon: '📜' },
    ],
  },
];

export default function Sidebar() {
  const { role, user, setRole } = useAuth();
  const pathname = usePathname();

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-title">TAARA</div>
        <div className="sidebar-logo-tagline">Brand Governance Platform</div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_SECTIONS.map(section => {
          const visibleItems = section.items.filter(
            item => !item.roles || item.roles.includes(role)
          );
          if (!visibleItems.length) return null;
          return (
            <div key={section.label}>
              <div className="nav-label">{section.label}</div>
              {visibleItems.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <span className="nav-item-icon">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Role switcher */}
      <div className="sidebar-role">
        <div className="role-label">Demo Role</div>
        <select
          className="role-select"
          value={role}
          onChange={e => setRole(e.target.value as Role)}
        >
          <option value="ADMIN">Admin</option>
          <option value="CREATOR">Creator</option>
          <option value="REVIEWER">Reviewer</option>
        </select>
        <div className={`role-badge ${role.toLowerCase()}`}>
          <span>{user.avatar}</span>
          <span>{user.name}</span>
        </div>
      </div>
    </aside>
  );
}
