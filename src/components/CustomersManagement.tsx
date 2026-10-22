import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, Crown, Key, Lock, Phone, ShieldCheck, AlertCircle, CheckCircle, RefreshCw, ArrowUpDown, ShoppingBag, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';

interface CustomerItem {
  id: number;
  name: string;
  mobile: string;
  status: string;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
  isMember: boolean;
  totalSpent: number;
  totalOrders: number;
  lastOrderAt: string | null;
}

export default function CustomersManagement() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'spent-desc' | 'spent-asc' | 'orders-desc' | 'newest' | 'oldest'>('spent-desc');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('dashboard_token');
      const res = await fetch('/api/dashboard/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      } else {
        toast.error('Failed to load registered customers');
      }
    } catch {
      toast.error('Network error loading customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setResetting(true);
    try {
      const token = localStorage.getItem('dashboard_token');
      const res = await fetch(`/api/dashboard/customers/${selectedCustomer.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Password for ${selectedCustomer.name || selectedCustomer.mobile} reset successfully!`);
        setSelectedCustomer(null);
        setNewPassword('');
        fetchCustomers();
      } else {
        toast.error(data.error || 'Failed to reset password');
      }
    } catch {
      toast.error('Network error resetting password');
    } finally {
      setResetting(false);
    }
  };

  const filteredAndSortedCustomers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    const result = customers.filter(c => {
      return (c.name || '').toLowerCase().includes(q) || (c.mobile || '').includes(q);
    });

    result.sort((a, b) => {
      if (sortBy === 'spent-desc') return (b.totalSpent || 0) - (a.totalSpent || 0);
      if (sortBy === 'spent-asc') return (a.totalSpent || 0) - (b.totalSpent || 0);
      if (sortBy === 'orders-desc') return (b.totalOrders || 0) - (a.totalOrders || 0);
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // 'newest'
    });

    return result;
  }, [customers, searchTerm, sortBy]);

  const totalShoppingRevenue = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  }, [customers]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            Registered Customers & Shopping Analytics
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Track who spent how much (High to Low / Low to High), VIP status, account locks, and manage passwords
          </p>
        </div>
        <button
          onClick={fetchCustomers}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-xs hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors w-fit"
        >
          <RefreshCw className="w-4 h-4" /> Refresh List
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Customers</p>
            <p className="text-xl font-black text-gray-900 dark:text-white">{customers.length}</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Customer Shopping</p>
            <p className="text-xl font-black text-emerald-600">₹{totalShoppingRevenue.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 shrink-0">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">VIP Members</p>
            <p className="text-xl font-black text-amber-600">{customers.filter(c => c.isMember).length}</p>
          </div>
        </div>
      </div>

      {/* Search Bar & Sort Dropdown */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-grow">
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by customer name or 10-digit mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          />
        </div>

        {/* Sort Option (High to Low / Low to High) */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-3.5 py-2 shrink-0 shadow-sm">
          <ArrowUpDown className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-xs font-black text-gray-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="spent-desc" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Shopping: High to Low (₹ Highest first)</option>
            <option value="spent-asc" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Shopping: Low to High (₹ Lowest first)</option>
            <option value="orders-desc" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Orders: Most Orders</option>
            <option value="newest" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Registered: Newest First</option>
            <option value="oldest" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Registered: Oldest First</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm font-bold flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
            Loading registered customers...
          </div>
        ) : filteredAndSortedCustomers.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            No customer accounts found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-[10px] font-black text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-850">
                  <th className="p-4">Customer</th>
                  <th className="p-4">Mobile Number</th>
                  <th className="p-4">Total Shopping</th>
                  <th className="p-4">Membership</th>
                  <th className="p-4">Security Status</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                {filteredAndSortedCustomers.map((c) => {
                  const isLocked = c.lockedUntil && new Date(c.lockedUntil) > new Date();
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black text-xs flex items-center justify-center shrink-0">
                            {c.name ? c.name[0].toUpperCase() : 'U'}
                          </div>
                          <span>{c.name || 'Unnamed Customer'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          +91 {c.mobile}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                            ₹{(c.totalSpent || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                            {c.totalOrders || 0} order{(c.totalOrders || 0) === 1 ? '' : 's'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        {c.isMember ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            <Crown className="w-3.5 h-3.5 text-amber-500" /> VIP Member
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            Standard
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 border border-red-200">
                            <Lock className="w-3.5 h-3.5" /> Locked (5 fails)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400">
                            <CheckCircle className="w-3.5 h-3.5" /> Active
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-gray-500 font-medium">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedCustomer(c);
                            setNewPassword('');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all"
                        >
                          <Key className="w-3.5 h-3.5" /> Reset Password
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Reset Password Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-sm w-full border border-gray-100 dark:border-gray-800 shadow-2xl">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 mb-1">
              <Key className="w-5 h-5 text-indigo-600" /> Reset Customer Password
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Enter a new secure password for <span className="font-bold text-gray-800 dark:text-gray-200">{selectedCustomer.name}</span> (+91 {selectedCustomer.mobile}). This will also clear any temporary lockout.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md transition-all disabled:opacity-60"
                >
                  {resetting ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
