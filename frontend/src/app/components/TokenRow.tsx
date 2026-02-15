import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Chain, formatPrice, formatPercent, getRiskColor } from '../../lib/api';

interface TokenRowProps {
  token: {
    name: string;
    symbol: string;
    chain: Chain;
    address: string;
  };
  price: number;
  change24h: number;
  riskScore: number;
}

export function TokenRow({ token, price, change24h, riskScore }: TokenRowProps) {
  const navigate = useNavigate();
  const riskColor = getRiskColor(riskScore);
  const isPositive = change24h >= 0;
  
  // Track price changes for visual feedback
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<'up' | 'down' | null>(null);
  const priceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (previousPrice !== null && price !== previousPrice && price > 0) {
      const direction = price > previousPrice ? 'up' : 'down';
      setPriceChange(direction);
      // Clear the highlight after 1.5 seconds
      if (priceTimeoutRef.current) {
        clearTimeout(priceTimeoutRef.current);
      }
      priceTimeoutRef.current = setTimeout(() => {
        setPriceChange(null);
      }, 1500);
    }
    if (price > 0) {
      setPreviousPrice(price);
    }
  }, [price, previousPrice]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (priceTimeoutRef.current) {
        clearTimeout(priceTimeoutRef.current);
      }
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/token/${token.chain}/${token.address.toLowerCase()}`);
  };

  return (
    <div
      onClick={handleClick}
      className="block border-b border-[#E5E7EB] last:border-b-0 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-4 p-4">
        {/* Token Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-[#111827] truncate">{token.name}</h4>
            <span className="text-xs px-2 py-0.5 bg-[#F8FAFC] text-[#6B7280] rounded capitalize flex-shrink-0">
              {token.chain}
            </span>
          </div>
          <p className="text-sm text-[#6B7280] mt-0.5">{token.symbol}</p>
        </div>

        {/* Price */}
        <div className="text-right flex-shrink-0">
          <p 
            className={`font-medium transition-all duration-300 ${
              priceChange === 'up' 
                ? 'text-[#16A34A] scale-105' 
                : priceChange === 'down' 
                ? 'text-[#DC2626] scale-105' 
                : change24h >= 0
                ? 'text-[#16A34A]'
                : 'text-[#DC2626]'
            }`}
          >
            {formatPrice(price)}
          </p>
          <p
            className={`text-sm ${
              isPositive ? 'text-[#16A34A]' : 'text-[#DC2626]'
            }`}
          >
            {formatPercent(change24h)}
          </p>
        </div>

        {/* Risk Score */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: riskColor }}
          />
          <span className="text-sm font-medium text-[#111827] w-8 text-right">
            {riskScore}
          </span>
        </div>
      </div>
    </div>
  );
}
