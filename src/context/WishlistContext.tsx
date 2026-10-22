import React, { createContext, useContext, useState, useEffect } from 'react';

interface Product {
  id: number;
  name: string;
  originalPrice: string;
  sellingPrice: string;
  imageUrl?: string;
  discountValue?: string;
  discountType?: string;
  shippingCharges?: string;
}

interface WishlistContextType {
  wishlist: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  toggleWishlist: (product: Product) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [userId, setUserId] = useState<string>('');

  // Load user ID and wishlist on init
  useEffect(() => {
    let id = localStorage.getItem('fancybazaar_user_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('fancybazaar_user_id', id);
    }
    setUserId(id);
    fetchWishlist(id);
  }, []);

  const fetchWishlist = async (uid: string) => {
    try {
      const res = await fetch(`/api/wishlist/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setWishlist(data);
      }
    } catch (e) {
      console.error('Failed to fetch wishlist', e);
    }
  };

  const addToWishlist = async (product: Product) => {
    if (!userId) return;
    setWishlist(prev => {
      if (prev.find(p => p.id === product.id)) return prev;
      return [...prev, product];
    });
    
    try {
      await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId: product.id })
      });
    } catch (e) {
      console.error('Failed to add to wishlist', e);
    }
  };

  const removeFromWishlist = async (productId: number) => {
    if (!userId) return;
    setWishlist(prev => prev.filter(p => p.id !== productId));
    
    try {
      await fetch(`/api/wishlist/${userId}/${productId}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.error('Failed to remove from wishlist', e);
    }
  };

  const clearWishlist = async () => {
    setWishlist([]);
    if (!userId) return;
    try {
      await fetch(`/api/wishlist/${userId}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.error('Failed to clear wishlist', e);
    }
  };

  const isInWishlist = (productId: number) => {
    return wishlist.some(p => p.id === productId);
  };

  const toggleWishlist = (product: Product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, clearWishlist, isInWishlist, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
