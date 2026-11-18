import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'TAARA — Brand Governance Platform',
  description: "Your brand's last checkpoint before publication.",
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="app-shell">
            <Sidebar />
            <main className="app-main">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
