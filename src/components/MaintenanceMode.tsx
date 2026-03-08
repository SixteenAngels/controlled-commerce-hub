import { useStoreSettings } from '@/hooks/useStoreSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';

interface MaintenanceModeProps {
  children: React.ReactNode;
}

export function MaintenanceMode({ children }: MaintenanceModeProps) {
  const { data: settings, isLoading } = useStoreSettings();
  const { isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) return <>{children}</>;

  const maintenanceEnabled = settings?.maintenanceMode === true;
  const isAuthPage = location.pathname === '/auth';
  const isAdminPage = location.pathname.startsWith('/admin');

  // Allow auth & admin pages through, and admins can browse everything
  if (maintenanceEnabled && !isAdmin && !isAuthPage && !isAdminPage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
        <div className="inline-flex p-5 rounded-full bg-primary/10 mb-6">
          <Construction className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">We'll Be Right Back</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          Our store is currently undergoing scheduled maintenance. We apologise for the inconvenience and will be back shortly.
        </p>
        <p className="text-sm text-muted-foreground">
          If you're an admin, please{' '}
          <a href="/auth" className="text-primary underline">sign in</a>{' '}
          to access the site.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
