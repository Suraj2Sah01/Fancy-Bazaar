import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
      >
        <Download className="w-3.5 h-3.5" />
        Install App
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-xl border-2 border-indigo-600 bg-white px-4 py-2 text-xs font-black text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          Install on iOS
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl dark:bg-gray-900 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">Install Fancy Bazaar</h3>
                  <p className="mt-1 text-xs font-bold text-gray-400 uppercase tracking-widest">For iPhone / iPad</p>
                </div>
                <button onClick={() => setShowIOSGuide(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                    <Share className="w-5 h-5 text-indigo-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    1. Tap the <span className="font-black text-gray-900 dark:text-white">Share</span> button in the Safari toolbar.
                  </p>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    2. Scroll down and tap <span className="font-black text-gray-900 dark:text-white">Add to Home Screen</span>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-8 w-full rounded-2xl bg-indigo-600 py-4 text-sm font-black text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
              >
                Got it!
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
