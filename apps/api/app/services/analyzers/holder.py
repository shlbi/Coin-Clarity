import httpx
import os
from typing import Dict, Optional

def analyze_holders(chain: str, address: str) -> Dict:
    """Analyze token holder distribution"""
    
    api_key = None
    if chain == "ethereum":
        api_key = os.getenv("ETHERSCAN_API_KEY")
    elif chain == "base":
        api_key = os.getenv("BASESCAN_API_KEY")
    
    if not api_key:
        return {
            "holdersUnavailable": True,
            "top1Concentration": None,
            "top10Concentration": None
        }
    
    try:
        # Get top token holders
        if chain == "ethereum":
            url = "https://api.etherscan.io/api"
        elif chain == "base":
            url = "https://api.basescan.org/api"
        else:
            return {
                "holdersUnavailable": True,
                "top1Concentration": None,
                "top10Concentration": None
            }
        
        params = {
            "module": "token",
            "action": "tokenholderlist",
            "contractaddress": address,
            "apikey": api_key,
            "page": 1,
            "offset": 10
        }
        
        with httpx.Client(timeout=15.0) as client:
            response = client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") != "1" or not data.get("result"):
                return {
                    "holdersUnavailable": True,
                    "top1Concentration": None,
                    "top10Concentration": None
                }
            
            holders = data["result"]
            
            if not holders or len(holders) == 0:
                return {
                    "holdersUnavailable": True,
                    "top1Concentration": None,
                    "top10Concentration": None
                }
            
            # Get total supply
            total_supply = float(holders[0].get("TokenHolderQuantity", 0))
            if total_supply == 0:
                return {
                    "holdersUnavailable": True,
                    "top1Concentration": None,
                    "top10Concentration": None
                }
            
            # Calculate concentrations
            top1_balance = float(holders[0].get("TokenHolderQuantity", 0))
            top1_concentration = (top1_balance / total_supply) * 100 if total_supply > 0 else 0
            
            top10_balance = sum(
                float(h.get("TokenHolderQuantity", 0))
                for h in holders[:10]
            )
            top10_concentration = (top10_balance / total_supply) * 100 if total_supply > 0 else 0
            
            return {
                "holdersUnavailable": False,
                "top1Concentration": round(top1_concentration, 2),
                "top10Concentration": round(top10_concentration, 2)
            }
            
    except Exception:
        return {
            "holdersUnavailable": True,
            "top1Concentration": None,
            "top10Concentration": None
        }
