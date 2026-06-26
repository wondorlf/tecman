import dynamic from 'next/dynamic';

const DashboardShell = dynamic(() => import('./dashboard-shell'), { ssr: false });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
