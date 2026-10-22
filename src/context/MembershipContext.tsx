import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useCustomerAuth } from './CustomerAuthContext';

interface SubscriptionData {
  id: number;
  subscriptionId: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string | null;
  amount: string;
  paymentMethod: string;
  utrNumber: string;
  status: 'Pending Verification' | 'Verified' | 'Rejected' | 'None';
  adminNotes?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
}

interface MembershipContextType {
  isMember: boolean;
  status: 'Pending Verification' | 'Verified' | 'Rejected' | 'None';
  subscription: SubscriptionData | null;
  daysRemaining: number;
  loading: boolean;
  checkStatus: (mobile?: string) => Promise<void>;
}

const MembershipContext = createContext<MembershipContextType | undefined>(undefined);

export const MembershipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { customer, token, loading: authLoading } = useCustomerAuth();
  const [isMember, setIsMember] = useState(false);
  const [status, setStatus] = useState<'Pending Verification' | 'Verified' | 'Rejected' | 'None'>('None');
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async (customMobile?: string) => {
    // 1. RULE: User MUST be logged in for VIP subscription to be active.
    // If user is logged out, subscription is immediately deactivated!
    const customerToken = token || localStorage.getItem('customer_token');
    if (!customerToken) {
      setIsMember(false);
      setStatus('None');
      setSubscription(null);
      setDaysRemaining(0);
      setLoading(false);
      localStorage.removeItem('fancybazaar_member_mobile');
      return;
    }

    const mobile = customMobile || customer?.mobile || localStorage.getItem('fancybazaar_member_mobile') || '';
    if (!mobile) {
      setIsMember(false);
      setStatus('None');
      setSubscription(null);
      setDaysRemaining(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('mobile', mobile);

      const res = await fetch(`/api/subscriptions/status?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch status');
      const data = await res.json();

      if (data.isMember && data.status === 'Verified') {
        setIsMember(true);
        setStatus('Verified');
        setSubscription(data.subscription || null);
        setDaysRemaining(data.daysRemaining || 0);
        localStorage.setItem('fancybazaar_member_mobile', mobile);
      } else {
        setIsMember(false);
        setStatus(data.status || 'None');
        setSubscription(data.subscription || null);
        setDaysRemaining(data.daysRemaining || 0);
      }
    } catch {
      // keep current state on transient network failures
    } finally {
      setLoading(false);
    }
  }, [customer?.mobile, token]);

  // Synchronize immediately whenever customer logs in or logs out
  useEffect(() => {
    if (authLoading) return;

    if (!customer || !token) {
      // User is logged out -> Subscription automatically deactivates
      setIsMember(false);
      setStatus('None');
      setSubscription(null);
      setDaysRemaining(0);
      setLoading(false);
      localStorage.removeItem('fancybazaar_member_mobile');
      return;
    }

    // User is logged in -> Auto-check subscription for login mobile number
    if (customer.mobile) {
      checkStatus(customer.mobile);
    }
  }, [customer, token, authLoading, checkStatus]);

  useEffect(() => {
    const handleUpdate = () => {
      if (customer?.mobile) {
        checkStatus(customer.mobile);
      } else {
        checkStatus();
      }
    };
    window.addEventListener('membership-updated', handleUpdate);
    return () => window.removeEventListener('membership-updated', handleUpdate);
  }, [checkStatus, customer?.mobile]);

  return (
    <MembershipContext.Provider
      value={{
        isMember,
        status,
        subscription,
        daysRemaining,
        loading,
        checkStatus,
      }}
    >
      {children}
    </MembershipContext.Provider>
  );
};

export const useMembership = () => {
  const context = useContext(MembershipContext);
  if (!context) {
    throw new Error('useMembership must be used within a MembershipProvider');
  }
  return context;
};
