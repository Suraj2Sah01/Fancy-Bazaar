import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

export interface BogoCampaignData {
  enabled: boolean;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  bannerText: string;
  isActive: boolean;
  hasEnded: boolean;
  serverTime?: string;
  startTimestamp?: number;
  endTimestamp?: number;
  remainingSeconds?: number;
}

interface BogoContextType {
  campaign: BogoCampaignData | null;
  isBogoActive: boolean;
  missedOfferNotice: boolean;
  dismissMissedNotice: () => void;
  remainingSeconds: number;
  formattedRemainingTime: string;
  refreshCampaign: () => Promise<void>;
}

const BogoContext = createContext<BogoContextType | undefined>(undefined);

export const BogoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [campaign, setCampaign] = useState<BogoCampaignData | null>(null);
  const [isBogoActive, setIsBogoActive] = useState<boolean>(false);
  const [missedOfferNotice, setMissedOfferNotice] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const navigate = useNavigate();
  const location = useLocation();
  const prevActiveRef = useRef<boolean | null>(null);

  const fetchCampaign = useCallback(async () => {
    try {
      const res = await fetch('/api/bogo-campaign');
      if (res.ok) {
        const data: BogoCampaignData = await res.json();
        setCampaign(data);
        const active = Boolean(data.isActive);

        // Check if transition occurred from active to ended
        if (prevActiveRef.current === true && !active) {
          setMissedOfferNotice(true);
        }

        // Check if transition occurred from inactive to active
        if (prevActiveRef.current === false && active) {
          toast.success('🔥 FLASH DEAL STARTED: Buy 1 Get 1 Free is now active on all products!');
          if (location.pathname !== '/') {
            navigate('/', { replace: true });
          }
        }

        prevActiveRef.current = active;
        setIsBogoActive(active);

        if (active && data.endTimestamp) {
          const diff = Math.max(0, Math.floor((data.endTimestamp - Date.now()) / 1000));
          setRemainingSeconds(diff);
        } else {
          setRemainingSeconds(0);
        }
      }
    } catch {
      // Ignore network errors in polling
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    fetchCampaign();
    // Poll every 5 seconds to stay perfectly synced with server schedule
    const interval = setInterval(fetchCampaign, 5000);
    return () => clearInterval(interval);
  }, [fetchCampaign]);

  // Local second-by-second countdown ticker
  useEffect(() => {
    if (!isBogoActive || remainingSeconds <= 0) return;
    const ticker = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          // Time expired! Fetch latest status, transition to ended, and show notice
          fetchCampaign();
          setMissedOfferNotice(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ticker);
  }, [isBogoActive, remainingSeconds, fetchCampaign]);

  const dismissMissedNotice = useCallback(() => {
    setMissedOfferNotice(false);
  }, []);

  const formattedRemainingTime = React.useMemo(() => {
    if (remainingSeconds <= 0) return '00:00:00';
    const hrs = Math.floor(remainingSeconds / 3600);
    const mins = Math.floor((remainingSeconds % 3600) / 60);
    const secs = remainingSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [remainingSeconds]);

  return (
    <BogoContext.Provider
      value={{
        campaign,
        isBogoActive,
        missedOfferNotice,
        dismissMissedNotice,
        remainingSeconds,
        formattedRemainingTime,
        refreshCampaign: fetchCampaign
      }}
    >
      {children}
    </BogoContext.Provider>
  );
};

export const useBogo = () => {
  const context = useContext(BogoContext);
  if (!context) {
    throw new Error('useBogo must be used within a BogoProvider');
  }
  return context;
};
