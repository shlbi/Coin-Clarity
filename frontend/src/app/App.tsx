import { BrowserRouter, Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopNav } from './components/TopNav';
import { Dashboard } from './pages/Dashboard';
import { TokenReport } from './pages/TokenReport';
import { RiskEngine } from './pages/RiskEngine';
import { Market } from './pages/Market';
import { Alerts } from './pages/Alerts';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
      // Price queries should not be cached
      gcTime: (query) => {
        // Don't cache price queries
        if (query.queryKey[0] === 'price') {
          return 0;
        }
        return 5 * 60 * 1000; // Default 5 minutes for other queries
      },
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-[#F8FAFC]">
          <TopNav />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/token/:chain/:address" element={<TokenReport />} />
            <Route path="/risk-engine" element={<RiskEngine />} />
            <Route path="/market" element={<Market />} />
            <Route path="/alerts" element={<Alerts />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}