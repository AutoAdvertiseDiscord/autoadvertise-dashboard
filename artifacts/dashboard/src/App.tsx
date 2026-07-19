import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthGuard } from '@/components/auth/AuthGuard';

import { Landing } from '@/pages/Landing';
import { Redeem } from '@/pages/Redeem';
import { Dashboard } from '@/pages/Dashboard';
import { Accounts } from '@/pages/Accounts';
import { AccountDetail } from '@/pages/AccountDetail';
import { Logs } from '@/pages/Logs';
import { Settings } from '@/pages/Settings';
import { License } from '@/pages/License';
import NotFound from '@/pages/not-found';
import { useEffect } from 'react';

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Switch>
            <Route path="/" component={Landing} />
            <Route path="/redeem">
              <AuthGuard><Redeem /></AuthGuard>
            </Route>
            <Route path="/dashboard">
              <AuthGuard><Dashboard /></AuthGuard>
            </Route>
            <Route path="/dashboard/accounts">
              <AuthGuard><Accounts /></AuthGuard>
            </Route>
            <Route path="/dashboard/accounts/:id">
              <AuthGuard><AccountDetail /></AuthGuard>
            </Route>
            <Route path="/dashboard/logs">
              <AuthGuard><Logs /></AuthGuard>
            </Route>
            <Route path="/dashboard/settings">
              <AuthGuard><Settings /></AuthGuard>
            </Route>
            <Route path="/dashboard/license">
              <AuthGuard><License /></AuthGuard>
            </Route>
            <Route component={NotFound} />
          </Switch>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
