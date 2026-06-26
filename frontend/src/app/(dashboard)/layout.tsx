import dynamic from 'next/dynamic';

const DashboardGroupShell = dynamic(() => import('./dashboard-group-shell'), { ssr: false });

// Layout compartido para rutas del grupo (dashboard) como /reports
export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return <DashboardGroupShell>{children}</DashboardGroupShell>;
}
