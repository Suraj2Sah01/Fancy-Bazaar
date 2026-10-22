import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Phone, User, Eye, EyeOff, Crown, MessageCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useMembership } from '../context/MembershipContext';
import toast from 'react-hot-toast';

export default function CustomerAuthModal() {
  const navigate = useNavigate();
  const { isAuthModalOpen, closeAuthModal, authModalMode, setAuthModalMode, login, signup } = useCustomerAuth();
  const { checkStatus } = useMembership();

  // Form states
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleMobileChange = (val: string) => {
    // Keep only numbers and max 10 digits
    const clean = val.replace(/\D/g, '').slice(0, 10);
    setMobile(clean);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (mobile.length !== 10 || !/^[6-9]\d{9}$/.test(mobile)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setErrorMessage('Password must contain both letters and numbers.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    const result = await signup(name, mobile, password, confirmPassword);
    setLoading(false);

    if (result.success) {
      toast.success('🎉 Account created successfully! Welcome to Fancy Bazaar.');
      await checkStatus(mobile);
      closeAuthModal();
      // Reset form
      setName('');
      setMobile('');
      setPassword('');
      setConfirmPassword('');

      // Navigate directly to Home page on signup as requested
      navigate('/', { replace: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      setErrorMessage(result.error || 'Failed to create account.');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (mobile.length !== 10 || !/^[6-9]\d{9}$/.test(mobile)) {
      setErrorMessage('Please enter your registered 10-digit mobile number.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    const result = await login(mobile, password);
    setLoading(false);

    if (result.success) {
      toast.success('👋 Welcome back to Fancy Bazaar!');
      await checkStatus(mobile);
      closeAuthModal();
      setMobile('');
      setPassword('');

      // Navigate directly to Home page on login as requested
      navigate('/', { replace: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      setErrorMessage(result.error || 'Login failed.');
    }
  };

  const handleForgotPassword = async () => {
    if (mobile.length !== 10) {
      setErrorMessage('Please enter your 10-digit mobile number first to request password reset on WhatsApp.');
      return;
    }

    setForgotLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/customer/forgot-password-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
      });
      const data = await res.json();
      if (res.ok && data.whatsappUrl) {
        toast.success('Opening WhatsApp support for instant password reset...');
        window.open(data.whatsappUrl, '_blank');
      } else {
        setErrorMessage(data.error || 'Could not initiate WhatsApp password reset.');
      }
    } catch {
      setErrorMessage('Network error while requesting password reset.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuthModal}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-10"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
            <button
              onClick={closeAuthModal}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🛍️</span>
              <h2 className="text-xl font-black italic tracking-tight">Fancy Bazaar</h2>
            </div>
            <p className="text-xs text-indigo-100 font-medium">
              {authModalMode === 'signup'
                ? 'Create customer account for fast checkout and member savings'
                : 'Log in with your registered mobile number and password'}
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-850">
            <button
              onClick={() => {
                setAuthModalMode('signup');
                setErrorMessage('');
              }}
              className={`flex-1 py-3 text-xs font-black transition-colors ${
                authModalMode === 'signup'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-900'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              First-Time Sign Up
            </button>
            <button
              onClick={() => {
                setAuthModalMode('login');
                setErrorMessage('');
              }}
              className={`flex-1 py-3 text-xs font-black transition-colors ${
                authModalMode === 'login'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-900'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Customer Log In
            </button>
          </div>

          {/* Body Form */}
          <div className="p-6">
            {/* VIP Benefit Banner */}
            <div className="mb-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5">
              <Crown className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                <span className="font-bold">VIP Members:</span> Register/login with your verified WhatsApp mobile number to automatically unlock VIP wholesale prices & zero delivery fees!
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-start gap-2 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-tight">{errorMessage}</span>
              </div>
            )}

            {authModalMode === 'signup' ? (
              /* SIGNUP FORM */
              <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Mobile Number <span className="text-[10px] text-gray-400 font-normal">(Primary Login ID)</span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 flex items-center gap-1 text-gray-500 font-bold text-xs select-none">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={mobile}
                      onChange={(e) => handleMobileChange(e.target.value)}
                      className="w-full pl-16 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none tracking-wider font-semibold"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">No OTP hassle! Direct password-based access.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Create Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Min 6 characters (letters + numbers)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-type your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-60"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Create Account
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* LOGIN FORM */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Registered Mobile Number
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 flex items-center gap-1 text-gray-500 font-bold text-xs select-none">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={mobile}
                      onChange={(e) => handleMobileChange(e.target.value)}
                      className="w-full pl-16 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none tracking-wider font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Password</label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={forgotLoading}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3 text-green-500" />
                      {forgotLoading ? 'Connecting...' : 'Forgot Password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-60"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Log In'
                  )}
                </button>
              </form>
            )}

            {/* Footer toggle */}
            <div className="mt-5 pt-4 border-t dark:border-gray-800 text-center">
              {authModalMode === 'signup' ? (
                <p className="text-xs text-gray-500">
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setAuthModalMode('login');
                      setErrorMessage('');
                    }}
                    className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Log In here
                  </button>
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  New to Fancy Bazaar?{' '}
                  <button
                    onClick={() => {
                      setAuthModalMode('signup');
                      setErrorMessage('');
                    }}
                    className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Create Free Account
                  </button>
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
