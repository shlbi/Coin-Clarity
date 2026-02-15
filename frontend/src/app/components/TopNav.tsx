import { Link } from 'react-router';
import { Bell, Search } from 'lucide-react';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { GlobalSearch } from './GlobalSearch';

export function TopNav() {
  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-[1400px] px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left - Logo */}
          <div className="flex items-center gap-12">
            <Link to="/" className="text-xl font-semibold text-[#111827]">
              CoinClarity
            </Link>

            {/* Center - Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                to="/"
                className="text-sm font-medium text-[#111827] hover:text-[#2563EB] transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/risk-engine"
                className="text-sm font-medium text-[#6B7280] hover:text-[#2563EB] transition-colors"
              >
                Risk Engine
              </Link>
              <Link
                to="/market"
                className="text-sm font-medium text-[#6B7280] hover:text-[#2563EB] transition-colors"
              >
                Market
              </Link>
              <Link
                to="/alerts"
                className="text-sm font-medium text-[#6B7280] hover:text-[#2563EB] transition-colors"
              >
                Alerts
              </Link>
            </div>
          </div>

          {/* Right - Search, Bell, Avatar */}
          <div className="flex items-center gap-4">
            <GlobalSearch />

            <button
              className="p-2 text-[#6B7280] hover:text-[#111827] transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>

            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#2563EB] text-white text-xs">
                JD
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </nav>
  );
}