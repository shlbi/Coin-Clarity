import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search } from 'lucide-react';
import { Input } from './ui/input';
import { isEVMAddress, extractAddressFromUrl, Chain } from '../../lib/api';
import { mockSearchResults } from '../../lib/mockData';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [pendingAddress, setPendingAddress] = useState<string | null>(null);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setShowChainSelector(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);

    if (value.length > 0) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
      setShowChainSelector(false);
    }
  };

  const handleSelectChain = (chain: Chain) => {
    if (pendingAddress) {
      navigate(`/token/${chain}/${pendingAddress}`);
      setQuery('');
      setShowDropdown(false);
      setShowChainSelector(false);
      setPendingAddress(null);
    }
  };

  const handleSelectResult = (address: string, chain: Chain) => {
    navigate(`/token/${chain}/${address}`);
    setQuery('');
    setShowDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    // Check if it's a URL
    const extractedAddress = extractAddressFromUrl(query);
    if (extractedAddress) {
      setPendingAddress(extractedAddress);
      setShowChainSelector(true);
      return;
    }

    // Check if it's a valid address
    if (isEVMAddress(query)) {
      setPendingAddress(query);
      setShowChainSelector(true);
      return;
    }

    // Otherwise treat as search query
    setShowDropdown(true);
  };

  // Filter mock results based on query
  const filteredResults = mockSearchResults.filter(
    (result) =>
      result.name.toLowerCase().includes(query.toLowerCase()) ||
      result.symbol.toLowerCase().includes(query.toLowerCase()) ||
      result.address.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative w-80">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
          <Input
            type="text"
            placeholder="Search by address, name, or symbol"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-10 pl-10 pr-4 bg-[#F8FAFC] border-[#E5E7EB] text-sm focus:ring-1 focus:ring-[#2563EB]"
          />
        </div>
      </form>

      {/* Chain Selector Dropdown */}
      {showChainSelector && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E5E7EB] rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-3 border-b border-[#E5E7EB]">
            <p className="text-sm font-medium text-[#111827]">Select Chain</p>
            <p className="text-xs text-[#6B7280] mt-1">
              Address: {pendingAddress?.slice(0, 10)}...
            </p>
          </div>
          <div className="p-2">
            <button
              onClick={() => handleSelectChain('ethereum')}
              className="w-full text-left px-3 py-2 text-sm text-[#111827] hover:bg-[#F8FAFC] rounded transition-colors"
            >
              Ethereum
            </button>
            <button
              onClick={() => handleSelectChain('base')}
              className="w-full text-left px-3 py-2 text-sm text-[#111827] hover:bg-[#F8FAFC] rounded transition-colors"
            >
              Base
            </button>
          </div>
        </div>
      )}

      {/* Search Results Dropdown */}
      {showDropdown && !showChainSelector && query.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E5E7EB] rounded-lg shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto">
          {filteredResults.length > 0 ? (
            <div className="p-2">
              {filteredResults.map((result) => (
                <button
                  key={result.address}
                  onClick={() => handleSelectResult(result.address, result.chain)}
                  className="w-full text-left px-3 py-3 hover:bg-[#F8FAFC] rounded transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#111827]">
                          {result.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-[#F8FAFC] text-[#6B7280] rounded">
                          {result.symbol}
                        </span>
                      </div>
                      <div className="text-xs text-[#6B7280] mt-1 font-mono">
                        {result.address.slice(0, 10)}...{result.address.slice(-8)}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-[#2563EB]/10 text-[#2563EB] rounded capitalize">
                      {result.chain}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-[#6B7280]">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}