import { useGetMe } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useGetMe();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    
    if (isError || !user) {
      setLocation('/');
      return;
    }

    if (!user.hasLicense && location !== '/redeem') {
      setLocation('/redeem');
    }
  }, [user, isLoading, isError, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Initializing secure environment...
      </div>
    );
  }
  
  if (isError || !user) return null;
  if (!user.hasLicense && location !== '/redeem') return null;

  return <>{children}</>;
}
