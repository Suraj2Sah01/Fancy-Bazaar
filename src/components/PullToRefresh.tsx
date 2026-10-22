import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void> | void;
  threshold?: number;
}

export default function PullToRefresh({
  children,
  onRefresh,
  threshold = 70
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const hasTriggeredHapticRef = useRef(false);

  const triggerRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPullDistance(threshold);

    try {
      if (onRefresh) {
        await onRefresh();
        setIsRefreshing(false);
        setPullDistance(0);
      } else {
        // Default app-wide refresh: smooth reload just like native mobile apps
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [onRefresh, threshold]);

  useEffect(() => {
    // Touch event handlers
    const handleTouchStart = (e: TouchEvent) => {
      // Only initiate if at the very top of the scroll container / window
      const isAtTop = window.scrollY <= 1 && document.documentElement.scrollTop <= 1;
      if (!isAtTop || isRefreshing) return;

      // Don't intercept if inside an open drawer, modal, or input
      const target = e.target as HTMLElement | null;
      if (target && target.closest('input, textarea, select, [role="dialog"], .prevent-pull-refresh')) {
        return;
      }

      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = false;
      hasTriggeredHapticRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;
      const isAtTop = window.scrollY <= 1 && document.documentElement.scrollTop <= 1;

      if (isAtTop && diff > 0) {
        isPullingRef.current = true;
        setIsPulling(true);

        // Apply progressive resistance dampening
        const dampedDistance = Math.min(120, Math.pow(diff, 0.82));
        setPullDistance(dampedDistance);

        // Haptic feedback once when threshold is reached
        if (dampedDistance >= threshold && !hasTriggeredHapticRef.current) {
          hasTriggeredHapticRef.current = true;
          try {
            if (navigator.vibrate) navigator.vibrate(15);
          } catch {}
        }

        // Prevent browser bounce if pulling down at top
        if (e.cancelable && diff > 10) {
          e.preventDefault();
        }
      } else {
        if (isPullingRef.current && diff <= 0) {
          setIsPulling(false);
          setPullDistance(0);
        }
      }
    };

    const handleTouchEnd = () => {
      if (isRefreshing) return;

      if (isPullingRef.current) {
        isPullingRef.current = false;
        setIsPulling(false);

        if (pullDistance >= threshold) {
          triggerRefresh();
        } else {
          setPullDistance(0);
        }
      }
    };

    // Mouse drag handlers for desktop support & testing
    let mouseStartY = 0;
    let isMouseDown = false;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 || isRefreshing) return;
      const isAtTop = window.scrollY <= 1 && document.documentElement.scrollTop <= 1;
      if (!isAtTop) return;

      const target = e.target as HTMLElement | null;
      if (target && target.closest('input, textarea, select, button, a, [role="dialog"]')) {
        return;
      }

      mouseStartY = e.clientY;
      isMouseDown = true;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown || isRefreshing) return;
      const diff = e.clientY - mouseStartY;
      const isAtTop = window.scrollY <= 1 && document.documentElement.scrollTop <= 1;

      if (isAtTop && diff > 0) {
        setIsPulling(true);
        const damped = Math.min(110, Math.pow(diff, 0.82));
        setPullDistance(damped);
      }
    };

    const handleMouseUp = () => {
      if (!isMouseDown) return;
      isMouseDown = false;
      setIsPulling(false);

      if (pullDistance >= threshold && !isRefreshing) {
        triggerRefresh();
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isRefreshing, pullDistance, threshold, triggerRefresh]);

  const rotation = isRefreshing ? 0 : Math.min(360, (pullDistance / threshold) * 360);
  const isReady = pullDistance >= threshold;

  return (
    <div className="relative min-h-screen">
      {/* Floating Pull-to-Refresh Indicator */}
      <div
        className="fixed top-0 left-0 right-0 z-[999] pointer-events-none flex justify-center items-start pt-3 transition-opacity duration-200"
        style={{
          transform: `translateY(${isRefreshing ? 64 : Math.min(pullDistance, 85)}px)`,
          transition: isPulling ? 'none' : 'transform 0.35s cubic-bezier(0.18, 0.89, 0.32, 1.28), opacity 0.2s ease',
          opacity: pullDistance > 12 || isRefreshing ? 1 : 0
        }}
      >
        <div
          className={`flex items-center gap-2.5 px-4 py-2 rounded-full shadow-2xl border backdrop-blur-md transition-all duration-200 ${
            isReady || isRefreshing
              ? 'bg-indigo-600 text-white border-indigo-500 ring-4 ring-indigo-200/50 dark:ring-indigo-900/40 shadow-indigo-500/20'
              : 'bg-white/95 dark:bg-gray-800/95 text-gray-800 dark:text-gray-100 border-gray-200/80 dark:border-gray-700/80'
          }`}
        >
          <div className="relative w-5 h-5 flex items-center justify-center">
            {isRefreshing ? (
              <RotateCcw className="w-4 h-4 animate-spin text-white" />
            ) : isReady ? (
              <RotateCcw
                className="w-4 h-4 transition-transform duration-200"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
            ) : (
              <ArrowDown
                className="w-4 h-4 text-indigo-600 dark:text-indigo-400 transition-transform duration-100"
                style={{ transform: `translateY(${Math.min(3, pullDistance / 20)}px)` }}
              />
            )}
          </div>
          <span className="text-xs font-black uppercase tracking-wider">
            {isRefreshing
              ? 'Refreshing...'
              : isReady
              ? 'Release to Refresh'
              : 'Pull down to refresh'}
          </span>
        </div>
      </div>

      {/* Gentle content displacement effect when pulled */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${Math.min(pullDistance * 0.3, 26)}px)` : undefined,
          transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)'
        }}
      >
        {children}
      </div>
    </div>
  );
}
