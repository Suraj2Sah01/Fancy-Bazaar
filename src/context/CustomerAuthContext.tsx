import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface CustomerAddress {
  house?: string;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
}

export interface Customer {
  id: number;
  name: string;
  mobile: string;
  avatar?: string | null;
  address?: CustomerAddress | null;
  isMember?: boolean;
  subscription?: any;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  isProfileDrawerOpen: boolean;
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: 'login' | 'signup') => void;
  openProfileDrawer: () => void;
  closeProfileDrawer: () => void;
  login: (mobile: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, mobile: string, password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: { name?: string; avatar?: string; address?: CustomerAddress }) => Promise<{ success: boolean; error?: string }>;
  uploadAvatar: (file: File) => Promise<{ success: boolean; avatarUrl?: string; error?: string }>;
  logout: () => void;
  refreshCustomer: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('customer_token'));
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('signup');
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  const refreshCustomer = useCallback(async () => {
    const savedToken = localStorage.getItem('customer_token');
    if (!savedToken) {
      setCustomer(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/customer/me', {
        headers: {
          Authorization: `Bearer ${savedToken}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
        setToken(savedToken);
        if (data.customer?.mobile) {
          localStorage.setItem('fancybazaar_member_mobile', data.customer.mobile);
          localStorage.setItem('customer_mobile', data.customer.mobile);
        }
        if (data.customer?.address) {
          try {
            localStorage.setItem('checkout_address', JSON.stringify({
              ...data.customer.address,
              name: data.customer.name,
              mobile: data.customer.mobile
            }));
          } catch {}
        }
      } else {
        localStorage.removeItem('customer_token');
        localStorage.removeItem('customer_mobile');
        setCustomer(null);
        setToken(null);
      }
    } catch (err) {
      console.error('Failed to restore customer session:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCustomer();
  }, [refreshCustomer]);

  const openAuthModal = useCallback((mode: 'login' | 'signup' = 'signup') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const openProfileDrawer = useCallback(() => {
    setIsProfileDrawerOpen(true);
  }, []);

  const closeProfileDrawer = useCallback(() => {
    setIsProfileDrawerOpen(false);
  }, []);

  const login = async (mobile: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed. Please check credentials.' };
      }

      if (data.token) {
        localStorage.setItem('customer_token', data.token);
        setToken(data.token);
      }
      if (data.customer) {
        setCustomer(data.customer);
        if (data.customer.mobile) {
          localStorage.setItem('fancybazaar_member_mobile', data.customer.mobile);
          localStorage.setItem('customer_mobile', data.customer.mobile);
        }
        if (data.customer.address) {
          try {
            localStorage.setItem('checkout_address', JSON.stringify({
              ...data.customer.address,
              name: data.customer.name,
              mobile: data.customer.mobile
            }));
          } catch {}
        }
        window.dispatchEvent(new CustomEvent('membership-updated'));
      }
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error while logging in' };
    }
  };

  const signup = async (
    name: string,
    mobile: string,
    password: string,
    confirmPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/customer/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile, password, confirmPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Signup failed. Please try again.' };
      }

      if (data.token) {
        localStorage.setItem('customer_token', data.token);
        setToken(data.token);
      }
      if (data.customer) {
        setCustomer(data.customer);
        if (data.customer.mobile) {
          localStorage.setItem('fancybazaar_member_mobile', data.customer.mobile);
          localStorage.setItem('customer_mobile', data.customer.mobile);
        }
        window.dispatchEvent(new CustomEvent('membership-updated'));
      }
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error while signing up' };
    }
  };

  const updateProfile = async (data: { name?: string; avatar?: string; address?: CustomerAddress }): Promise<{ success: boolean; error?: string }> => {
    const savedToken = localStorage.getItem('customer_token');
    if (!savedToken) return { success: false, error: 'Not logged in' };

    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${savedToken}`
        },
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Failed to update profile' };
      }

      if (resData.customer) {
        setCustomer(resData.customer);
        if (resData.customer.address) {
          try {
            localStorage.setItem('checkout_address', JSON.stringify({
              ...resData.customer.address,
              name: resData.customer.name,
              mobile: resData.customer.mobile
            }));
          } catch {}
        }
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update profile' };
    }
  };

  const uploadAvatar = async (file: File): Promise<{ success: boolean; avatarUrl?: string; error?: string }> => {
    const savedToken = localStorage.getItem('customer_token');
    if (!savedToken) return { success: false, error: 'Not logged in' };

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/customer/upload-avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${savedToken}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to upload photo' };
      }

      if (data.avatarUrl && customer) {
        setCustomer({ ...customer, avatar: data.avatarUrl });
      }
      return { success: true, avatarUrl: data.avatarUrl };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to upload photo' };
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_mobile');
    localStorage.removeItem('fancybazaar_member_mobile');
    setToken(null);
    setCustomer(null);
    setIsProfileDrawerOpen(false);
    window.dispatchEvent(new CustomEvent('membership-updated'));
    // Immediately redirect to home page as requested
    window.location.href = '/';
  }, []);

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        token,
        isAuthenticated: Boolean(token && customer),
        loading,
        isAuthModalOpen,
        authModalMode,
        isProfileDrawerOpen,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
        openProfileDrawer,
        closeProfileDrawer,
        login,
        signup,
        updateProfile,
        uploadAvatar,
        logout,
        refreshCustomer
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};
