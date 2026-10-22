import React from 'react';
import { useBogo } from '../context/BogoContext';
import { Sparkles, Clock, X, AlertTriangle } from 'lucide-react';

export default function BogoBanner() {
  const { isBogoActive, missedOfferNotice, dismissMissedNotice, formattedRemainingTime, campaign } = useBogo();

  if (missedOfferNotice) {
    return (
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white px-4 py-2.5 text-xs font-bold shadow-md sticky top-0 z-40 transition-all flex items-center justify-between">
        <div className="container mx-auto flex items-center justify-center gap-2 text-center">
          <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-300 animate-bounce" />
          <span>
            You missed the Buy 1 Get 1 Free offer! The limited-time flash deal has ended.
          </span>
        </div>
        <button
          onClick={dismissMissedNotice}
          className="p-1 hover:bg-white/20 rounded-full transition-colors shrink-0 ml-2 cursor-pointer"
          title="Dismiss notification"
          aria-label="Close banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (isBogoActive) {
    return (
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white px-4 py-2 text-xs font-black shadow-md sticky top-0 z-40 transition-all flex items-center justify-between">
        <div className="container mx-auto flex items-center justify-center gap-3 text-center flex-wrap">
          <span className="flex items-center gap-1.5 uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
            {campaign?.bannerText || 'BUY 1 GET 1 FREE FLASH DEAL'}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[11px] bg-black/30 px-2.5 py-0.5 rounded-lg border border-white/20">
            <Clock className="w-3 h-3 text-yellow-300 animate-pulse" />
            Offer Ends In: {formattedRemainingTime}
          </span>
        </div>
      </div>
    );
  }

  return null;
}
