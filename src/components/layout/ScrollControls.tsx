import React, { useState, useEffect, useCallback } from 'react';
import { ChevronUp, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';

export const ScrollControls: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Helper to find the scrollable container
  const getScrollContainer = useCallback(() => {
    const mainEl = document.querySelector('main');
    if (mainEl && mainEl.scrollHeight > mainEl.clientHeight) {
      return mainEl;
    }
    return document.documentElement || document.body;
  }, []);

  const handleScrollUpdate = useCallback(() => {
    const mainEl = document.querySelector('main');
    let scrollTop = 0;
    let scrollHeight = 0;
    let clientHeight = 0;

    if (mainEl && mainEl.scrollHeight > mainEl.clientHeight) {
      scrollTop = mainEl.scrollTop;
      scrollHeight = mainEl.scrollHeight;
      clientHeight = mainEl.clientHeight;
    } else {
      scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0;
      clientHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    }

    const maxScroll = Math.max(1, scrollHeight - clientHeight);
    const progress = Math.min(100, Math.max(0, Math.round((scrollTop / maxScroll) * 100)));

    setScrollProgress(progress);
    setCanScrollUp(scrollTop > 20);
    setCanScrollDown(scrollTop < maxScroll - 20);
    
    // Visible if content is scrollable
    setIsVisible(scrollHeight > clientHeight + 40);
  }, []);

  useEffect(() => {
    const mainEl = document.querySelector('main');
    
    handleScrollUpdate();

    const handleWindowScroll = () => handleScrollUpdate();
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    window.addEventListener('resize', handleWindowScroll, { passive: true });

    if (mainEl) {
      mainEl.addEventListener('scroll', handleScrollUpdate, { passive: true });
    }

    // Interval observer to catch dynamic layout changes
    const timer = setInterval(handleScrollUpdate, 600);

    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
      window.removeEventListener('resize', handleWindowScroll);
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleScrollUpdate);
      }
      clearInterval(timer);
    };
  }, [handleScrollUpdate]);

  const scrollToTop = () => {
    const mainEl = document.querySelector('main');
    if (mainEl && mainEl.scrollHeight > mainEl.clientHeight) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    const mainEl = document.querySelector('main');
    if (mainEl && mainEl.scrollHeight > mainEl.clientHeight) {
      mainEl.scrollTo({ top: mainEl.scrollHeight, behavior: 'smooth' });
    }
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  const scrollStepUp = () => {
    const mainEl = document.querySelector('main');
    const step = 350;
    if (mainEl && mainEl.scrollHeight > mainEl.clientHeight) {
      mainEl.scrollBy({ top: -step, behavior: 'smooth' });
    } else {
      window.scrollBy({ top: -step, behavior: 'smooth' });
    }
  };

  const scrollStepDown = () => {
    const mainEl = document.querySelector('main');
    const step = 350;
    if (mainEl && mainEl.scrollHeight > mainEl.clientHeight) {
      mainEl.scrollBy({ top: step, behavior: 'smooth' });
    } else {
      window.scrollBy({ top: step, behavior: 'smooth' });
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      id="scroll-navigation-widget"
      className="fixed bottom-6 right-5 z-40 flex flex-col items-center gap-1.5 p-1.5 bg-[#2D2821]/90 backdrop-blur-md text-white rounded-2xl shadow-xl border border-[#D9D1C2]/30 transition-all duration-200 hover:scale-105"
      role="navigation"
      aria-label="Navigasi Scroll Halaman"
    >
      {/* Panah Atas (Scroll ke Atas) */}
      <button
        id="btn-scroll-top"
        type="button"
        onClick={scrollToTop}
        onDoubleClick={scrollStepUp}
        disabled={!canScrollUp}
        title="Scroll ke Paling Atas (Klik untuk ke puncak)"
        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
          canScrollUp 
            ? 'bg-[#8B9D83] hover:bg-[#7A8C72] text-white shadow-xs cursor-pointer active:scale-95' 
            : 'bg-white/10 text-white/40 cursor-not-allowed'
        }`}
      >
        <ArrowUp className="w-4 h-4 stroke-[2.5]" />
      </button>

      {/* Indikator Persentase Scroll */}
      <div 
        className="text-[10px] font-mono font-bold text-[#E9E3D8] px-1 py-0.5 select-none"
        title={`Posisi scroll: ${scrollProgress}%`}
      >
        {scrollProgress}%
      </div>

      {/* Panah Bawah (Scroll ke Bawah) */}
      <button
        id="btn-scroll-bottom"
        type="button"
        onClick={scrollToBottom}
        onDoubleClick={scrollStepDown}
        disabled={!canScrollDown}
        title="Scroll ke Paling Bawah (Klik untuk ke dasar halaman)"
        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
          canScrollDown 
            ? 'bg-[#8B9D83] hover:bg-[#7A8C72] text-white shadow-xs cursor-pointer active:scale-95' 
            : 'bg-white/10 text-white/40 cursor-not-allowed'
        }`}
      >
        <ArrowDown className="w-4 h-4 stroke-[2.5]" />
      </button>
    </div>
  );
};
