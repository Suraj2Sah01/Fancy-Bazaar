import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Tag, Image as ImageIcon, 
  Settings as SettingsIcon, LogOut, Package, CreditCard, 
  CheckCircle2, Clock, AlertCircle, Plus, Edit, Trash2, Save,
  X, ChevronRight, Search, Filter, ArrowLeft, MoreVertical, Lock,
  Copy, ExternalLink, Ticket, RefreshCcw, CheckCircle, XCircle, Eye, EyeOff,
  Watch, Cpu, Wifi, Battery, Camera, Activity, Sparkles, Monitor, Layers, ChevronDown, Check, Trash, Shield, Info, Sliders, Smartphone, PlusCircle, Ban, RotateCcw, Images, Zap, Trophy, Crown, Users, KeyRound, Truck,
  IndianRupee, ArrowUpDown, ArrowDown, ArrowUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { copyToClipboard } from '../utils/clipboard';
import { SMARTWATCH_SPEC_GROUPS, SAMPLE_ANDROID_SMARTWATCH_SPECS, cleanSpecifications } from '../data/smartwatchSpecs';
import CustomersManagement from '../components/CustomersManagement';

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';

// --- Components ---

function CopyButton({ text, label, className = '' }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(label ? `Copied: ${label}` : `Copied: ${text.length > 20 ? text.slice(0, 20) + '...' : text}`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
        copied 
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 ring-1 ring-emerald-400' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300'
      } ${className}`}
      title={label ? `Copy ${label}` : `Copy "${text}"`}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-gray-500 shrink-0" />}
      {label && <span>{copied ? 'Copied!' : label}</span>}
    </button>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 dark:border-gray-800 shadow-sm flex items-center gap-4 transition-colors">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-gray-900 dark:text-white dark:text-white transition-colors">{value}</p>
      </div>
    </div>
  );
}

// --- Sections ---

function Overview() {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  useEffect(() => {
    const token = localStorage.getItem('dashboard_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    fetch('/api/dashboard/stats', { headers })
      .then(res => res.json())
      .then(data => setStats(data));

    fetch('/api/dashboard/sales-analytics', { headers })
      .then(res => res.json())
      .then(data => setAnalytics(data));

    fetch('/api/dashboard/settings', { headers })
      .then(res => res.json())
      .then(data => setStoreSettings(data));
  }, []);

  const [storeSettings, setStoreSettings] = useState<any>(null);

  const toggleGlobalVisibility = async () => {
    const token = localStorage.getItem('dashboard_token');
    const newValue = !storeSettings.visibility?.allProductsHidden;
    const res = await fetch('/api/dashboard/settings/visibility_settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ allProductsHidden: newValue })
    });
    if (res.ok) {
      setStoreSettings({ ...storeSettings, visibility: { allProductsHidden: newValue } });
      toast.success(newValue ? 'Store Hidden from Customers' : 'Store Visible to Customers');
    }
  };

  if (!stats || !storeSettings) return <div className="p-8 text-gray-500 font-bold">Loading dashboard...</div>;

  const getMonthlyData = () => {
    const monthly: any = {};
    analytics.forEach(item => {
      const month = format(new Date(item.date), 'MMMM yyyy');
      if (!monthly[month]) {
        monthly[month] = { date: month, totalAmount: 0, count: 0 };
      }
      monthly[month].totalAmount += parseFloat(item.totalAmount || '0');
      monthly[month].count += parseInt(item.count || '0');
    });
    return Object.values(monthly);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white dark:text-white transition-colors">Dashboard Overview</h1>
          <div className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-1">Refreshed: {format(new Date(), 'hh:mm a')}</div>
        </div>
        
        <div className={`flex items-center gap-4 p-4 rounded-3xl border transition-all ${storeSettings.visibility?.allProductsHidden ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex flex-col">
            <span className={`text-[10px] font-black uppercase tracking-widest ${storeSettings.visibility?.allProductsHidden ? 'text-amber-600' : 'text-green-600'}`}>
              Store Status: {storeSettings.visibility?.allProductsHidden ? 'Hidden' : 'Live'}
            </span>
            <span className="text-xs text-gray-500">Hide all products from customers</span>
          </div>
          <button 
            onClick={toggleGlobalVisibility}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${storeSettings.visibility?.allProductsHidden ? 'bg-amber-500' : 'bg-green-500'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${storeSettings.visibility?.allProductsHidden ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <StatCard title="Total Orders" value={stats.totalOrders || 0} icon={<ShoppingCart className="w-6 h-6" />} color="bg-indigo-50 text-indigo-600" />
        <StatCard title="Total Products" value={stats.totalProducts || 0} icon={<Package className="w-6 h-6" />} color="bg-purple-50 text-purple-600" />
        <StatCard title="Total Sales" value={`₹${parseFloat(stats.totalValue || '0').toLocaleString()}`} icon={<CreditCard className="w-6 h-6" />} color="bg-green-50 text-green-600" />
        <StatCard title="Paid Orders" value={stats.paidOrders || 0} icon={<CheckCircle2 className="w-6 h-6" />} color="bg-blue-50 text-blue-600" />
        <StatCard title="Verification Pending" value={stats.pendingVerification || 0} icon={<Clock className="w-6 h-6" />} color="bg-amber-50 text-amber-600" />
        <StatCard 
          title="VIP Subscriptions" 
          value={Number(stats.pendingSubscriptions) > 0 ? `${stats.pendingSubscriptions} Pending` : `${stats.verifiedSubscriptions || 0} Active`} 
          icon={<Crown className="w-6 h-6" />} 
          color="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 dark:border-gray-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white dark:text-white">Sales Performance</h3>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('daily')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${viewMode === 'daily' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-400'}`}
              >
                Daily
              </button>
              <button 
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${viewMode === 'monthly' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-400'}`}
              >
                Monthly
              </button>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'daily' ? (
                <AreaChart data={analytics}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                    tickFormatter={(val) => format(new Date(val), 'dd MMM')}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                    formatter={(val: any) => [`₹${parseFloat(val).toLocaleString()}`, 'Revenue']}
                    labelFormatter={(label) => label ? format(new Date(label as string), 'dd MMMM yyyy') : ''}
                  />
                  <Area type="monotone" dataKey="totalAmount" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              ) : (
                <BarChart data={getMonthlyData()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                    formatter={(val: any) => [`₹${parseFloat(val).toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="totalAmount" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 dark:border-gray-800 shadow-sm transition-colors">
          <h3 className="font-bold text-gray-900 dark:text-white dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            <Link to="/dashboard/products" className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors group">
              <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center shadow-sm">
                <Plus className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white dark:text-white">Add Product</p>
                <p className="text-[10px] text-gray-400">List new items for sale</p>
              </div>
            </Link>
            <Link to="/dashboard/banners" className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors group">
              <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center shadow-sm">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white dark:text-white">Manage Banners</p>
                <p className="text-[10px] text-gray-400">Update slider images</p>
              </div>
            </Link>
            <Link to="/dashboard/change-requests" className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors group">
              <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center shadow-sm">
                <RefreshCcw className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white dark:text-white">Change Requests</p>
                <p className="text-[10px] text-gray-400">Handle returns and edits</p>
              </div>
            </Link>
            <Link to="/dashboard/subscriptions" className="flex items-center gap-3 p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl hover:bg-amber-100/70 dark:hover:bg-amber-900/50 transition-colors group">
              <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm text-amber-500">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white dark:text-white flex items-center gap-1.5">
                  <span>Premium Payments</span>
                  {Number(stats.pendingSubscriptions) > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-amber-500 text-white font-black animate-pulse">
                      {stats.pendingSubscriptions} new
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-gray-400">Verify customer UPI payments (₹299)</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrdersList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'amount-desc' | 'amount-asc' | 'spend-desc' | 'spend-asc' | 'newest' | 'oldest'>('amount-desc');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const token = localStorage.getItem('dashboard_token');
    fetch('/api/dashboard/orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()).then(data => {
      setOrders(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  // Compute lifetime shopping and order count for every customer
  const customerSpendMap = useMemo(() => {
    const map = new Map<string, { totalSpent: number; totalOrders: number; customerName: string }>();
    orders.forEach((o: any) => {
      const mob = (o.customerMobile || '').trim();
      if (!mob) return;
      const existing = map.get(mob) || { totalSpent: 0, totalOrders: 0, customerName: o.customerName || 'Customer' };
      const amt = parseFloat(o.finalAmount || '0') || 0;
      if (o.orderStatus !== 'Cancelled' && o.orderStatus !== 'Payment Failed') {
        existing.totalSpent += amt;
      }
      existing.totalOrders += 1;
      if (o.customerName && (!existing.customerName || existing.customerName === 'Customer')) {
        existing.customerName = o.customerName;
      }
      map.set(mob, existing);
    });
    return map;
  }, [orders]);

  const filteredAndSortedOrders = useMemo(() => {
    let result = orders.filter((o: any) => {
      const q = searchTerm.toLowerCase();
      const matchSearch = (o.orderNumber || '').toLowerCase().includes(q) ||
        (o.customerName || '').toLowerCase().includes(q) ||
        (o.customerMobile || '').includes(q);
      const matchStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter;
      return matchSearch && matchStatus;
    });

    result.sort((a: any, b: any) => {
      const amtA = parseFloat(a.finalAmount || '0') || 0;
      const amtB = parseFloat(b.finalAmount || '0') || 0;
      const mobA = (a.customerMobile || '').trim();
      const mobB = (b.customerMobile || '').trim();
      const spendA = customerSpendMap.get(mobA)?.totalSpent || 0;
      const spendB = customerSpendMap.get(mobB)?.totalSpent || 0;

      if (sortBy === 'amount-desc') return amtB - amtA;
      if (sortBy === 'amount-asc') return amtA - amtB;
      if (sortBy === 'spend-desc') return spendB - spendA;
      if (sortBy === 'spend-asc') return spendA - spendB;
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // newest
    });

    return result;
  }, [orders, searchTerm, sortBy, statusFilter, customerSpendMap]);

  const totalFilteredSales = useMemo(() => {
    return filteredAndSortedOrders
      .filter(o => o.orderStatus !== 'Cancelled')
      .reduce((sum, o) => sum + (parseFloat(o.finalAmount || '0') || 0), 0);
  }, [filteredAndSortedOrders]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white dark:text-white transition-colors">Manage Orders & Customer Spend</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Track kaun kitna ka shopping kiya hai, sort High to Low / Low to High, and view live order statuses
          </p>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 dark:border-gray-800 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Orders</p>
            <p className="text-xl font-black text-gray-900 dark:text-white dark:text-white">{orders.length}</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 dark:border-gray-800 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Filtered Orders Value</p>
            <p className="text-xl font-black text-emerald-600">₹{totalFilteredSales.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 dark:border-gray-800 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Unique Customers</p>
            <p className="text-xl font-black text-amber-600">{customerSpendMap.size}</p>
          </div>
        </div>
      </div>

      {/* Search, Sort Dropdown & Quick Toggle Pills */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-grow">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search Order ID, Customer name or Mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:border-gray-800 rounded-2xl text-xs text-gray-900 dark:text-white dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 dark:text-gray-300 outline-none cursor-pointer shadow-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="Order Placed">Order Placed</option>
              <option value="Shipped">Shipped</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Amount & Customer Spend Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:border-gray-800 rounded-xl px-2.5 py-1.5 shadow-sm">
              <ArrowUpDown className="w-4 h-4 text-indigo-600 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-black text-gray-900 dark:text-white dark:text-white outline-none cursor-pointer"
              >
                <option value="amount-desc">Order Amount: High to Low (₹ High → Low)</option>
                <option value="amount-asc">Order Amount: Low to High (₹ Low → High)</option>
                <option value="spend-desc">Customer Total Shopping: High to Low (Highest Spenders)</option>
                <option value="spend-asc">Customer Total Shopping: Low to High (Lowest Spenders)</option>
                <option value="newest">Date: Newest First</option>
                <option value="oldest">Date: Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* 1-Click Quick Sort Buttons for High to Low / Low to High */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Quick Sort:</span>
          <button
            type="button"
            onClick={() => setSortBy('amount-desc')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              sortBy === 'amount-desc' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:border-gray-800 text-gray-700 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800'
            }`}
          >
            <ArrowDown className="w-3.5 h-3.5" /> Order: High to Low
          </button>
          <button
            type="button"
            onClick={() => setSortBy('amount-asc')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              sortBy === 'amount-asc' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:border-gray-800 text-gray-700 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800'
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5" /> Order: Low to High
          </button>
          <button
            type="button"
            onClick={() => setSortBy('spend-desc')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              sortBy === 'spend-desc' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <Crown className="w-3.5 h-3.5" /> Customer Shopping: High to Low
          </button>
          <button
            type="button"
            onClick={() => setSortBy('spend-asc')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              sortBy === 'spend-asc' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5" /> Customer Shopping: Low to High
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 dark:border-gray-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 dark:bg-gray-800/50 border-b dark:border-gray-800 transition-colors">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                  Customer & Total Shopping
                </th>
                <th 
                  onClick={() => setSortBy(sortBy === 'amount-desc' ? 'amount-asc' : 'amount-desc')}
                  className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase cursor-pointer hover:text-indigo-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Order Amount</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {filteredAndSortedOrders.map((order: any) => {
                const mob = (order.customerMobile || '').trim();
                const spendInfo = customerSpendMap.get(mob) || { totalSpent: parseFloat(order.finalAmount || '0') || 0, totalOrders: 1 };
                return (
                  <tr key={order.id} className="hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      <div className="flex items-center gap-1.5">
                        <span>{order.orderNumber}</span>
                        <CopyButton text={order.orderNumber} label="" className="!p-1 text-[10px]" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-gray-900 dark:text-white dark:text-white transition-colors">{order.customerName}</p>
                        <CopyButton text={order.customerName} label="" className="!p-1 text-[10px]" />
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                        <span>+91 {order.customerMobile}</span>
                        <CopyButton text={order.customerMobile} label="" className="!p-0.5 text-[9px]" />
                      </div>
                      
                      {/* Kaun kitna shopping kiya hai - Highlighted Badge */}
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                          <IndianRupee className="w-2.5 h-2.5 shrink-0" />
                          <span>Total Shopping: ₹{spendInfo.totalSpent.toLocaleString('en-IN')}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-normal">({spendInfo.totalOrders} {spendInfo.totalOrders === 1 ? 'order' : 'orders'})</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-black dark:text-white transition-colors">
                      ₹{parseFloat(order.finalAmount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        order.orderStatus === 'Delivered' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                        order.orderStatus === 'Cancelled' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                        'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">{format(new Date(order.createdAt), 'dd-MM-yyyy')}</td>
                    <td className="px-6 py-4">
                      <Link to={`/dashboard/orders/${order.id}`} className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OrderDetails() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [outForDeliveryOtp, setOutForDeliveryOtp] = useState('');
  const [deliveryOtpInput, setDeliveryOtpInput] = useState('');
  const [noOtpAvailable, setNoOtpAvailable] = useState(false);
  const [deliveryReason, setDeliveryReason] = useState('');
  const [isEditingOtp, setIsEditingOtp] = useState(false);
  const [customManualOtpInput, setCustomManualOtpInput] = useState('');
  const [savingOtp, setSavingOtp] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('dashboard_token');
    fetch(`/api/dashboard/orders/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()).then(data => {
      setData(data);
      setNewStatus(data.order.orderStatus);
      setCancellationReason(data.order.cancellationReason || '');
      setDeliveryReason(data.order.deliveryReason || '');
      setOutForDeliveryOtp(data.order.deliveryOtp || '');
    });
  }, [id]);

  const handleSaveManualOtp = async () => {
    if (!customManualOtpInput.trim()) {
      toast.error('Please enter a valid OTP');
      return;
    }
    setSavingOtp(true);
    try {
      const token = localStorage.getItem('dashboard_token');
      const res = await fetch(`/api/dashboard/orders/${id}/delivery-otp`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ deliveryOtp: customManualOtpInput.trim() })
      });
      const resData = await res.json();
      if (res.ok) {
        toast.success(`Manual OTP updated to: ${customManualOtpInput.trim()}`);
        setData((prev: any) => ({
          ...prev,
          order: { ...prev.order, deliveryOtp: customManualOtpInput.trim() }
        }));
        setOutForDeliveryOtp(customManualOtpInput.trim());
        setIsEditingOtp(false);
      } else {
        toast.error(resData.error || 'Failed to update manual OTP');
      }
    } catch {
      toast.error('Network error updating OTP');
    } finally {
      setSavingOtp(false);
    }
  };

  const updateStatus = async () => {
    if (newStatus === 'Out for Delivery') {
      if (!outForDeliveryOtp.trim()) {
        toast.error('Please enter a manual Delivery OTP for customer before marking Out for Delivery!');
        return;
      }
    }

    if (newStatus === 'Delivered') {
      if (!noOtpAvailable && !deliveryOtpInput.trim()) {
        toast.error('Please enter the customer Delivery OTP, or check "Customer does not have OTP" to enter a reason.');
        return;
      }
      if (noOtpAvailable && !deliveryReason.trim()) {
        toast.error('Please enter the reason for delivery without OTP (visible to customer).');
        return;
      }
    }

    const token = localStorage.getItem('dashboard_token');
    const res = await fetch(`/api/dashboard/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ 
        status: newStatus, 
        notes,
        cancellationReason: newStatus === 'Cancelled' ? cancellationReason : null,
        manualOtp: outForDeliveryOtp.trim() || undefined,
        deliveryOtpInput: noOtpAvailable ? null : deliveryOtpInput.trim(),
        deliveryReason: noOtpAvailable ? deliveryReason.trim() : null
      })
    });
    const resData = await res.json();
    if (res.ok) {
      toast.success('Status updated');
      window.location.reload();
    } else {
      toast.error(resData.error || 'Failed to update status');
    }
  };

  const verifyPayment = async (status: string) => {
    const token = localStorage.getItem('dashboard_token');
    const res = await fetch(`/api/dashboard/orders/${id}/payment`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      toast.success(`Payment marked as ${status}`);
      window.location.reload();
    }
  };

  if (!data) return <div className="p-8 text-center">Loading details...</div>;

  const { order, history } = data;
  const fullAddress = `${order.address.house}, ${order.address.street}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}${order.address.landmark ? ` (Landmark: ${order.address.landmark})` : ''}`;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link to="/dashboard/orders" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-white mb-6 transition-colors font-bold text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 dark:border-gray-800 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order Number</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <h2 className="text-2xl font-black text-indigo-600">{order.orderNumber}</h2>
                  <CopyButton text={order.orderNumber} label="Copy ID" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order Date</p>
                <p className="font-bold text-gray-900 dark:text-white">{format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
              </div>
            </div>

            {/* Delivery OTP & Status Info Banner */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-gray-950 flex items-center justify-center font-black shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-black uppercase text-amber-900 tracking-wider">
                        Manual Customer Delivery OTP
                      </p>
                      {order.deliveryVerifiedWithOtp ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✓ Verified With OTP
                        </span>
                      ) : order.deliveryReason ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-orange-100 text-orange-800 border border-orange-300">
                          Delivered Without OTP
                        </span>
                      ) : order.deliveryOtp ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-200 text-amber-900 border border-amber-400">
                          Active Manual OTP
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-gray-200 text-gray-700 dark:text-gray-300 border border-gray-300">
                          Not Set Yet
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-amber-800 mt-0.5">
                      System automatic OTP nahi banata. Admin jo manual OTP daalega wahi customer ko Out for Delivery par dikhega.
                    </p>
                  </div>
                </div>

                {!isEditingOtp ? (
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {order.deliveryOtp ? (
                      <>
                        <span className="font-mono font-black text-lg text-amber-900 px-3 py-1 bg-white rounded-xl border border-amber-300 tracking-widest shadow-sm">
                          {order.deliveryOtp}
                        </span>
                        <CopyButton text={order.deliveryOtp} label="Copy OTP" />
                        <button
                          type="button"
                          onClick={() => {
                            setCustomManualOtpInput(order.deliveryOtp || '');
                            setIsEditingOtp(true);
                          }}
                          className="px-2.5 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit OTP
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomManualOtpInput('');
                          setIsEditingOtp(true);
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-gray-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Set Manual OTP
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Enter manual OTP"
                      value={customManualOtpInput}
                      onChange={(e) => setCustomManualOtpInput(e.target.value.trim())}
                      className="px-3 py-1.5 bg-white border border-amber-400 rounded-xl font-mono text-sm font-bold text-amber-950 outline-none focus:ring-2 focus:ring-amber-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      disabled={savingOtp}
                      onClick={handleSaveManualOtp}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      {savingOtp ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingOtp(false)}
                      className="px-2.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {order.orderStatus === 'Delivered' && order.deliveryReason && (
              <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-2xl text-xs">
                <p className="text-[10px] font-bold text-orange-900 uppercase tracking-wider">Recorded Reason for No-OTP Delivery (Visible to Customer):</p>
                <p className="text-orange-950 font-medium mt-1 bg-white/80 p-2 rounded-xl italic">{order.deliveryReason}</p>
              </div>
            )}

            <div className="pt-6 border-t">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">Customer Information</h3>
                <CopyButton text={`${order.customerName}\n+91 ${order.customerMobile}\n${fullAddress}`} label="Copy All Info" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Customer Name</p>
                    <p className="font-bold text-gray-900 dark:text-white">{order.customerName}</p>
                  </div>
                  <CopyButton text={order.customerName} label="Copy Name" />
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Mobile Number</p>
                    <p className="font-bold font-mono text-gray-900 dark:text-white">+91 {order.customerMobile}</p>
                  </div>
                  <CopyButton text={order.customerMobile} label="Copy Mobile" />
                </div>
                <div className="sm:col-span-2 p-3.5 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-grow">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Full Delivery Address</p>
                      <p className="font-bold text-gray-900 dark:text-white leading-relaxed mt-0.5">
                        {order.address.house}, {order.address.street}, {order.address.city}, {order.address.state} - <span className="font-mono text-indigo-600">{order.address.pincode}</span>
                      </p>
                      {order.address.landmark && (
                        <p className="text-xs text-indigo-600 mt-1 font-medium">Landmark: {order.address.landmark}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <CopyButton text={fullAddress} label="Copy Full Address" />
                      <CopyButton text={order.address.pincode} label="Copy Pincode" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">Product Details</h3>
                <CopyButton text={order.productSnapshot.name} label="Copy Product" />
              </div>
              <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl mb-4">
                <img 
                  src={order.productSnapshot.imageUrl} 
                  alt="" 
                  className="w-20 h-20 rounded-xl object-cover border" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop';
                  }}
                />
                <div className="flex-grow">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-gray-900 dark:text-white">{order.productSnapshot.name}</h4>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <div>
                      <p className="text-xs text-gray-500">
                        Qty: {order.quantity || 1} • Method: {order.paymentMethod}
                        {order.selectedColor && ` • Color: ${order.selectedColor}`}
                        {order.selectedSize && ` • Size: ${order.selectedSize}`}
                      </p>
                      {order.utrReference && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <p className="text-[10px] font-mono text-indigo-600">UTR: {order.utrReference}</p>
                          <CopyButton text={order.utrReference} label="Copy UTR" className="!p-0.5 text-[9px]" />
                        </div>
                      )}
                    </div>
                    <p className="text-lg font-black text-gray-900 dark:text-white">₹{parseFloat(order.finalAmount).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {order.productSnapshot.sourceUrl && (
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
                  <div className="flex-grow min-w-0">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Source URL</p>
                    <p className="text-xs font-mono text-indigo-900 truncate pr-4">{order.productSnapshot.sourceUrl}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={async () => {
                        const success = await copyToClipboard(order.productSnapshot.sourceUrl);
                        if (success) toast.success('URL Copied');
                        else toast.error('Failed to copy URL');
                      }}
                      className="p-2 bg-white text-indigo-600 rounded-xl shadow-sm hover:scale-110 transition-transform"
                      title="Copy URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <a 
                      href={order.productSnapshot.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-white text-indigo-600 rounded-xl shadow-sm hover:scale-110 transition-transform"
                      title="Open URL"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {order.orderStatus === 'Cancelled' && order.cancellationReason && (
            <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-900 uppercase">Reason for Cancellation</p>
                <p className="text-sm text-red-700 mt-0.5">{order.cancellationReason}</p>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 dark:border-gray-800 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-6">Order Timeline</h3>
            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
              {history.map((item: any, idx: number) => (
                <div key={item.id} className="relative pl-8">
                  <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${idx === 0 ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                    {idx === 0 ? <CheckCircle2 className="w-3 h-3 text-white" /> : <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold ${idx === 0 ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{item.status}</p>
                      <span className="text-[10px] text-gray-400">{format(new Date(item.updatedAt), 'dd MMM, hh:mm a')}</span>
                    </div>
                    {item.notes && <p className="text-xs text-gray-400 mt-0.5">{item.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 dark:border-gray-800 shadow-sm">
            <h3 className="text-gray-900 dark:text-white dark:text-white font-bold mb-4">Update Order Status</h3>
            <div className="space-y-4">
              <select 
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 dark:border-gray-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
              >
                <option value="Order Placed">Order Placed</option>
                <option value="Payment Verification Pending">Payment Verification Pending</option>
                <option value="Payment Verified">Payment Verified</option>
                <option value="Shipped">Shipped</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Payment Failed">Payment Failed</option>
                <option value="Returned">Returned</option>
              </select>
              {newStatus === 'Cancelled' && (
                <textarea
                  placeholder="Reason for cancellation (will be visible to user)..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full p-3 bg-red-50 border border-red-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 min-h-[80px]"
                  required
                />
              )}

              {newStatus === 'Delivered' && (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-amber-600" />
                      Delivery OTP Verification
                    </label>
                    {order.deliveryOtp && (
                      <span className="text-[10px] font-mono font-bold text-amber-800">
                        Customer OTP: {order.deliveryOtp}
                      </span>
                    )}
                  </div>

                  {!noOtpAvailable ? (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                        Enter Customer Delivery OTP *:
                      </label>
                      <input
                        type="text"
                        placeholder={order.deliveryOtp ? `Enter OTP (${order.deliveryOtp})` : "Enter customer delivery OTP"}
                        value={deliveryOtpInput}
                        onChange={(e) => setDeliveryOtpInput(e.target.value.trim())}
                        className="w-full p-3 bg-white border border-amber-300 rounded-xl font-mono text-center text-lg font-black tracking-widest text-amber-950 outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                        autoFocus
                      />
                      <p className="text-[10px] text-gray-500">Ask the customer for the manual OTP provided to them.</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-red-700">
                        Reason for Missing OTP (Visible to Customer) *:
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="e.g. Customer verified in person / Phone unreachable / Delivered to neighbor Mr. Sharma"
                        value={deliveryReason}
                        onChange={(e) => setDeliveryReason(e.target.value)}
                        className="w-full p-2.5 bg-white border border-red-200 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <p className="text-[10px] text-gray-500">Whatever you enter here will be saved and shown to the customer on their order tracking page.</p>
                    </div>
                  )}

                  <label className="flex items-center gap-2 pt-2 border-t border-amber-200/80 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noOtpAvailable}
                      onChange={(e) => {
                        setNoOtpAvailable(e.target.checked);
                        if (e.target.checked) setDeliveryOtpInput('');
                        else setDeliveryReason('');
                      }}
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    />
                    <span>Customer doesn't have OTP? Provide Reason</span>
                  </label>
                </div>
              )}

              {newStatus === 'Out for Delivery' && (
                <div className="p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-400 dark:border-amber-500 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-gray-950 flex items-center justify-center font-black">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-amber-950">
                        Set Manual Delivery OTP for Customer *
                      </label>
                      <p className="text-[11px] text-amber-800">
                        Admin yahan jo bhi manual OTP daalega (jo man karega vah), wahi customer ko dikhega. System automatic OTP nahi banata.
                      </p>
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter manual OTP (e.g. 1234, 7860, 4589, 9999)"
                    value={outForDeliveryOtp}
                    onChange={(e) => setOutForDeliveryOtp(e.target.value.trim())}
                    className="w-full p-3 bg-white border border-amber-300 rounded-xl font-mono text-center text-xl font-black tracking-widest text-amber-950 outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                    autoFocus
                  />
                </div>
              )}
              <textarea
                placeholder="Add internal notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
              />
              <button 
                onClick={updateStatus}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
              >
                Update Status
              </button>
            </div>
          </div>

          {order.paymentMethod === 'UPI' && order.paymentStatus !== 'Verified' && (
            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
              <h3 className="font-bold text-amber-900 mb-4">Payment Verification</h3>
              <p className="text-xs text-amber-700 mb-4">
                Submitted UTR: <span className="font-mono font-bold select-all">{order.utrReference || 'N/A'}</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => verifyPayment('Verified')}
                  className="bg-green-600 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-green-700"
                >
                  Verify Payment
                </button>
                <button 
                  onClick={() => verifyPayment('Failed')}
                  className="bg-red-600 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-red-700"
                >
                  Mark Failed
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChangeRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const token = localStorage.getItem('dashboard_token');
    const res = await fetch('/api/dashboard/change-requests', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setRequests(data);
    setLoading(false);
  };

  const handleRespond = async (requestId: number, status: 'approved' | 'rejected', type?: string) => {
    const defaultPrompt = type === 'replacement'
      ? status === 'approved' 
        ? 'Enter admin notes (e.g. Replacement package dispatched or approved):' 
        : 'Enter reason for declining replacement:'
      : `Enter notes for this ${status} (optional):`;
    const adminNotes = prompt(defaultPrompt) || '';
    const token = localStorage.getItem('dashboard_token');
    const res = await fetch(`/api/dashboard/change-requests/${requestId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status, adminNotes })
    });
    if (res.ok) {
      toast.success(type === 'replacement' ? `Replacement ${status === 'approved' ? 'Accepted' : 'Declined'}` : `Request ${status}`);
      fetchRequests();
    }
  };

  if (loading) return <div className="p-8">Loading requests...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white dark:text-white">Order Change & Replacement Requests</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Review customer requests for cancellations, address/mobile updates, and product replacements.</p>
        </div>
        <button onClick={fetchRequests} className="px-3.5 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-100 flex items-center gap-1.5 cursor-pointer">
          <RefreshCcw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 dark:bg-gray-850 border-b dark:border-gray-800">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Order</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Current Info</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Requested Info / Proof</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {requests.map((item: any) => (
                <tr key={item.request.id} className="hover:bg-gray-50 dark:bg-gray-800/70 dark:hover:bg-gray-800/40">
                  <td className="px-6 py-4">
                    <Link to={`/dashboard/orders/${item.order.id}`} className="text-sm font-bold text-indigo-600 hover:underline">
                      {item.order.orderNumber}
                    </Link>
                    <p className="text-[10px] text-gray-400">{format(new Date(item.request.createdAt), 'dd MMM, hh:mm a')}</p>
                    <p className="text-[11px] font-medium text-gray-500 mt-0.5">{item.order.customerName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      item.request.type === 'replacement' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300' :
                      item.request.type === 'cancel' ? 'bg-red-50 text-red-600 border border-red-200' : 
                      item.request.type === 'return' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                      'bg-blue-50 text-blue-600 border border-blue-200'
                    }`}>
                      {item.request.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs max-w-[220px]">
                    {item.request.type === 'replacement' && (
                      <div className="space-y-1">
                        <p className="font-bold text-gray-800 dark:text-gray-100 dark:text-white line-clamp-1">{item.order.productSnapshot?.name}</p>
                        <p className="text-gray-500 font-mono text-[11px]">+91 {item.order.customerMobile}</p>
                        <span className="text-[10px] font-bold text-indigo-600">Status: {item.order.orderStatus}</span>
                      </div>
                    )}
                    {item.request.type === 'address' && (
                      <p className="truncate">{item.order.address?.house}, {item.order.address?.street}</p>
                    )}
                    {item.request.type === 'mobile' && (
                      <p className="font-mono">{item.order.customerMobile}</p>
                    )}
                    {(item.request.type === 'cancel' || item.request.type === 'return') && (
                      <p className="text-gray-500 text-[11px]">Current Status: {item.order.orderStatus}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs max-w-[280px]">
                    {item.request.type === 'replacement' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300">
                            {item.request.requestedValue?.reason}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300 text-xs italic bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 p-2 rounded-lg border dark:border-gray-700">
                          "{item.request.requestedValue?.description}"
                        </p>
                        {item.request.requestedValue?.photoUrl && (
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => setSelectedPhotoModal(item.request.requestedValue.photoUrl)}
                              className="relative group w-12 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 dark:border-gray-700 hover:ring-2 hover:ring-indigo-500 cursor-pointer"
                              title="Click to view photo proof"
                            >
                              <img src={item.request.requestedValue.photoUrl} alt="Defect proof" className="w-full h-full object-cover" />
                              <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 text-white text-[9px] font-bold">
                                View
                              </span>
                            </button>
                            <span className="text-[10px] text-gray-500 font-medium">Defect Photo Attached</span>
                          </div>
                        )}
                        {item.request.requestedValue?.reason === 'Empty Box Received' && (
                          <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md border border-emerald-200">
                            <span>📦 Box MT: Unboxing video required via WhatsApp (+91 7004664741)</span>
                          </div>
                        )}
                      </div>
                    )}
                    {item.request.type === 'address' && (
                      <p className="font-bold">{item.request.requestedValue?.house}, {item.request.requestedValue?.street}, {item.request.requestedValue?.city}</p>
                    )}
                    {item.request.type === 'mobile' && (
                      <p className="font-bold font-mono">{item.request.requestedValue?.mobile}</p>
                    )}
                    {item.request.type === 'cancel' && (
                      <p className="text-red-600 font-bold">Customer requesting cancellation</p>
                    )}
                    {item.request.type === 'return' && (
                      <p className="text-amber-600 font-bold">Return Reason: {item.request.requestedValue?.reason}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      item.request.status === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                      item.request.status === 'approved' ? 'bg-green-100 text-green-700 border border-green-300' :
                      'bg-red-100 text-red-700 border border-red-300'
                    }`}>
                      {item.request.status}
                    </span>
                    {item.request.adminNotes && (
                      <p className="text-[10px] text-gray-400 mt-1 italic">Note: {item.request.adminNotes}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {item.request.status === 'pending' && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleRespond(item.request.id, 'approved', item.request.type)} 
                          className="px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-xs font-bold border border-green-200 flex items-center gap-1 cursor-pointer"
                          title="Accept Request"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Accept</span>
                        </button>
                        <button 
                          onClick={() => handleRespond(item.request.id, 'rejected', item.request.type)} 
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-200 flex items-center gap-1 cursor-pointer"
                          title="Decline Request"
                        >
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span>Decline</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-bold">No change requests found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Proof Preview Modal */}
      {selectedPhotoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border dark:border-gray-800">
            <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white dark:text-white">Customer Defect Photo Proof</h3>
              <button onClick={() => setSelectedPhotoModal(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full cursor-pointer">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-gray-50 dark:bg-gray-800 dark:bg-gray-950">
              <img src={selectedPhotoModal} alt="Customer Defect Proof" className="max-h-[60vh] object-contain rounded-xl shadow" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductsManagement() {
  const [products, setProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [productFormTab, setProductFormTab] = useState<'basic' | 'specs' | 'settings'>('basic');
  const [specsState, setSpecsState] = useState<Record<string, Record<string, string>>>({});
  const [activeSpecGroup, setActiveSpecGroup] = useState<string>(SMARTWATCH_SPEC_GROUPS[0].title);
  const [customSpecKey, setCustomSpecKey] = useState('');
  const [customSpecValue, setCustomSpecValue] = useState('');
  const [customSpecSection, setCustomSpecSection] = useState('General & Design');
  const [isReturnable, setIsReturnable] = useState<boolean>(true);
  const [productImagesList, setProductImagesList] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Controlled Form Fields State (Instant AI auto-fill + full manual editing)
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stockCount, setStockCount] = useState('10');
  const [productCategory, setProductCategory] = useState('Smart Watch');
  const [selectedColorsList, setSelectedColorsList] = useState<string[]>([]);
  const [selectedSizesList, setSelectedSizesList] = useState<string[]>([]);
  const [badgeValue, setBadgeValue] = useState('');
  const [availabilityVal, setAvailabilityVal] = useState(true);
  const [isPublishedVal, setIsPublishedVal] = useState(true);

  // AI Auto-Fill State
  const [aiUrlInput, setAiUrlInput] = useState('');
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiTimerSeconds, setAiTimerSeconds] = useState(0);
  const [aiScanStep, setAiScanStep] = useState('');
  const [aiSuccessBanner, setAiSuccessBanner] = useState<{ message: string; time: number } | null>(null);

  const toggleColor = (color: string) => {
    setSelectedColorsList(prev => 
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizesList(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const allAvailableColors = useMemo(() => {
    const defaults = ['Black', 'Orange', 'Silver', 'Ocean Blue', 'Titanium Gold', 'Green', 'White', 'Yellow', 'Red'];
    const custom = selectedColorsList.filter(c => !defaults.includes(c));
    return [...defaults, ...custom];
  }, [selectedColorsList]);

  const allAvailableSizes = useMemo(() => {
    const defaults = ['49mm', '45mm', '44mm', '41mm', 'Free Size', 'S', 'M', 'L'];
    const custom = selectedSizesList.filter(s => !defaults.includes(s));
    return [...defaults, ...custom];
  }, [selectedSizesList]);

  const handleAiExtractFromUrl = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl || aiUrlInput).trim();
    if (!targetUrl) {
      toast.error('Kripya Flipkart ya kisi bhi product ka link paste karein');
      return;
    }

    setIsAiScanning(true);
    setAiTimerSeconds(0);
    setAiSuccessBanner(null);
    setAiScanStep('Flipkart product link connect ho raha hai...');

    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setAiTimerSeconds(prev => +(prev + 0.5).toFixed(1));
    }, 500);

    const stepInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > 2 && elapsed <= 5) {
        setAiScanStep('Gemini AI Title, Price & MRP scan kar raha hai...');
      } else if (elapsed > 5 && elapsed <= 10) {
        setAiScanStep('Product Specifications, Colors & Sizes parse ho rahe hain...');
      } else if (elapsed > 10) {
        setAiScanStep('Customer slide gallery ke liye multi-images load ho rahi hain...');
      }
    }, 1500);

    try {
      const token = localStorage.getItem('dashboard_token');
      const res = await fetch('/api/dashboard/products/ai-extract-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: targetUrl })
      });

      clearInterval(timerInterval);
      clearInterval(stepInterval);

      const elapsedFinal = +((Date.now() - startTime) / 1000).toFixed(1);
      const data = await res.json();

      if (!res.ok || !data.product) {
        throw new Error(data.error || 'Failed to extract product details from URL');
      }

      const p = data.product;

      // Auto-fill all form fields
      if (p.name) setProductName(p.name);
      if (p.description) setProductDesc(p.description);
      if (p.originalPrice) setOriginalPrice(String(p.originalPrice));
      if (p.sellingPrice) setSellingPrice(String(p.sellingPrice));
      if (p.stock !== undefined) setStockCount(String(p.stock));
      if (p.category) setProductCategory(p.category);
      if (Array.isArray(p.colors) && p.colors.length > 0) setSelectedColorsList(p.colors);
      if (Array.isArray(p.sizes) && p.sizes.length > 0) setSelectedSizesList(p.sizes);
      if (p.badge) setBadgeValue(p.badge);
      if (p.isReturnable !== undefined) setIsReturnable(p.isReturnable);

      // Auto-fill multi-images (2+ for slider)
      if (Array.isArray(p.images) && p.images.length > 0) {
        setProductImagesList(p.images);
      } else if (p.imageUrl) {
        setProductImagesList([p.imageUrl]);
      }

      // Auto-fill specs
      if (p.specifications && typeof p.specifications === 'object') {
        setSpecsState(p.specifications);
      }

      setAiSuccessBanner({
        message: `✨ Product details successfully auto-filled in ${elapsedFinal}s! (Flipkart se details bhar di gayi hain)`,
        time: elapsedFinal
      });

      toast.success(`⚡ AI ने ${elapsedFinal}s में प्रोडक्ट डिटेल्स भर दी! आप नीचे चेक या एडिट कर सकते हैं।`);
    } catch (err: any) {
      clearInterval(timerInterval);
      clearInterval(stepInterval);
      console.error('AI Extraction error:', err);
      toast.error(err.message || 'AI scan nahi kar paya. Aap khud se details bhar sakte hain.');
    } finally {
      setIsAiScanning(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => filterCategory === 'All' || p.category === filterCategory);
  }, [products, filterCategory]);

  const categories = [
    'All', 'Smart Watch', 'Android Smart Watch', 'Sarees', 'Kurtis & Suits', 'Beauty', 'Home Decor', 
    'MEN Fashion', 'Kids', 'Kitchen', 'Jewellery', 'Bag & Accessories', 
    'Innerwear', 'Footwear', 'Healthcare', 'Lehengas & Blouses', 
    'Case & Cover', 'Furniture', 'Sports & Fitness', 'General'
  ];

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= 640) {
        setIsVisible(true);
        return;
      }
      
      const currentScrollY = window.scrollY;
      setLastScrollY(prev => {
        if (currentScrollY > prev && currentScrollY > 50) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        return currentScrollY;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const token = localStorage.getItem('dashboard_token');
    const res = await fetch('/api/dashboard/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setProducts(data);
  };

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductName('');
    setProductDesc('');
    setOriginalPrice('');
    setSellingPrice('');
    setStockCount('10');
    setProductCategory('Smart Watch');
    setSelectedColorsList([]);
    setSelectedSizesList([]);
    setBadgeValue('');
    setAvailabilityVal(true);
    setIsPublishedVal(true);
    setSpecsState({});
    setIsReturnable(true);
    setProductImagesList([]);
    setImageUrlInput('');
    setAiUrlInput('');
    setAiSuccessBanner(null);
    setProductFormTab('basic');
    setActiveSpecGroup(SMARTWATCH_SPEC_GROUPS[0].title);
    setShowForm(true);
  };

  const openEditProductModal = (product: any) => {
    setEditingProduct(product);
    setProductName(product.name || '');
    setProductDesc(product.description || '');
    setOriginalPrice(product.originalPrice !== undefined ? String(product.originalPrice) : '');
    setSellingPrice(product.sellingPrice !== undefined ? String(product.sellingPrice) : '');
    setStockCount(product.stock !== undefined ? String(product.stock) : '10');
    setProductCategory(product.category || 'Smart Watch');
    setSelectedColorsList(Array.isArray(product.colors) ? product.colors : []);
    setSelectedSizesList(Array.isArray(product.sizes) ? product.sizes : []);
    setBadgeValue(product.badge || '');
    setAvailabilityVal(product.availability !== false);
    setIsPublishedVal(product.isPublished !== false);
    setSpecsState(product.specifications || {});
    setIsReturnable(product.isReturnable !== false);
    const existingImgs = Array.isArray(product.images) && product.images.length > 0 
      ? product.images 
      : (product.imageUrl ? [product.imageUrl] : []);
    setProductImagesList(existingImgs);
    setImageUrlInput('');
    setAiUrlInput('');
    setAiSuccessBanner(null);
    setProductFormTab('basic');
    setActiveSpecGroup(SMARTWATCH_SPEC_GROUPS[0].title);
    setShowForm(true);
  };

  const handleSpecChange = (sectionTitle: string, fieldKey: string, value: string) => {
    setSpecsState(prev => {
      const section = { ...(prev[sectionTitle] || {}) };
      if (value.trim() === '') {
        delete section[fieldKey];
      } else {
        section[fieldKey] = value;
      }
      return {
        ...prev,
        [sectionTitle]: section
      };
    });
  };

  const fillSampleWatchSpecs = () => {
    setSpecsState(SAMPLE_ANDROID_SMARTWATCH_SPECS);
    toast.success('Loaded Ultra 4G Smart Watch sample specs! You can edit any value or leave fields blank.');
  };

  const clearAllSpecs = () => {
    if (confirm('Clear all specifications?')) {
      setSpecsState({});
      toast.success('Cleared all specifications');
    }
  };

  const addCustomSpec = () => {
    if (!customSpecKey.trim() || !customSpecValue.trim()) {
      toast.error('Please enter both specification name and value');
      return;
    }
    handleSpecChange(customSpecSection, customSpecKey.trim(), customSpecValue.trim());
    setCustomSpecKey('');
    setCustomSpecValue('');
    toast.success(`Added spec: ${customSpecKey.trim()}`);
  };

  const removeSpecField = (sectionTitle: string, fieldKey: string) => {
    setSpecsState(prev => {
      const updated = { ...prev };
      if (updated[sectionTitle]) {
        const sec = { ...updated[sectionTitle] };
        delete sec[fieldKey];
        if (Object.keys(sec).length === 0) {
          delete updated[sectionTitle];
        } else {
          updated[sectionTitle] = sec;
        }
      }
      return updated;
    });
  };

  const countFilledSpecs = () => {
    let count = 0;
    Object.values(specsState).forEach(sec => {
      Object.values(sec).forEach(val => {
        if (val && String(val).trim() !== '') count++;
      });
    });
    return count;
  };

  const handleFileUpload = async (files: FileList) => {
    const token = localStorage.getItem('dashboard_token');
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('images', file));
    
    setUploading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) return data.urls;
      throw new Error(data.error);
    } catch (err) {
      toast.error('Image upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    const urls = imageUrlInput
      .split(/[\n,]/)
      .map(u => u.trim())
      .filter(u => u.length > 0);
    if (urls.length > 0) {
      setProductImagesList(prev => [...prev, ...urls]);
      setImageUrlInput('');
      toast.success(`Added ${urls.length} image(s)`);
    }
  };

  const handleRemoveImageItem = (index: number) => {
    setProductImagesList(prev => prev.filter((_, i) => i !== index));
    toast.success('Image removed from list');
  };

  const handleMultipleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const urls = await handleFileUpload(files);
    if (urls && urls.length > 0) {
      setProductImagesList(prev => [...prev, ...urls]);
      toast.success(`${urls.length} image(s) uploaded successfully!`);
      e.target.value = '';
    }
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const formValues = Object.fromEntries(formData.entries());
    const token = localStorage.getItem('dashboard_token');

    let images = [...productImagesList];
    const imageFiles = (e.target.images as HTMLInputElement)?.files;
    
    if (imageFiles && imageFiles.length > 0) {
      const uploadedUrls = await handleFileUpload(imageFiles);
      if (uploadedUrls && uploadedUrls.length > 0) {
        images = [...images, ...uploadedUrls];
      }
    }

    // Deduplicate and filter non-empty strings
    images = Array.from(new Set(images.map(s => typeof s === 'string' ? s.trim() : '').filter(Boolean)));
    const mainImageUrl = images[0] || editingProduct?.imageUrl || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop';
    if (images.length === 0) {
      images = [mainImageUrl];
    }

    const selectedColors = selectedColorsList.length > 0 
      ? selectedColorsList 
      : Array.from(e.target.querySelectorAll('input[name="selectedColors"]:checked')).map((el: any) => el.value);

    const selectedSizes = selectedSizesList.length > 0 
      ? selectedSizesList 
      : Array.from(e.target.querySelectorAll('input[name="selectedSizes"]:checked')).map((el: any) => el.value);

    // Clean specifications so empty fields are removed
    const cleanedSpecs = cleanSpecifications(specsState);

    const payload = {
      ...formValues,
      name: productName.trim() || formValues.name,
      description: productDesc.trim() || formValues.description,
      originalPrice: originalPrice ? parseFloat(originalPrice) : parseFloat(formValues.originalPrice as string) || 0,
      sellingPrice: sellingPrice ? parseFloat(sellingPrice) : parseFloat(formValues.sellingPrice as string) || 0,
      category: productCategory || formValues.category,
      imageUrl: mainImageUrl,
      images,
      colors: selectedColors,
      sizes: selectedSizes,
      badge: badgeValue || formValues.badge || null,
      stock: parseInt(stockCount || (formValues.stock as string)) || (Math.floor(Math.random() * 10) + 1),
      platformFee: formValues.platformFee || '0',
      availability: availabilityVal,
      isPublished: isPublishedVal,
      isReturnable: isReturnable,
      specifications: cleanedSpecs
    };

    const url = editingProduct ? `/api/dashboard/products/${editingProduct.id}` : '/api/dashboard/products';
    const method = editingProduct ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      toast.success(editingProduct ? 'Product updated successfully' : 'Product added successfully');
      setEditingProduct(null);
      setShowForm(false);
      fetchProducts();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.details || data.error || 'Failed to save product');
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const token = localStorage.getItem('dashboard_token');
    try {
      const res = await fetch(`/api/dashboard/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Product deleted successfully');
        setProducts((prev: any) => prev.filter((p: any) => p.id !== id));
        setSelectedProducts(prev => prev.filter(pId => pId !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.details || data.error || 'Failed to delete product');
      }
    } catch (err) {
      toast.error('Connection error. Please try again.');
    }
  };

  const deleteAllProducts = async () => {
    if (!confirm('⚠️ Are you sure you want to DELETE ALL PRODUCTS? All listed products will be permanently removed!')) return;
    const token = localStorage.getItem('dashboard_token');
    try {
      const res = await fetch('/api/dashboard/products/all', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('All products deleted successfully');
        setProducts([]);
        setSelectedProducts([]);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.details || data.error || 'Failed to delete all products');
      }
    } catch (err) {
      toast.error('Connection error. Please try again.');
    }
  };

  const bulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;
    
    const token = localStorage.getItem('dashboard_token');
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedProducts) {
      try {
        const res = await fetch(`/api/dashboard/products/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) successCount++;
        else failCount++;
      } catch (err) {
        failCount++;
      }
    }

    if (successCount > 0) toast.success(`${successCount} products deleted`);
    if (failCount > 0) toast.error(`${failCount} products failed to delete`);
    
    setSelectedProducts([]);
    fetchProducts();
  };

  const updateBulkVisibility = async (isPublished: boolean) => {
    if (selectedProducts.length === 0) return;
    const token = localStorage.getItem('dashboard_token');
    const res = await fetch('/api/dashboard/products/bulk-visibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ ids: selectedProducts, isPublished })
    });
    if (res.ok) {
      toast.success(`${selectedProducts.length} products ${isPublished ? 'unhidden' : 'hidden'}`);
      setSelectedProducts([]);
      fetchProducts();
    }
  };

  const toggleVisibility = async (product: any) => {
    const token = localStorage.getItem('dashboard_token');
    const res = await fetch(`/api/dashboard/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ ...product, isPublished: !product.isPublished })
    });
    if (res.ok) {
      toast.success(`Product ${!product.isPublished ? 'visible' : 'hidden'}`);
      fetchProducts();
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const filtered = products.filter((p: any) => filterCategory === 'All' || p.category === filterCategory);
    const filteredIds = filtered.map((p: any) => p.id);
    setSelectedProducts(prev => {
      const allSelected = filteredIds.every(id => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !filteredIds.includes(id));
      } else {
        return [...new Set([...prev, ...filteredIds])];
      }
    });
  };

  const updateAllVisibility = async (isPublished: boolean) => {
    if (!confirm(`Are you sure you want to ${isPublished ? 'SHOW' : 'HIDE'} ALL products from customers?`)) return;
    const token = localStorage.getItem('dashboard_token');
    const res = await fetch('/api/dashboard/products/visibility-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ isPublished })
    });
    if (res.ok) {
      toast.success(`All products ${isPublished ? 'unhidden' : 'hidden'}`);
      fetchProducts();
    }
  };

  const getIconForGroup = (iconName: string) => {
    switch (iconName) {
      case 'Watch': return Watch;
      case 'Monitor': return Monitor;
      case 'Cpu': return Cpu;
      case 'Wifi': return Wifi;
      case 'Camera': return Camera;
      case 'Battery': return Battery;
      case 'Activity': return Activity;
      case 'Sparkles': return Sparkles;
      default: return Package;
    }
  };

  return (
    <div className="p-8">
      <div className={`flex flex-col space-y-6 mb-8 transition-all duration-300 sticky top-0 z-40 bg-gray-50 dark:bg-gray-800/80 dark:bg-gray-950/80 backdrop-blur-md py-4 -mx-8 px-8 border-b dark:border-gray-800 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white dark:text-white transition-colors">Product Management</h1>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
              {products.length} Products
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
            <button 
              onClick={selectAllFiltered}
              className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
            >
              {products.filter((p: any) => filterCategory === 'All' || p.category === filterCategory).every((p: any) => selectedProducts.includes(p.id)) ? 'Deselect All' : 'Select All'}
            </button>
            <button 
              onClick={() => updateAllVisibility(false)}
              className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all"
            >
              Hide All
            </button>
            <button 
              onClick={() => updateAllVisibility(true)}
              className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-teal-500 hover:text-white transition-all"
            >
              Show All
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl px-3 py-1.5 shadow-sm">
              <Filter className="w-4 h-4 text-gray-400" />
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-gray-700 dark:text-gray-300 dark:text-gray-300 min-w-[140px]"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          {selectedProducts.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-indigo-600 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
              <span className="text-[10px] font-black text-white px-2 uppercase tracking-widest">
                {selectedProducts.length} Selected
              </span>
              <div className="h-4 w-[1px] bg-indigo-400/50" />
              <button 
                onClick={() => updateBulkVisibility(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
              >
                <EyeOff className="w-3 h-3" /> Hide
              </button>
              <button 
                onClick={() => updateBulkVisibility(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
              >
                <Eye className="w-3 h-3" /> Show
              </button>
              <button 
                onClick={bulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
              <button 
                onClick={() => setSelectedProducts([])}
                className="p-1.5 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={openAddProductModal}
            className="flex-grow sm:flex-grow-0 bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:brightness-110 active:scale-95 text-white px-5 py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
            title="Flipkart ya kisi bhi link se AI se 1 minute ke andar details auto-fill karein"
          >
            <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
            <span>⚡ AI Link Auto-Fill (Flipkart)</span>
          </button>

          <button 
            onClick={openAddProductModal}
            className="flex-grow sm:flex-grow-0 bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-100 dark:shadow-none"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
          
          <button 
            onClick={deleteAllProducts}
            className="flex-grow sm:flex-grow-0 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all shadow-sm"
            title="Delete all products from database"
          >
            <Trash2 className="w-4 h-4" /> Delete All Products
          </button>

          {selectedProducts.length > 0 && (
            <button 
              onClick={bulkDelete}
              className="flex-grow sm:flex-grow-0 bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
            >
              <Trash2 className="w-4 h-4" /> Delete Selected ({selectedProducts.length})
            </button>
          )}
          {selectedProducts.length > 0 && (
            <>
              <button 
                onClick={() => updateBulkVisibility(false)}
                className="flex-grow sm:flex-grow-0 bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-700 transition-colors shadow-lg shadow-amber-100"
              >
                <EyeOff className="w-4 h-4" /> Hide
              </button>
              <button 
                onClick={() => updateBulkVisibility(true)}
                className="flex-grow sm:flex-grow-0 bg-teal-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors shadow-lg shadow-teal-100"
              >
                <Eye className="w-4 h-4" /> Unhide
              </button>
            </>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-gray-100 dark:border-gray-800 dark:border-gray-800 transition-colors">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b dark:border-gray-800 flex justify-between items-center transition-colors bg-gray-50 dark:bg-gray-800/50 dark:bg-gray-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Watch className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-black text-xl text-gray-900 dark:text-white dark:text-white">
                    {editingProduct ? 'Edit Product & Specifications' : 'Add New Product & Watch Specifications'}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {editingProduct ? `Editing ID #${editingProduct.id}` : 'Fill product info and watch specs. Details left blank won\'t be shown to customers.'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </button>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b dark:border-gray-800 bg-white dark:bg-gray-900 overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setProductFormTab('basic')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                  productFormTab === 'basic' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Package className="w-4 h-4" />
                1. Basic Info & Pricing
              </button>
              <button
                type="button"
                onClick={() => setProductFormTab('specs')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                  productFormTab === 'specs' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Watch className="w-4 h-4" />
                2. Smart Watch Specs
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  productFormTab === 'specs' ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                }`}>
                  {countFilledSpecs()} Filled
                </span>
              </button>
              <button
                type="button"
                onClick={() => setProductFormTab('settings')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                  productFormTab === 'settings' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Sliders className="w-4 h-4" />
                3. Additional Options & Visibility
              </button>
            </div>

            {/* Main Form Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto flex flex-col justify-between">
              <div className="p-6 space-y-6">

                {/* TAB 1: BASIC INFO & PRICING */}
                <div className={productFormTab === 'basic' ? 'space-y-5' : 'hidden'}>

                  {/* AI URL AUTO-FILL 1-MINUTE CARD */}
                  <div className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white shadow-xl border border-indigo-500/40">
                    <div className="relative z-10 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-orange-500/30 shrink-0">
                            <Sparkles className="w-5 h-5 text-white animate-pulse" />
                          </div>
                          <div>
                            <h3 className="font-black text-sm sm:text-base flex items-center gap-2 text-white">
                              ⚡ AI 1-Minute Auto-Fill from Flipkart Link
                              <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                                &lt; 1 Min Scan
                              </span>
                            </h3>
                            <p className="text-xs text-indigo-200/90 mt-0.5">
                              Flipkart se kisi bhi product ka link copy karein aur yahan paste karke 1 minute ke andar sari details auto-fill karwayen. Jo AI na bhar paye, use aap niche khud edit/bhar sakte hain!
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* URL Input & Scan Action */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <input
                            type="url"
                            value={aiUrlInput}
                            onChange={(e) => setAiUrlInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAiExtractFromUrl();
                              }
                            }}
                            placeholder="Paste Flipkart or any product link (e.g. https://www.flipkart.com/...)"
                            className="w-full pl-3.5 pr-10 py-2.5 bg-black/40 border border-indigo-400/40 rounded-xl text-white placeholder-indigo-300/50 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                            disabled={isAiScanning}
                          />
                          {aiUrlInput && !isAiScanning && (
                            <button
                              type="button"
                              onClick={() => setAiUrlInput('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAiExtractFromUrl()}
                          disabled={isAiScanning || !aiUrlInput.trim()}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 active:scale-95 disabled:opacity-50 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all shrink-0 cursor-pointer"
                        >
                          {isAiScanning ? (
                            <>
                              <RefreshCcw className="w-4 h-4 animate-spin text-white" />
                              <span>Scanning ({aiTimerSeconds}s / 60s)...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 fill-white" />
                              <span>⚡ Auto-Fill Details (AI)</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Live Scanning Progress */}
                      {isAiScanning && (
                        <div className="p-3 bg-white/10 rounded-2xl border border-white/10 space-y-2 animate-fadeIn">
                          <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                              {aiScanStep}
                            </span>
                            <span className="font-mono text-white bg-black/50 px-2.5 py-0.5 rounded-lg text-[11px] font-black border border-white/10">
                              ⏱️ {aiTimerSeconds}s / 60s
                            </span>
                          </div>
                          <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-400 transition-all duration-300 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(5, (aiTimerSeconds / 60) * 100))}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Auto-fill Success Celebration Banner */}
                      {aiSuccessBanner && !isAiScanning && (
                        <div className="p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl flex items-center justify-between gap-2 text-emerald-200 text-xs font-bold">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{aiSuccessBanner.message}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAiSuccessBanner(null)}
                            className="text-emerald-300/70 hover:text-white p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* FORM FIELDS - FULLY EDITABLE BY ADMIN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Product Name *</label>
                        <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold">(Editable by Admin)</span>
                      </div>
                      <input 
                        name="name" 
                        required 
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g. Ultra 4G Android Smartwatch with Nano SIM & Camera" 
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white dark:text-white transition-all text-sm font-bold" 
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Product Description</label>
                        <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold">(Editable by Admin)</span>
                      </div>
                      <textarea 
                        name="description" 
                        rows={3} 
                        value={productDesc}
                        onChange={(e) => setProductDesc(e.target.value)}
                        placeholder="Product highlights, special features, key selling points..." 
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white dark:text-white transition-all text-sm" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Original Price / MRP (₹) *</label>
                      <input 
                        name="originalPrice" 
                        type="number" 
                        step="0.01" 
                        required 
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        placeholder="e.g. 4999" 
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white dark:text-white font-bold" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Selling / Offer Price (₹) *</label>
                      <input 
                        name="sellingPrice" 
                        type="number" 
                        step="0.01" 
                        required 
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        placeholder="e.g. 2499" 
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-600 dark:text-indigo-400 font-black text-lg" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Stock Count *</label>
                      <input 
                        name="stock" 
                        type="number" 
                        required 
                        value={stockCount}
                        onChange={(e) => setStockCount(e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white dark:text-white font-bold" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Category *</label>
                      <select 
                        name="category" 
                        value={productCategory}
                        onChange={(e) => setProductCategory(e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white dark:text-white font-bold text-sm"
                        required
                      >
                        {categories.filter(c => c !== 'All').map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available Colors</label>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">({selectedColorsList.length} selected)</span>
                      </div>
                      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl">
                        {allAvailableColors.map(color => (
                          <label key={color} className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer transition-colors ${
                            selectedColorsList.includes(color)
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold'
                              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-850 text-gray-700 dark:text-gray-300 dark:text-gray-300'
                          }`}>
                            <input 
                              type="checkbox" 
                              name="selectedColors" 
                              value={color} 
                              checked={selectedColorsList.includes(color)}
                              onChange={() => toggleColor(color)}
                              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <span className="text-xs">{color}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dial Size / Strap Sizes</label>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">({selectedSizesList.length} selected)</span>
                      </div>
                      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl">
                        {allAvailableSizes.map(size => (
                          <label key={size} className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer transition-colors ${
                            selectedSizesList.includes(size)
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold'
                              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-850 text-gray-700 dark:text-gray-300 dark:text-gray-300'
                          }`}>
                            <input 
                              type="checkbox" 
                              name="selectedSizes" 
                              value={size} 
                              checked={selectedSizesList.includes(size)}
                              onChange={() => toggleSize(size)}
                              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <span className="text-xs">{size}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="col-span-2 space-y-2 p-4 bg-gray-50 dark:bg-gray-800/80 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 dark:border-gray-700">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <label className="text-xs font-black text-gray-900 dark:text-white dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Images className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            Product Images (2 या अधिक इमेज अपलोड करें - स्लाइडर इनेबल होगा)
                          </label>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            Admin 2 ya 2 se adhik image upload karega to customer side se slide kar ke dekh payenge.
                          </p>
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                          productImagesList.length >= 2 
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' 
                            : productImagesList.length === 1 
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' 
                              : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {productImagesList.length >= 2 ? (
                            <>✓ {productImagesList.length} Images (Slider Active)</>
                          ) : (
                            <>{productImagesList.length} Image {productImagesList.length === 1 ? '(Add 1+ more for slider)' : '(No image yet)'}</>
                          )}
                        </span>
                      </div>

                      {/* Image Preview Grid with Remove buttons */}
                      {productImagesList.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                            Current Images ({productImagesList.length}) - 1st is Cover Image
                          </p>
                          <div className="flex flex-wrap gap-2.5">
                            {productImagesList.map((url: string, idx: number) => (
                              <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
                                <img 
                                  src={url} 
                                  className="w-full h-full object-cover" 
                                  alt={`Product image ${idx + 1}`} 
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop';
                                  }}
                                />
                                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold">
                                  #{idx + 1}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImageItem(idx)}
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-90 hover:opacity-100 hover:scale-110 transition-all shadow"
                                  title="Remove image"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* File Upload Button */}
                      <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700/80 dark:border-gray-700/80">
                        <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                          Option 1: Upload Multiple Image Files (Phone / PC se Select Karein)
                        </label>
                        <input 
                          name="images" 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          onChange={handleMultipleFilesUpload}
                          className="block w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 transition-all cursor-pointer" 
                        />
                      </div>

                      {/* Image URL Input Option */}
                      <div className="space-y-1 pt-2">
                        <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                          Option 2: Add Image URL (Direct Link Paste Karein)
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="url"
                            value={imageUrlInput}
                            onChange={(e) => setImageUrlInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddImageUrl();
                              }
                            }}
                            placeholder="https://example.com/product-image.jpg"
                            className="flex-grow p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={handleAddImageUrl}
                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add URL
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Return Policy Selection (Returnable vs Non-Returnable) */}
                    <div className="col-span-2 p-4 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 dark:border-gray-700 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <label className="text-xs font-black text-gray-900 dark:text-white dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                            <RotateCcw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            Return Policy (रिटर्न पॉलिसी) *
                          </label>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            Select whether customers are allowed to return this product after delivery
                          </p>
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                          isReturnable 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' 
                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        }`}>
                          {isReturnable ? <><CheckCircle2 className="w-3 h-3" /> Return Allowed (7 Days)</> : <><Ban className="w-3 h-3" /> No Return (Blocked)</>}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {/* Option 1: Returnable */}
                        <div 
                          onClick={() => setIsReturnable(true)}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                            isReturnable 
                              ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-sm' 
                              : 'border-gray-200 dark:border-gray-700 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="returnPolicyRadio" 
                            checked={isReturnable} 
                            onChange={() => setIsReturnable(true)}
                            className="w-4 h-4 text-indigo-600 mt-0.5 cursor-pointer"
                          />
                          <div>
                            <p className="text-xs font-black text-gray-900 dark:text-white dark:text-white flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> 7 Days Easy Return
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                              Customer delivery ke baad 7 dino ke andar return / refund request kar sakta hai.
                            </p>
                          </div>
                        </div>

                        {/* Option 2: No Returnable */}
                        <div 
                          onClick={() => setIsReturnable(false)}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                            !isReturnable 
                              ? 'border-red-500 bg-red-50/80 dark:bg-red-950/40 dark:border-red-500 shadow-sm' 
                              : 'border-gray-200 dark:border-gray-700 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="returnPolicyRadio" 
                            checked={!isReturnable} 
                            onChange={() => setIsReturnable(false)}
                            className="w-4 h-4 text-red-600 mt-0.5 cursor-pointer"
                          />
                          <div>
                            <p className="text-xs font-black text-red-700 dark:text-red-400 flex items-center gap-1.5">
                              <Ban className="w-3.5 h-3.5 text-red-600" /> No Returnable (कोई रिटर्न नहीं)
                            </p>
                            <p className="text-[10px] text-red-600/80 dark:text-red-400/80 mt-0.5 leading-snug">
                              Customer ko dikhega ki is product par return nahi hai aur unka return option block ho jayega.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setProductFormTab('specs')}
                      className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                    >
                      Next: Watch Specifications <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* TAB 2: SMART WATCH SPECIFICATIONS */}
                <div className={productFormTab === 'specs' ? 'space-y-6' : 'hidden'}>
                  {/* Top Notification Banner */}
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
                        <Info className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-amber-900 dark:text-amber-200 font-medium">
                        <span className="font-bold">Admin jo details na dale wah customer ko nahi dikhegi:</span> Leave any field blank that you don't wish to specify. Only non-empty fields appear on the product page.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={fillSampleWatchSpecs}
                        className="flex-1 sm:flex-initial bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                        title="Pre-fill sample specifications for Ultra 4G watch"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> ⚡ Auto-Fill Sample Specs
                      </button>
                      <button
                        type="button"
                        onClick={clearAllSpecs}
                        className="bg-white dark:bg-gray-800 hover:bg-red-50 text-red-600 dark:text-red-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:border-gray-700 transition-all"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Spec Category Selector */}
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {SMARTWATCH_SPEC_GROUPS.map(group => {
                      const IconComp = getIconForGroup(group.iconName);
                      const isActive = activeSpecGroup === group.title;
                      const filledInGroup = Object.keys(specsState[group.title] || {}).length;

                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => setActiveSpecGroup(group.title)}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                          <span>{group.title}</span>
                          {filledInGroup > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                              isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}>
                              {filledInGroup}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Group Specification Fields */}
                  {SMARTWATCH_SPEC_GROUPS.filter(g => g.title === activeSpecGroup).map(group => {
                    const IconComp = getIconForGroup(group.iconName);
                    return (
                      <div key={group.id} className="bg-gray-50 dark:bg-gray-800/60 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-200 dark:border-gray-700/80 dark:border-gray-700/60 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 dark:border-gray-700 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="font-black text-sm text-gray-900 dark:text-white dark:text-white uppercase tracking-wider">{group.title}</h3>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400">{group.description}</p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-gray-400">
                            {Object.keys(specsState[group.title] || {}).length} of {group.fields.length} filled
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {group.fields.map(field => {
                            const val = specsState[group.title]?.[field.key] || '';
                            return (
                              <div key={field.key} className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 dark:text-gray-300 flex items-center justify-between">
                                  <span>{field.label}</span>
                                  {val && (
                                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">Filled</span>
                                  )}
                                </label>
                                <div className="relative">
                                  <input 
                                    type="text"
                                    value={val}
                                    onChange={(e) => handleSpecChange(group.title, field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                    className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white dark:text-white transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                  />
                                  {val && (
                                    <button 
                                      type="button" 
                                      onClick={() => removeSpecField(group.title, field.key)}
                                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-1"
                                      title="Clear this field"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Custom Spec Field Card */}
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <PlusCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-xs font-black text-gray-900 dark:text-white dark:text-white uppercase tracking-wider">
                        Add Extra Custom Specification Field
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <select
                        value={customSpecSection}
                        onChange={(e) => setCustomSpecSection(e.target.value)}
                        className="p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-100 dark:text-gray-200"
                      >
                        {SMARTWATCH_SPEC_GROUPS.map(g => (
                          <option key={g.title} value={g.title}>{g.title}</option>
                        ))}
                        <option value="Custom Details">Custom Details</option>
                      </select>

                      <input 
                        type="text"
                        value={customSpecKey}
                        onChange={(e) => setCustomSpecKey(e.target.value)}
                        placeholder="Spec Name (e.g. NFC, Fast Charging)"
                        className="p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white dark:text-white"
                      />

                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={customSpecValue}
                          onChange={(e) => setCustomSpecValue(e.target.value)}
                          placeholder="Value (e.g. Yes, 15W)"
                          className="flex-1 p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={addCustomSpec}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl text-xs font-black transition-all shrink-0"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setProductFormTab('basic')}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white dark:hover:text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Basic Info
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductFormTab('settings')}
                      className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                    >
                      Next: Settings & Options <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* TAB 3: SETTINGS & VISIBILITY */}
                <div className={productFormTab === 'settings' ? 'space-y-4' : 'hidden'}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Shipping Charges (₹)</label>
                      <input name="shippingCharges" type="number" step="0.01" defaultValue={editingProduct?.shippingCharges || '0'} placeholder="0 for Free Delivery" className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white dark:text-white transition-all text-sm font-bold" />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Platform Fee (₹)</label>
                      <input name="platformFee" type="number" step="0.01" defaultValue={editingProduct?.platformFee || '0'} className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white dark:text-white transition-all text-sm font-bold" />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Initial Rating (1-5)</label>
                      <input name="averageRating" type="number" step="0.1" min="1" max="5" defaultValue={editingProduct?.averageRating || '4.8'} className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white dark:text-white font-bold" />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Product Badge (Optional)</label>
                      <select 
                        name="badge" 
                        value={badgeValue}
                        onChange={(e) => setBadgeValue(e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white dark:text-white font-bold text-sm"
                      >
                        <option value="">None</option>
                        <option value="Trending">Trending</option>
                        <option value="Bestseller">Bestseller</option>
                        <option value="Fancy Choice">Fancy Choice</option>
                        <option value="Recommended">Recommended</option>
                      </select>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Source URL (Admin Only)</label>
                      <input name="sourceUrl" placeholder="https://example.com/original-product" defaultValue={editingProduct?.sourceUrl} className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white dark:text-white text-xs font-mono" />
                    </div>

                    <div className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 dark:border-gray-700">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="availability" 
                          checked={availabilityVal} 
                          onChange={(e) => setAvailabilityVal(e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                        />
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-white dark:text-white">Available in Stock</p>
                          <p className="text-[10px] text-gray-500">Mark product as In Stock</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="isPublished" 
                          checked={isPublishedVal} 
                          onChange={(e) => setIsPublishedVal(e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                        />
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-white dark:text-white">Published in Store</p>
                          <p className="text-[10px] text-gray-500">Show to customers</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isReturnable} 
                          onChange={(e) => setIsReturnable(e.target.checked)} 
                          className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                        />
                        <div>
                          <p className={`text-xs font-black ${isReturnable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {isReturnable ? 'Return Allowed' : 'Non-Returnable'}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {isReturnable ? '7 Days return enabled' : 'Return option blocked'}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-start">
                    <button
                      type="button"
                      onClick={() => setProductFormTab('specs')}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white dark:hover:text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Specifications
                    </button>
                  </div>
                </div>

              </div>

              {/* Sticky Footer with Save Product Button (Accessible from any tab!) */}
              <div className="p-4 sm:p-6 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-800/80 dark:bg-gray-850 backdrop-blur-md flex items-center justify-between gap-4 shrink-0">
                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-400 hidden sm:inline">
                    {countFilledSpecs()} specifications configured
                  </span>
                  <button 
                    type="submit" 
                    disabled={uploading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> {uploading ? 'Uploading...' : editingProduct ? 'Update Product' : 'Save & Publish Product'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product: any) => (
          <div key={product.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 dark:border-gray-800 shadow-sm overflow-hidden group transition-colors">
            <div className="aspect-square relative">
              <img 
                src={product.imageUrl} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop';
                }}
              />
              <div className="absolute top-3 left-3">
                <input 
                  type="checkbox" 
                  checked={selectedProducts.includes(product.id)}
                  onChange={() => toggleSelect(product.id)}
                  className="w-5 h-5 rounded-lg border-2 border-white shadow-sm cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="absolute top-3 right-3 flex gap-2">
                <button onClick={() => toggleVisibility(product)} className={`p-2 backdrop-blur-sm rounded-xl shadow-lg transition-all ${product.isPublished ? 'bg-white/90 text-amber-600' : 'bg-amber-600 text-white'}`} title={product.isPublished ? 'Hide from Customers' : 'Show to Customers'}>
                  {product.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => openEditProductModal(product)} className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg text-indigo-600 dark:text-indigo-400 hover:scale-110 transition-transform"><Edit className="w-4 h-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); deleteProduct(product.id); }} className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg text-red-600 dark:text-red-400 hover:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></button>
              </div>
              {!product.isPublished && <div className="absolute inset-0 bg-black/20 pointer-events-none" />}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 dark:text-white dark:text-white line-clamp-1 transition-colors">{product.name}</h3>
              <div className="flex justify-between items-end mt-2">
                <p className="text-lg font-black text-gray-900 dark:text-white dark:text-white transition-colors">₹{parseFloat(product.sellingPrice).toLocaleString()}</p>
                <div className="text-right">
                  <p className={`text-[10px] font-bold ${product.availability ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {product.availability ? 'In Stock' : 'Out of Stock'}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                    {product.stock ?? 0} Left
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 dark:border-gray-800 flex items-center justify-between">
                {product.isReturnable === false ? (
                  <span className="text-[9px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-900/40 inline-flex items-center gap-1">
                    <Ban className="w-3 h-3" /> Non-Returnable
                  </span>
                ) : (
                  <span className="text-[9px] font-black uppercase tracking-wider text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-md border border-green-200 dark:border-green-900/40 inline-flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> 7 Days Return
                  </span>
                )}
                {product.badge && (
                  <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                    {product.badge}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CouponsManagement() {
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    const token = localStorage.getItem('dashboard_token');
    const res = await fetch('/api/dashboard/coupons', { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    setCoupons(data);
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const formValues = Object.fromEntries(formData.entries());
    const token = localStorage.getItem('dashboard_token');

    const payload = {
      ...formValues,
      isActive: formValues.isActive === 'on',
    };

    const url = editingCoupon ? `/api/dashboard/coupons/${editingCoupon.id}` : '/api/dashboard/coupons';
    const method = editingCoupon ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      toast.success('Coupon saved');
      setShowForm(false);
      fetchCoupons();
    }
  };

  const deleteCoupon = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    const token = localStorage.getItem('dashboard_token');
    const res = await fetch(`/api/dashboard/coupons/${id}`, { 
      method: 'DELETE', 
      headers: { 'Authorization': `Bearer ${token}` } 
    });
    if (res.ok) {
      toast.success('Coupon deleted');
      fetchCoupons();
    } else {
      toast.error('Failed to delete coupon');
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Coupon Management</h1>
        <button 
          onClick={() => { setEditingCoupon(null); setShowForm(true); }}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
        >
          <Plus className="w-4 h-4" /> Create New Coupon
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 dark:border-gray-800">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="font-black text-xl">{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Coupon Code</label>
                <input name="code" required defaultValue={editingCoupon?.code} placeholder="WELCOME100" className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none uppercase font-mono dark:text-white transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Discount Value</label>
                  <input name="discountValue" type="number" step="0.01" required defaultValue={editingCoupon?.discountValue} className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none dark:text-white transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Type</label>
                  <select name="discountType" defaultValue={editingCoupon?.discountType || 'fixed'} className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none font-bold dark:text-white transition-all">
                    <option value="fixed">Fixed (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Min Purchase (₹)</label>
                <input name="minPurchase" type="number" step="0.01" defaultValue={editingCoupon?.minPurchase || '0'} className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none dark:text-white transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Target Audience</label>
                <select 
                  name="targetAudience" 
                  defaultValue={editingCoupon?.targetAudience || 'all'} 
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none font-bold text-sm text-gray-800 dark:text-gray-100 dark:text-white transition-all"
                >
                  <option value="all">🌐 All Customers (Everyone)</option>
                  <option value="vip">👑 Only VIP Members</option>
                </select>
                <p className="text-[10px] text-gray-400">
                  Select "Only VIP" so only active VIP subscribers can see and use this coupon.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="isActive" defaultChecked={editingCoupon ? editingCoupon.isActive : true} />
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Active</label>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                <Save className="w-5 h-5" /> Save Coupon
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 dark:border-gray-800">
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Code</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Discount</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Min Purchase</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Audience</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {coupons.map((coupon: any) => (
              <tr key={coupon.id} className="hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800/40 transition-colors">
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-black font-mono tracking-wider">
                    {coupon.code}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                  {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${parseFloat(coupon.discountValue).toLocaleString()}`}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-600">
                  ₹{parseFloat(coupon.minPurchase).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  {coupon.targetAudience === 'vip' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
                      <Crown className="w-3 h-3 text-amber-600" /> Only VIP
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-200">
                      <Users className="w-3 h-3 text-blue-600" /> All Users
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {coupon.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => { setEditingCoupon(coupon); setShowForm(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors inline-block"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => deleteCoupon(coupon.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors inline-block"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-bold">No coupons found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BannersManagement() {
  const [banners, setBanners] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedBanners, setSelectedBanners] = useState<number[]>([]);

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    const token = localStorage.getItem('dashboard_token');
    const res = await fetch('/api/dashboard/banners', { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    setBanners(data);
  };

  const handleFileUpload = async (file: File) => {
    const token = localStorage.getItem('dashboard_token');
    const formData = new FormData();
    formData.append('images', file); // Use 'images' to match products and backend
    setUploading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.urls && data.urls.length > 0) return data.urls[0]; // Backend returns 'urls' array
      throw new Error(data.error || 'Upload failed');
    } catch (err) {
      toast.error('Banner upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const formValues = Object.fromEntries(formData.entries());
    const token = localStorage.getItem('dashboard_token');

    let imageUrl = editingBanner?.imageUrl;
    const imageFile = (e.target.images as HTMLInputElement).files?.[0];
    if (imageFile) {
      const uploadedUrl = await handleFileUpload(imageFile);
      if (!uploadedUrl) return;
      imageUrl = uploadedUrl;
    }

    const payload = { 
      ...formValues, 
      imageUrl,
      isEnabled: formValues.isEnabled === 'on', 
      sortOrder: parseInt(formValues.sortOrder as string) 
    };

    const url = editingBanner ? `/api/dashboard/banners/${editingBanner.id}` : '/api/dashboard/banners';
    const method = editingBanner ? 'PUT' : 'POST';
    const res = await fetch(url, { 
      method, 
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
      body: JSON.stringify(payload) 
    });
    if (res.ok) {
      fetchBanners();
      setShowForm(false);
      toast.success(editingBanner ? 'Banner updated' : 'Banner added');
    } else {
      const data = await res.json().catch(() => ({ error: 'Failed to save banner' }));
      toast.error(data.error || 'Failed to save banner');
    }
  };

  const deleteBanner = async (id: number) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    const token = localStorage.getItem('dashboard_token');
    try {
      const res = await fetch(`/api/dashboard/banners/${id}`, {
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Banner deleted successfully');
        setBanners((prev: any) => prev.filter((b: any) => b.id !== id));
        setSelectedBanners(prev => prev.filter(bId => bId !== id));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete banner');
      }
    } catch (err) {
      toast.error('Connection error');
    }
  };

  const bulkDeleteBanners = async () => {
    if (selectedBanners.length === 0) return;
    if (!confirm(`Delete ${selectedBanners.length} banners?`)) return;
    
    const token = localStorage.getItem('dashboard_token');
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedBanners) {
      try {
        const res = await fetch(`/api/dashboard/banners/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) successCount++;
        else failCount++;
      } catch (err) {
        failCount++;
      }
    }

    if (successCount > 0) toast.success(`${successCount} banners deleted`);
    if (failCount > 0) toast.error(`${failCount} banners failed to delete`);
    setSelectedBanners([]);
    fetchBanners();
  };

  const toggleSelectBanner = (id: number) => {
    setSelectedBanners(prev => 
      prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Slider Management</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => { setEditingBanner(null); setShowForm(true); }} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Add Banner
          </button>
          {selectedBanners.length > 0 && (
            <button onClick={bulkDeleteBanners} className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-red-100 hover:bg-red-700">
              <Trash2 className="w-4 h-4" /> Delete ({selectedBanners.length})
            </button>
          )}
        </div>
      </div>

      {/* Banner ke Niche Customer of Month & Year Info Banner */}
      <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-purple-500/10 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-sm text-gray-900 dark:text-white dark:text-white flex items-center gap-2">
              Banner ke Niche: Customer of the Month & Customer of the Year
              <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
                Auto-Slide Active
              </span>
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Customer homepage par main banner ke theek niche ye dono naam auto-slide hote hain. Inhe customize karne ke liye Settings par click karein.
            </p>
          </div>
        </div>

        <Link
          to="/dashboard/settings"
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all shrink-0"
        >
          <Edit className="w-3.5 h-3.5" />
          Edit Customer of Month & Year
        </Link>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 dark:border-gray-800">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="font-black text-xl">Banner Settings</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Banner Image</label>
                <div className="flex items-center gap-4">
                  {editingBanner?.imageUrl && (
                    <img src={editingBanner.imageUrl} className="w-20 h-10 rounded-lg object-cover border" alt="Preview" />
                  )}
                  <input name="images" type="file" accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                </div>
              </div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Title (Optional)</label><input name="title" defaultValue={editingBanner?.title} className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none dark:text-white transition-all" /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Sort Order</label><input name="sortOrder" type="number" defaultValue={editingBanner?.sortOrder || 0} className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none dark:text-white transition-all" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" name="isEnabled" defaultChecked={editingBanner ? editingBanner.isEnabled : true} /><label className="text-sm font-bold">Enabled</label></div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Save Banner</button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((banner: any) => (
          <div key={banner.id} className="bg-white rounded-3xl border shadow-sm overflow-hidden relative group">
            <img 
              src={banner.imageUrl} 
              className="w-full aspect-[21/9] object-cover" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1200&auto=format&fit=crop';
              }}
            />
            <div className="absolute top-3 left-3">
              <input 
                type="checkbox" 
                checked={selectedBanners.includes(banner.id)}
                onChange={() => toggleSelectBanner(banner.id)}
                className="w-5 h-5 rounded-lg border-2 border-white shadow-sm cursor-pointer"
              />
            </div>
            <div className="absolute top-3 right-3 flex gap-2">
              <button onClick={() => { setEditingBanner(banner); setShowForm(true); }} className="p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg text-indigo-600 hover:scale-110 transition-transform"><Edit className="w-4 h-4" /></button>
              <button onClick={(e) => { e.stopPropagation(); deleteBanner(banner.id); }} className="p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg text-red-600 hover:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="p-4 flex justify-between items-center">
              <div><p className="font-bold text-sm">{banner.title || 'Untitled Banner'}</p><p className="text-[10px] text-gray-400">Order: {banner.sortOrder}</p></div>
              <div className={`w-2.5 h-2.5 rounded-full ${banner.isEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [passwordForm, setPasswordForm] = useState({ old: '', new: '' });
  const [bogoForm, setBogoForm] = useState<any>({
    enabled: false,
    startDate: new Date().toISOString().split('T')[0],
    startTime: '00:00',
    endDate: new Date().toISOString().split('T')[0],
    endTime: '23:59',
    bannerText: 'BUY 1 GET 1 FREE FLASH OFFER ON ALL PRODUCTS!'
  });
  const [awards, setAwards] = useState<any>({
    enabled: true,
    monthCustomer: {
      title: 'Customer of the Month',
      name: 'Rohan Verma',
      location: 'Patna, Bihar',
      reward: 'Top Shopper of June • ₹1,000 Gift Voucher',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400'
    },
    yearCustomer: {
      title: 'Customer of the Year',
      name: 'Pooja Sharma',
      location: 'Jaipur, Rajasthan',
      reward: 'VIP Diamond Member • Annual Gold Trophy & Gift Hamper',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400'
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('dashboard_token');
    fetch('/api/dashboard/settings', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        if (data.customerAwards) {
          setAwards(data.customerAwards);
        }
        if (data.bogoCampaign) {
          setBogoForm(data.bogoCampaign);
        }
      });
  }, []);

  const saveSettings = async (key: string, data: any) => {
    const token = localStorage.getItem('dashboard_token');
    await fetch(`/api/dashboard/settings/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    toast.success('Settings updated');
  };

  const saveBogoCampaign = async () => {
    const token = localStorage.getItem('dashboard_token');
    try {
      const res = await fetch('/api/dashboard/bogo-campaign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(bogoForm)
      });
      if (res.ok) {
        toast.success('BOGO Flash Campaign settings saved successfully!');
      } else {
        toast.error('Failed to save BOGO campaign');
      }
    } catch {
      toast.error('Network error saving campaign');
    }
  };

  const getBogoStatus = () => {
    if (!bogoForm.enabled) return { label: 'Disabled (Inactive)', color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300' };
    const now = new Date();
    const start = new Date(`${bogoForm.startDate}T${bogoForm.startTime}:00`);
    const end = new Date(`${bogoForm.endDate}T${bogoForm.endTime}:00`);
    if (now >= start && now < end) {
      return { label: '🟢 LIVE NOW (Active on All Products)', color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-400 animate-pulse' };
    }
    if (now < start) {
      return { label: `⏳ Scheduled (Starts ${bogoForm.startDate} at ${bogoForm.startTime})`, color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-400' };
    }
    return { label: '⚪ Expired (Offer Ended)', color: 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-300' };
  };

  const uploadAvatar = async (file: File, type: 'month' | 'year') => {
    const token = localStorage.getItem('dashboard_token');
    const formData = new FormData();
    formData.append('images', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.urls && data.urls[0]) {
        if (type === 'month') {
          setAwards((prev: any) => ({
            ...prev,
            monthCustomer: { ...prev.monthCustomer, avatar: data.urls[0] }
          }));
        } else {
          setAwards((prev: any) => ({
            ...prev,
            yearCustomer: { ...prev.yearCustomer, avatar: data.urls[0] }
          }));
        }
        toast.success('Photo uploaded successfully');
      }
    } catch {
      toast.error('Upload failed');
    }
  };

  const updatePassword = async (e: any) => {
    e.preventDefault();
    const token = localStorage.getItem('dashboard_token');
    const res = await fetch('/api/dashboard/settings/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ newPassword: passwordForm.new })
    });
    if (res.ok) { toast.success('Password changed'); setPasswordForm({ old: '', new: '' }); }
  };

  if (!settings) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="p-8 max-w-4xl space-y-8">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white dark:text-white">Website Settings</h1>
      
      {/* Customer of the Month & Customer of the Year Card */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-amber-200 dark:border-amber-900/40 shadow-sm space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-gray-900 dark:text-white dark:text-white flex items-center gap-2">
                Customer of the Month & Year (बैनर के नीचे ऑटो-स्लाइड नाम)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Admin jo naam yahan dalega wah customer homepage par banner ke theek niche auto slide hota rahega.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-amber-50 dark:bg-amber-950/40 px-3.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/40">
            <input 
              type="checkbox" 
              checked={awards.enabled} 
              onChange={e => setAwards({ ...awards, enabled: e.target.checked })} 
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500" 
            />
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200">Show on Homepage</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Customer of the Month */}
          <div className="p-5 rounded-2xl border-2 border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" /> 1. Customer of the Month
              </span>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                Monthly Award
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-amber-400 shadow-sm shrink-0 bg-white">
                <img 
                  src={awards.monthCustomer?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400'} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Upload / Change Photo</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0], 'month')}
                  className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-white hover:file:bg-amber-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Customer Name *</label>
              <input 
                value={awards.monthCustomer?.name || ''} 
                onChange={e => setAwards({
                  ...awards,
                  monthCustomer: { ...awards.monthCustomer, name: e.target.value }
                })}
                placeholder="e.g. Rohan Verma"
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-amber-200 dark:border-gray-700 rounded-xl outline-none font-bold text-sm text-gray-900 dark:text-white dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">City / Location</label>
              <input 
                value={awards.monthCustomer?.location || ''} 
                onChange={e => setAwards({
                  ...awards,
                  monthCustomer: { ...awards.monthCustomer, location: e.target.value }
                })}
                placeholder="e.g. Patna, Bihar"
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-amber-200 dark:border-gray-700 rounded-xl outline-none text-xs text-gray-900 dark:text-white dark:text-white font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Reward / Highlight Text</label>
              <input 
                value={awards.monthCustomer?.reward || ''} 
                onChange={e => setAwards({
                  ...awards,
                  monthCustomer: { ...awards.monthCustomer, reward: e.target.value }
                })}
                placeholder="e.g. Top Shopper of June • ₹1,000 Gift Voucher"
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-amber-200 dark:border-gray-700 rounded-xl outline-none text-xs text-amber-700 dark:text-amber-400 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Or Image Link / URL</label>
              <input 
                value={awards.monthCustomer?.avatar || ''} 
                onChange={e => setAwards({
                  ...awards,
                  monthCustomer: { ...awards.monthCustomer, avatar: e.target.value }
                })}
                placeholder="https://..."
                className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg outline-none text-xs text-gray-600 dark:text-gray-400 font-mono"
              />
            </div>
          </div>

          {/* 2. Customer of the Year */}
          <div className="p-5 rounded-2xl border-2 border-purple-200 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-950/20 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" /> 2. Customer of the Year
              </span>
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-widest">
                Annual Award
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-purple-400 shadow-sm shrink-0 bg-white">
                <img 
                  src={awards.yearCustomer?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400'} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Upload / Change Photo</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0], 'year')}
                  className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Customer Name *</label>
              <input 
                value={awards.yearCustomer?.name || ''} 
                onChange={e => setAwards({
                  ...awards,
                  yearCustomer: { ...awards.yearCustomer, name: e.target.value }
                })}
                placeholder="e.g. Pooja Sharma"
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-purple-200 dark:border-gray-700 rounded-xl outline-none font-bold text-sm text-gray-900 dark:text-white dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">City / Location</label>
              <input 
                value={awards.yearCustomer?.location || ''} 
                onChange={e => setAwards({
                  ...awards,
                  yearCustomer: { ...awards.yearCustomer, location: e.target.value }
                })}
                placeholder="e.g. Jaipur, Rajasthan"
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-purple-200 dark:border-gray-700 rounded-xl outline-none text-xs text-gray-900 dark:text-white dark:text-white font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Reward / Highlight Text</label>
              <input 
                value={awards.yearCustomer?.reward || ''} 
                onChange={e => setAwards({
                  ...awards,
                  yearCustomer: { ...awards.yearCustomer, reward: e.target.value }
                })}
                placeholder="e.g. VIP Diamond Member • Gold Trophy Winner"
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-purple-200 dark:border-gray-700 rounded-xl outline-none text-xs text-purple-700 dark:text-pink-400 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Or Image Link / URL</label>
              <input 
                value={awards.yearCustomer?.avatar || ''} 
                onChange={e => setAwards({
                  ...awards,
                  yearCustomer: { ...awards.yearCustomer, avatar: e.target.value }
                })}
                placeholder="https://..."
                className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg outline-none text-xs text-gray-600 dark:text-gray-400 font-mono"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={async () => {
            await saveSettings('customer_awards', awards);
            toast.success('Customer of Month & Year updated successfully!');
          }}
          className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 hover:brightness-110 active:scale-[0.99] text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Trophy className="w-4 h-4 text-amber-200" />
          Save Customer of the Month & Year
        </button>
      </div>

      {/* Buy 1 Get 1 Free (BOGO) Campaign Scheduler Section */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border-2 border-orange-200 dark:border-orange-900/50 shadow-sm space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-black text-base text-gray-900 dark:text-white dark:text-white">
                  Buy 1 Get 1 Free (BOGO) Flash Campaign
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getBogoStatus().color}`}>
                  {getBogoStatus().label}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Is time se lekar is time tak aur is date se is date tak sabhi products par Buy 1 Get 1 Free automatic live rahega.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-orange-50 dark:bg-orange-950/40 px-3.5 py-1.5 rounded-xl border border-orange-200 dark:border-orange-800/40">
            <input 
              type="checkbox" 
              checked={bogoForm.enabled} 
              onChange={e => setBogoForm({ ...bogoForm, enabled: e.target.checked })} 
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500" 
            />
            <span className="text-xs font-bold text-orange-900 dark:text-orange-200">Enable Campaign</span>
          </label>
        </div>

        {/* Date and Time Pickers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Schedule */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 dark:bg-gray-850 border dark:border-gray-800 space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> 1. Offer Start Date & Time
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={bogoForm.startDate} 
                  onChange={e => setBogoForm({ ...bogoForm, startDate: e.target.value })} 
                  className="w-full p-2.5 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white dark:text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Start Time</label>
                <input 
                  type="time" 
                  value={bogoForm.startTime} 
                  onChange={e => setBogoForm({ ...bogoForm, startTime: e.target.value })} 
                  className="w-full p-2.5 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white dark:text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* End Schedule */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 dark:bg-gray-850 border dark:border-gray-800 space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> 2. Offer End Date & Time
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">End Date</label>
                <input 
                  type="date" 
                  value={bogoForm.endDate} 
                  onChange={e => setBogoForm({ ...bogoForm, endDate: e.target.value })} 
                  className="w-full p-2.5 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white dark:text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">End Time</label>
                <input 
                  type="time" 
                  value={bogoForm.endTime} 
                  onChange={e => setBogoForm({ ...bogoForm, endTime: e.target.value })} 
                  className="w-full p-2.5 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white dark:text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Banner Text */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Flash Banner Announcement Text</label>
            <input 
              type="text" 
              value={bogoForm.bannerText} 
              onChange={e => setBogoForm({ ...bogoForm, bannerText: e.target.value })} 
              placeholder="e.g. BUY 1 GET 1 FREE FLASH OFFER ON ALL PRODUCTS!"
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white dark:text-white outline-none"
            />
          </div>
        </div>

        {/* Feature Behavior Explanation */}
        <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0" /> Automatic BOGO System Behavior:
          </p>
          <ul className="list-disc list-inside text-[11px] text-amber-800 dark:text-amber-300 space-y-0.5 pl-1">
            <li>Scheduled start time aate hi customer kisi bhi page par ho, auto-refresh hokar home page par aayega.</li>
            <li>BOGO offer time ke dauraan jab customer product par click karega to deal continuous loading show karegi.</li>
            <li>Offer end hote hi loading hat jayegi aur product load ho jayega sath hi top par English me notice aayega: <em>"You missed the Buy 1 Get 1 Free offer! The limited-time flash deal has ended."</em></li>
          </ul>
        </div>

        <button 
          onClick={saveBogoCampaign}
          className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:brightness-110 active:scale-[0.99] text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Save Buy 1 Get 1 Free Campaign
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white dark:text-white mb-6 flex items-center gap-2"><CreditCard className="w-5 h-5 text-indigo-600" /> UPI Payment Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Merchant UPI ID</label><input defaultValue={settings.upi.upiId} onChange={e => settings.upi.upiId = e.target.value} className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none dark:text-white transition-all" /></div>
          <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Merchant Name</label><input defaultValue={settings.upi.merchantName} onChange={e => settings.upi.merchantName = e.target.value} className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none dark:text-white transition-all" /></div>
          <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">UPI Registered Mobile Number</label><input defaultValue={settings.upi.mobileNumber || '8925673304'} onChange={e => settings.upi.mobileNumber = e.target.value} placeholder="e.g. 8925673304" className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none dark:text-white transition-all" /></div>
          <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Security Note</label><input defaultValue={settings.upi.securityNote || 'Direct Mobile/QR payments avoid Google Pay security blocks'} onChange={e => settings.upi.securityNote = e.target.value} className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none dark:text-white transition-all" /></div>
          <div className="col-span-2 space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Instructions</label><textarea defaultValue={settings.upi.instructions} onChange={e => settings.upi.instructions = e.target.value} className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none dark:text-white transition-all" rows={3} /></div>
          <button onClick={() => saveSettings('upi_settings', settings.upi)} className="col-span-2 bg-indigo-600 text-white py-3 rounded-xl font-bold">Save UPI Settings</button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white dark:text-white mb-6 flex items-center gap-2"><SettingsIcon className="w-5 h-5 text-indigo-600" /> General Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Website Name</label><input defaultValue={settings.general.websiteName} onChange={e => settings.general.websiteName = e.target.value} className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none dark:text-white transition-all" /></div>
          <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Support Number</label><input defaultValue={settings.general.supportNumber} onChange={e => settings.general.supportNumber = e.target.value} className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none dark:text-white transition-all" /></div>
          <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">WhatsApp Number</label><input defaultValue={settings.general.whatsappSupportNumber} onChange={e => settings.general.whatsappSupportNumber = e.target.value} className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl outline-none dark:text-white transition-all" /></div>
          <button onClick={() => saveSettings('general_settings', settings.general)} className="col-span-2 bg-indigo-600 text-white py-3 rounded-xl font-bold">Save General Settings</button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-red-100 dark:border-red-950/40 shadow-sm">
        <h3 className="font-bold text-red-900 dark:text-red-400 mb-6 flex items-center gap-2"><Lock className="w-5 h-5 text-red-600" /> Change Dashboard Password</h3>
        <form onSubmit={updatePassword} className="grid grid-cols-1 gap-4">
          <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">New Password</label><input type="password" required value={passwordForm.new} onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })} className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border rounded-xl outline-none text-gray-900 dark:text-white dark:text-white" /></div>
          <button type="submit" className="bg-red-600 text-white py-3 rounded-xl font-bold">Update Password</button>
        </form>
      </div>
    </div>
  );
}

// --- Premium Subscription Payments Management Component ---

function SubscriptionsManagement() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalCount: 0,
    pendingCount: 0,
    verifiedCount: 0,
    rejectedCount: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pending Verification' | 'Verified' | 'Rejected'>('ALL');
  const [actionModal, setActionModal] = useState<{
    sub: any;
    action: 'approve' | 'reject';
  } | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    setLoading(true);
    const token = localStorage.getItem('dashboard_token');
    try {
      const res = await fetch('/api/dashboard/subscriptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSubscriptions(data.subscriptions || []);
        setStats(data.stats || {});
      } else {
        toast.error(data.error || 'Failed to load subscriptions');
      }
    } catch {
      toast.error('Network error loading subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleCopy = async (text: string, idKey: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(idKey);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  const handleVerifyAction = async () => {
    if (!actionModal) return;
    setIsProcessing(true);
    const token = localStorage.getItem('dashboard_token');
    try {
      const res = await fetch(`/api/dashboard/subscriptions/${actionModal.sub.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: actionModal.action,
          adminNotes: adminNotes.trim(),
          verifiedBy: 'Admin'
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Updated successfully!');
        setActionModal(null);
        setAdminNotes('');
        fetchSubscriptions();
      } else {
        toast.error(data.error || 'Failed to update subscription');
      }
    } catch {
      toast.error('Failed to submit action');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredSubs = subscriptions.filter(sub => {
    const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;
    if (!matchesStatus) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (sub.customerName || '').toLowerCase().includes(q) ||
      (sub.customerMobile || '').includes(q) ||
      (sub.utrNumber || '').toLowerCase().includes(q) ||
      (sub.subscriptionId || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white dark:text-white">Premium Subscription Payments</h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Verify customer UPI payments (₹299 for 30 days) and activate VIP memberships.
          </p>
        </div>

        <button
          onClick={fetchSubscriptions}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-colors cursor-pointer"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh Payments
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 dark:border-gray-800 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Submissions</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white dark:text-white mt-1">{stats.totalCount || 0}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">Pending Verification</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.pendingCount || 0}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Verified Active</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.verifiedCount || 0}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-red-200 dark:border-red-900/60 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 tracking-wider">Rejected</p>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{stats.rejectedCount || 0}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">Total Revenue</p>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">₹{(stats.totalRevenue || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-1 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'Pending Verification', 'Verified', 'Rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === tab
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:text-white dark:hover:text-white'
              }`}
            >
              {tab === 'ALL' ? 'All Payments' : tab}
              {tab === 'Pending Verification' && stats.pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] bg-amber-500 text-white font-black">
                  {stats.pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, mobile, UTR, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white dark:text-white"
          />
        </div>
      </div>

      {/* Subscriptions Table / Cards */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold">Loading subscription payments...</p>
          </div>
        ) : filteredSubs.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <Crown className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700 dark:text-gray-300" />
            <p className="text-sm font-bold text-gray-600 dark:text-gray-400">No subscription payments found</p>
            <p className="text-xs text-gray-400">Payments submitted by customers will show up here for verification.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800 dark:bg-gray-800/60 border-b dark:border-gray-800 text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                <tr>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Subscription ID</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Submitted UTR No.</th>
                  <th className="p-4">Submitted At</th>
                  <th className="p-4">Status & Validity</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                {filteredSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-900 dark:text-white dark:text-white text-sm">{sub.customerName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <a 
                          href={`tel:${sub.customerMobile}`} 
                          className="font-mono text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {sub.customerMobile}
                        </a>
                        <a 
                          href={`https://wa.me/91${sub.customerMobile}?text=Hello ${sub.customerName}, regarding your Fancy Bazaar VIP Subscription (UTR: ${sub.utrNumber})`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-green-600 hover:underline font-bold"
                        >
                          WhatsApp
                        </a>
                      </div>
                      {sub.customerEmail && (
                        <div className="text-[11px] text-gray-400 truncate max-w-[180px]">{sub.customerEmail}</div>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-gray-700 dark:text-gray-300 dark:text-gray-300">
                        <span>{sub.subscriptionId}</span>
                        <button
                          onClick={() => handleCopy(sub.subscriptionId, `sub_${sub.id}`)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                          title="Copy ID"
                        >
                          {copiedField === `sub_${sub.id}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                        </button>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="font-black text-gray-900 dark:text-white dark:text-white text-sm font-sans">
                        ₹{parseFloat(sub.amount).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">UPI Payment</span>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:border-gray-700 w-fit">
                        <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-xs tracking-wider">
                          {sub.utrNumber}
                        </span>
                        <button
                          onClick={() => handleCopy(sub.utrNumber, `utr_${sub.id}`)}
                          className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
                          title="Copy UTR to verify in bank"
                        >
                          {copiedField === `utr_${sub.id}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                        </button>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-medium text-gray-900 dark:text-white dark:text-white">
                        {format(new Date(sub.createdAt), 'dd MMM yyyy')}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {format(new Date(sub.createdAt), 'hh:mm a')}
                      </div>
                    </td>

                    <td className="p-4">
                      <div>
                        {sub.status === 'Pending Verification' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                            <Clock className="w-3 h-3" /> Pending Verification
                          </span>
                        )}
                        {sub.status === 'Verified' && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Active (30 Days)
                            </span>
                            {sub.endDate && (
                              <p className="text-[10px] text-gray-400">
                                Valid till: {format(new Date(sub.endDate), 'dd MMM yyyy')}
                              </p>
                            )}
                            {sub.verifiedBy && (
                              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                Approved by {sub.verifiedBy} {sub.verifiedAt ? `• ${format(new Date(sub.verifiedAt), 'dd MMM, hh:mm a')}` : ''}
                              </p>
                            )}
                          </div>
                        )}
                        {sub.status === 'Rejected' && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800">
                              <XCircle className="w-3 h-3" /> Rejected
                            </span>
                            {sub.adminNotes && (
                              <p className="text-[10px] text-red-500 truncate max-w-[150px]" title={sub.adminNotes}>
                                {sub.adminNotes}
                              </p>
                            )}
                            {sub.verifiedBy && (
                              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                Rejected by {sub.verifiedBy} {sub.verifiedAt ? `• ${format(new Date(sub.verifiedAt), 'dd MMM, hh:mm a')}` : ''}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {sub.status === 'Pending Verification' ? (
                          <>
                            <button
                              onClick={() => {
                                setActionModal({ sub, action: 'approve' });
                                setAdminNotes('Verified transaction in UPI bank records');
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setActionModal({ sub, action: 'reject' });
                                setAdminNotes('Invalid or unverified UTR transaction');
                              }}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {sub.status === 'Rejected' && (
                              <button
                                onClick={() => {
                                  setActionModal({ sub, action: 'approve' });
                                  setAdminNotes('Re-checked and approved');
                                }}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold cursor-pointer"
                              >
                                Re-approve
                              </button>
                            )}
                            {sub.status === 'Verified' && (
                              <button
                                onClick={() => {
                                  setActionModal({ sub, action: 'reject' });
                                  setAdminNotes('Payment revoked/disputed');
                                }}
                                className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[11px] font-bold cursor-pointer"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve / Reject Confirmation Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {actionModal.action === 'approve' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <h3 className="font-bold text-gray-900 dark:text-white dark:text-white">
                  {actionModal.action === 'approve' ? 'Approve Subscription Payment' : 'Reject Subscription Payment'}
                </h3>
              </div>
              <button
                onClick={() => setActionModal(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-bold text-gray-900 dark:text-white dark:text-white">{actionModal.sub.customerName} ({actionModal.sub.customerMobile})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount:</span>
                <span className="font-bold text-gray-900 dark:text-white dark:text-white">₹{actionModal.sub.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Submitted UTR:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{actionModal.sub.utrNumber}</span>
              </div>
            </div>

            {actionModal.action === 'approve' ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300">
                <p className="font-bold mb-1">⚠️ Security Check Requirement:</p>
                <p>Verify that you received ₹299 in your UPI/bank account matching UTR <strong>{actionModal.sub.utrNumber}</strong> before approving. Approval activates the customer's 30-day VIP membership immediately.</p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Rejecting will keep the customer's membership inactive and record the rejection reason.
              </p>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase">Admin Verification Notes</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Enter verification notes or reason..."
                rows={3}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white dark:text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleVerifyAction}
                className={`flex-1 py-3 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.98] ${
                  actionModal.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isProcessing ? 'Processing...' : (actionModal.action === 'approve' ? 'Confirm & Activate (30 Days)' : 'Confirm Rejection')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// --- Main Dashboard Layout ---

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [pendingSubsCount, setPendingSubsCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('dashboard_token');
    if (!token) {
      navigate('/secure-payments');
    } else {
      fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.pendingSubscriptions) setPendingSubsCount(Number(data.pendingSubscriptions));
      })
      .catch(() => {});
    }
  }, [navigate, location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('dashboard_token');
    navigate('/secure-payments');
  };

  const menuItems = [
    { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Orders', path: '/dashboard/orders', icon: <ShoppingCart className="w-5 h-5" /> },
    { name: 'Premium Payments', path: '/dashboard/subscriptions', icon: <Crown className="w-5 h-5 text-amber-500" /> },
    { name: 'Change Requests', path: '/dashboard/change-requests', icon: <RefreshCcw className="w-5 h-5" /> },
    { name: 'Products', path: '/dashboard/products', icon: <Tag className="w-5 h-5" /> },
    { name: 'Banners', path: '/dashboard/banners', icon: <ImageIcon className="w-5 h-5" /> },
    { name: 'Coupons', path: '/dashboard/coupons', icon: <Ticket className="w-5 h-5" /> },
    { name: 'Customers', path: '/dashboard/customers', icon: <Users className="w-5 h-5 text-indigo-400" /> },
    { name: 'Settings', path: '/dashboard/settings', icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 dark:bg-gray-950 flex flex-col md:flex-row transition-colors">
      <div className="w-full md:w-64 bg-white dark:bg-gray-900 border-r dark:border-gray-800 shrink-0 transition-colors">
        <div className="p-6 border-b dark:border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100 dark:shadow-none transition-shadow">F</div>
          <div><p className="font-black text-gray-900 dark:text-white dark:text-white leading-none transition-colors">Fancy Bazaar</p><p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest transition-colors">Dashboard</p></div>
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                location.pathname === item.path 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800 hover:text-gray-900 dark:text-white dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.name}</span>
              </div>
              {item.path === '/dashboard/subscriptions' && pendingSubsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-black animate-pulse">
                  {pendingSubsCount}
                </span>
              )}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-bold text-sm mt-8"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </nav>
      </div>

      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/orders" element={<OrdersList />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/subscriptions" element={<SubscriptionsManagement />} />
          <Route path="/change-requests" element={<ChangeRequests />} />
          <Route path="/products" element={<ProductsManagement />} />
          <Route path="/banners" element={<BannersManagement />} />
          <Route path="/coupons" element={<CouponsManagement />} />
          <Route path="/customers" element={<CustomersManagement />} />
          <Route path="/settings" element={<DashboardSettings />} />
        </Routes>
      </div>
    </div>
  );
}
