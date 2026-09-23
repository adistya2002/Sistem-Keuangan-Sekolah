import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { StudentPaymentRecord } from '../../types';
import { INITIAL_PROFILES } from '../../data/initialData';
import { 
  Printer, X, CheckCircle2, QrCode, 
  Share2, FileText, Settings, Sliders, 
  Check, Copy, MessageSquare,
  Sparkles, RefreshCw, Scissors, ChevronDown, CheckCheck,
  ArrowUpDown, ArrowLeftRight
} from 'lucide-react';
import { formatRupiah, terbilang, formatDateIndo } from '../../utils/formatters';
import { SchoolLogo } from '../common/SchoolLogo';
import { 
  PaperPresetId, 
  PageOrientation, 
  ReceiptLayoutMode, 
  DualDirection, 
  MarginOption, 
  MarginValues,
  STANDARD_PAPER_PRESETS as PAPER_PRESETS,
  getAutoMarginsForPreset,
  calculateEffectiveMargins
} from '../../utils/printHelpers';

export type { PaperPresetId, PageOrientation, ReceiptLayoutMode, DualDirection, MarginOption, MarginValues };
export { PAPER_PRESETS };

interface ReceiptModalProps {
  payment: StudentPaymentRecord | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, onClose }) => {
  const { state } = useApp();
  const printSheetRef = useRef<HTMLDivElement>(null);

  // Print Configuration States (Default: A4 2-Rangkap 1 Lembar)
  const [paperPreset, setPaperPreset] = useState<PaperPresetId>('A4');
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [layoutMode, setLayoutMode] = useState<ReceiptLayoutMode>('DUAL');
  const [dualDirection, setDualDirection] = useState<DualDirection>('auto');
  const [marginOption, setMarginOption] = useState<MarginOption>('auto');

  // Custom 4-Way Margins in mm (Top, Bottom, Left, Right)
  const [customMargins, setCustomMargins] = useState<MarginValues>({
    topMm: 6,
    bottomMm: 6,
    leftMm: 6,
    rightMm: 6,
  });
  
  // 1-Page Auto Scale & Fit Control
  const [isFitOnePage, setIsFitOnePage] = useState<boolean>(true);
  const [customScalePercent, setCustomScalePercent] = useState<number>(100);

  // Custom Paper Dimensions (in mm)
  const [customWidthMm, setCustomWidthMm] = useState<number>(210);
  const [customHeightMm, setCustomHeightMm] = useState<number>(297);

  // UI state for settings drawer / tabs
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showWaShare, setShowWaShare] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Handle Preset Change with Auto Configuration
  const handleSelectPreset = (presetId: PaperPresetId) => {
    setPaperPreset(presetId);
    const found = PAPER_PRESETS.find(p => p.id === presetId);
    if (found && presetId !== 'CUSTOM') {
      setOrientation(found.defaultOrientation);
      setLayoutMode(found.defaultLayout);
      setIsFitOnePage(true);
      if (found.defaultDualDirection) {
        setDualDirection(found.defaultDualDirection);
      }
      const autoM = getAutoMarginsForPreset(presetId, found.defaultOrientation, found.defaultLayout);
      setCustomMargins(autoM);
    }
  };

  // Keyboard shortcut: Ctrl+P / Cmd+P to print, Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        handlePrint();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paperPreset, orientation, layoutMode, isFitOnePage, marginOption, customMargins]);

  if (!payment) return null;

  const school = state.profiles?.[payment.unit] || INITIAL_PROFILES[payment.unit] || state.profiles?.TK || INITIAL_PROFILES.TK;

  // Derive city name from address or default to Sinjai
  const cityName = useMemo(() => {
    const addr = school.address || '';
    if (addr.toLowerCase().includes('sinjai')) return 'Sinjai';
    if (addr.toLowerCase().includes('jakarta')) return 'Jakarta';
    if (addr.toLowerCase().includes('makassar')) return 'Makassar';
    return 'Sinjai';
  }, [school.address]);

  // Dimensions computation
  const activeDimensions = useMemo(() => {
    let w = 210;
    let h = 297;
    if (paperPreset === 'CUSTOM') {
      w = customWidthMm;
      h = customHeightMm;
    } else {
      const p = PAPER_PRESETS.find(item => item.id === paperPreset);
      if (p) {
        w = p.widthMm;
        h = p.heightMm;
      }
    }

    // Apply orientation swap
    const isLandscape = orientation === 'landscape';
    const actualWidth = isLandscape ? Math.max(w, h) : Math.min(w, h);
    const actualHeight = isLandscape ? Math.min(w, h) : Math.max(w, h);

    return {
      widthMm: actualWidth,
      heightMm: actualHeight,
    };
  }, [paperPreset, orientation, customWidthMm, customHeightMm]);

  // Effective Dual Direction (Vertical vs Horizontal)
  const effectiveDualDirection = useMemo((): 'vertical' | 'horizontal' => {
    if (dualDirection === 'vertical') return 'vertical';
    if (dualDirection === 'horizontal') return 'horizontal';
    // Auto: If Landscape & width >= 210mm, side-by-side is best. If Portrait, vertical stacked is best.
    return orientation === 'landscape' && activeDimensions.widthMm >= 210 ? 'horizontal' : 'vertical';
  }, [dualDirection, orientation, activeDimensions]);

  // Active Effective Margins (Top, Bottom, Left, Right in mm)
  const activeMargins = useMemo<MarginValues>(() => {
    return calculateEffectiveMargins(
      marginOption,
      customMargins,
      paperPreset,
      orientation,
      layoutMode
    );
  }, [marginOption, customMargins, paperPreset, orientation, layoutMode]);

  // Density Level calculation based on Paper Size & Format
  const densityLevel = useMemo((): 'micro' | 'compact' | 'normal' => {
    const { widthMm, heightMm } = activeDimensions;
    if (layoutMode === 'DUAL') {
      if (effectiveDualDirection === 'vertical') {
        if (heightMm <= 230 || widthMm < 160) return 'micro'; // A5 Portrait 2-rangkap
        return 'compact'; // A4/F4/Letter Portrait 2-rangkap
      } else {
        // Horizontal side-by-side
        if (widthMm <= 220 || heightMm <= 140) return 'micro';
        return 'compact';
      }
    }
    if (layoutMode === 'SINGLE') {
      if (heightMm <= 110 || widthMm < 140) return 'micro';
      if (heightMm <= 160 || widthMm < 180) return 'compact';
      return 'normal';
    }
    return 'compact';
  }, [layoutMode, effectiveDualDirection, activeDimensions]);

  // Computed Auto Fit Scale Factor based on paper size & layout
  const computedScaleRatio = useMemo(() => {
    if (!isFitOnePage) {
      return customScalePercent / 100;
    }

    const { widthMm, heightMm } = activeDimensions;

    if (layoutMode === 'THERMAL') {
      if (widthMm <= 60) return 0.75;
      return 0.95;
    }

    if (layoutMode === 'DUAL') {
      if (effectiveDualDirection === 'vertical') {
        if (heightMm >= 320) return 1.0; // F4 Folio (330mm) - Full height
        if (heightMm >= 280) return 0.96; // A4 (297mm) / Letter
        if (heightMm >= 240) return 0.85; // B5 (250mm)
        return 0.72; // A5 Portrait
      } else {
        // Horizontal side-by-side (2 columns)
        if (widthMm >= 290) return 0.95; // A4 / F4 Landscape
        if (widthMm >= 210) return 0.88; // 1/2 Folio / A5 Landscape
        return 0.75;
      }
    }

    // SINGLE COPY
    if (heightMm <= 110) return 0.75; // 1/3 A4
    if (heightMm <= 160) return 0.92; // A5 Landscape (148mm)
    return 1.0; // A4 / F4
  }, [isFitOnePage, customScalePercent, activeDimensions, layoutMode, effectiveDualDirection]);

  // Dynamic CSS Style for strict 1-page printing with exact width and millimeter margins
  const dynamicPrintStyle = useMemo(() => {
    const { widthMm, heightMm } = activeDimensions;
    const isThermal = layoutMode === 'THERMAL';
    const scale = computedScaleRatio;
    const { topMm, bottomMm, leftMm, rightMm } = activeMargins;
    
    return `
      @page {
        size: ${isThermal ? `${widthMm}mm auto` : `${widthMm}mm ${heightMm}mm`};
        margin: 0;
      }
      @media print {
        @page {
          size: ${isThermal ? `${widthMm}mm auto` : `${widthMm}mm ${heightMm}mm`};
          margin: 0;
        }
        #root {
          display: none !important;
        }
        *, *::before, *::after {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        html, body {
          width: ${widthMm}mm !important;
          max-width: ${widthMm}mm !important;
          min-height: 100% !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
          background: #ffffff !important;
        }
        .no-print, footer, [role="contentinfo"], .app-footer, .print-footer, .modal-footer {
          display: none !important;
        }
        .print-receipt-modal-overlay {
          position: static !important;
          display: block !important;
          padding: 0 !important;
          margin: 0 !important;
          background: #ffffff !important;
          width: 100% !important;
          min-height: auto !important;
          overflow: visible !important;
          inset: auto !important;
        }
        .print-receipt-modal-card {
          border: none !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          background: #ffffff !important;
          width: 100% !important;
          max-width: 100% !important;
          max-height: none !important;
          overflow: visible !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .print-receipt-viewport {
          padding: 0 !important;
          margin: 0 !important;
          background: #ffffff !important;
          width: 100% !important;
          display: block !important;
          overflow: visible !important;
        }
        .receipt-print-sheet {
          width: ${widthMm}mm !important;
          max-width: ${widthMm}mm !important;
          min-height: ${isThermal ? 'auto' : `${heightMm}mm`} !important;
          height: auto !important;
          box-sizing: border-box !important;
          margin: 0 auto !important;
          padding-top: ${topMm}mm !important;
          padding-bottom: ${bottomMm}mm !important;
          padding-left: ${leftMm}mm !important;
          padding-right: ${rightMm}mm !important;
          border: none !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          background-color: #ffffff !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
          page-break-before: avoid !important;
          break-before: avoid !important;
        }
        .receipt-scale-wrapper {
          transform-origin: top center !important;
          transform: scale(${scale}) !important;
          width: ${100 / scale}% !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .dual-vertical-layout {
          width: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          gap: 6px !important;
          box-sizing: border-box !important;
        }
        .dual-horizontal-layout {
          width: 100% !important;
          display: flex !important;
          flex-direction: row !important;
          justify-content: space-between !important;
          align-items: stretch !important;
          gap: 10px !important;
          box-sizing: border-box !important;
        }
        .receipt-card-item {
          box-sizing: border-box !important;
          border: 2px solid #1e293b !important;
          border-radius: 12px !important;
          background-color: #ffffff !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      }
    `;
  }, [activeDimensions, activeMargins, layoutMode, computedScaleRatio]);

  // Robust Print Handler with iframe isolation & direct fallback
  const handlePrint = () => {
    setIsPrinting(true);
    
    // Method 1: Using an isolated hidden print iframe
    try {
      const printSheetElement = printSheetRef.current;
      if (printSheetElement) {
        const frameId = 'receipt-print-frame';
        let frame = document.getElementById(frameId) as HTMLIFrameElement | null;
        if (frame) {
          document.body.removeChild(frame);
        }
        frame = document.createElement('iframe');
        frame.id = frameId;
        frame.style.position = 'fixed';
        frame.style.right = '0';
        frame.style.bottom = '0';
        frame.style.width = '0px';
        frame.style.height = '0px';
        frame.style.border = 'none';
        frame.style.visibility = 'hidden';
        document.body.appendChild(frame);

        const frameDoc = frame.contentWindow?.document;
        if (frameDoc) {
          frameDoc.open();
          
          // Collect all current stylesheets & style tags from head
          let styleTagsHtml = '';
          document.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
            styleTagsHtml += node.outerHTML;
          });

          const isThermal = layoutMode === 'THERMAL';
          const { widthMm, heightMm } = activeDimensions;
          const { topMm, bottomMm, leftMm, rightMm } = activeMargins;

          frameDoc.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>Kwitansi - ${payment.receiptNumber}</title>
                ${styleTagsHtml}
                <style>
                  @page {
                    size: ${isThermal ? `${widthMm}mm auto` : `${widthMm}mm ${heightMm}mm`};
                    margin: 0;
                  }
                  @media print {
                    @page {
                      size: ${isThermal ? `${widthMm}mm auto` : `${widthMm}mm ${heightMm}mm`};
                      margin: 0;
                    }
                  }
                  html, body {
                    width: ${widthMm}mm !important;
                    max-width: ${widthMm}mm !important;
                    min-height: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    background: #ffffff !important;
                    color: #0f172a !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .receipt-print-sheet {
                    border: none !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    width: ${widthMm}mm !important;
                    max-width: ${widthMm}mm !important;
                    min-height: ${isThermal ? 'auto' : `${heightMm}mm`} !important;
                    margin: 0 auto !important;
                    padding-top: ${topMm}mm !important;
                    padding-bottom: ${bottomMm}mm !important;
                    padding-left: ${leftMm}mm !important;
                    padding-right: ${rightMm}mm !important;
                    box-sizing: border-box !important;
                  }
                  .receipt-card-item {
                    border: 2px solid #1e293b !important;
                    background-color: #ffffff !important;
                  }
                </style>
              </head>
              <body>
                ${printSheetElement.outerHTML}
              </body>
            </html>
          `);
          frameDoc.close();

          setTimeout(() => {
            try {
              frame?.contentWindow?.focus();
              frame?.contentWindow?.print();
            } catch (e) {
              window.print();
            }
            setIsPrinting(false);
          }, 350);
          return;
        }
      }
    } catch (e) {
      console.warn('Iframe print error, falling back to window.print', e);
    }

    // Direct fallback
    window.print();
    setIsPrinting(false);
  };

  // WhatsApp share text generator
  const waShareText = useMemo(() => {
    const dateFormatted = formatDateIndo(payment.date);
    const totalFormatted = formatRupiah(payment.totalAmount);
    
    let itemsText = '';
    if (payment.items && payment.items.length > 0) {
      itemsText = payment.items.map((it, idx) => `   ${idx + 1}. ${it.name}: ${formatRupiah(it.nominal)}`).join('\n');
    } else {
      itemsText = `• *Keperluan* : ${payment.paymentType === 'SPP_DSP' ? 'SPP & DSP' : payment.paymentType === 'SPP_DSP_ADM' ? 'SPP, DSP & Administrasi' : payment.paymentType} ${payment.sppMonths?.length ? `(Bulan: ${payment.sppMonths.join(', ')})` : ''} ${payment.otherFeeDetail || ''}`;
    }

    return `*KWITANSI PEMBAYARAN RESMI - ${school.name}*\n` +
      `----------------------------------------\n` +
      `• *No. Kwitansi* : ${payment.receiptNumber}\n` +
      `• *Tanggal* : ${dateFormatted}\n` +
      `• *Nama Siswa/Santri* : ${payment.studentName} (${payment.className})\n` +
      `• *Penyetor (Wali)* : ${payment.payerName}\n` +
      `• *Rincian Tagihan* :\n${itemsText}\n` +
      `• *Total Pembayaran* : *${totalFormatted}*\n` +
      `• *Terbilang* : _${terbilang(payment.totalAmount)}_\n` +
      `• *Metode Bayar* : ${payment.paymentMethod} ${payment.bankDestination ? `(${payment.bankDestination})` : ''}\n` +
      `• *Bendahara* : ${payment.treasurerName || school.treasurerName}\n` +
      `----------------------------------------\n` +
      `_Status: LUNAS & TERCATAT RESMI (Validasi: ${payment.receiptNumber})_\n` +
      `_Jazakumullahu Khairan Katsiran atas kerjasamanya._`;
  }, [payment, school]);

  const handleCopyWa = () => {
    navigator.clipboard.writeText(waShareText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenWaDirect = () => {
    const encoded = encodeURIComponent(waShareText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  // Compact or Standard Receipt Single Card with Dynamic Density
  const renderSingleReceiptCard = (copyLabel: string = 'LEMBAR 1: UNTUK WALI MURID (ASLI)', isCompact: boolean = false) => {
    const isMicro = densityLevel === 'micro';
    const isMini = isCompact || densityLevel === 'compact' || isMicro || computedScaleRatio < 0.88;

    return (
      <div 
        className={`receipt-card-item border-2 border-slate-800 bg-white rounded-xl text-slate-900 shadow-2xs page-break-inside-avoid relative overflow-hidden transition-all flex flex-col justify-between ${
          isMicro 
            ? 'p-2 sm:p-2.5 space-y-1.5 text-[9.5px]' 
            : isMini 
              ? 'p-3 sm:p-3.5 space-y-2 text-[10.5px]' 
              : 'p-4 sm:p-5 space-y-3 text-xs'
        }`}
      >
        {/* Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <div className="text-7xl sm:text-8xl font-black rotate-[-15deg] uppercase">{school.id} LUNAS</div>
        </div>

        {/* Header Kop */}
        <div className={`flex items-center justify-between border-b-2 border-slate-800 relative z-10 ${
          isMicro ? 'pb-1' : 'pb-1.5 sm:pb-2'
        }`}>
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className={`rounded-full bg-white border border-slate-300 p-0.5 flex items-center justify-center shadow-xs shrink-0 ${
              isMicro ? 'w-7 h-7' : isMini ? 'w-9 h-9' : 'w-11 h-11 sm:w-12 sm:h-12'
            }`}>
              <SchoolLogo unit={payment.unit} className="w-full h-full object-contain" />
            </div>
            <div>
              <p className={`font-semibold tracking-wider text-slate-500 uppercase ${
                isMicro ? 'text-[7.5px]' : isMini ? 'text-[8.5px]' : 'text-[9.5px]'
              }`}>
                {school.foundation || 'YAYASAN THORIQUL JANNAH SINJAI'}
              </p>
              <h2 className={`font-black text-slate-900 leading-tight ${
                isMicro ? 'text-xs' : isMini ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
              }`}>
                {school.name}
              </h2>
              <p className={`text-slate-500 line-clamp-1 ${
                isMicro ? 'text-[7px]' : isMini ? 'text-[8px]' : 'text-[9px]'
              }`}>
                {school.address} • Telp/WA: {school.phone || '-'}
              </p>
            </div>
          </div>

          {/* Receipt Number & Date Box */}
          <div className="text-right shrink-0">
            <div className="inline-block bg-emerald-100 text-slate-900 border border-emerald-400 font-mono font-extrabold px-2.5 py-0.5 rounded text-[10px] sm:text-xs tracking-wider shadow-2xs">
              KWITANSI RESMI
            </div>
            <p className="font-mono font-bold text-slate-800 text-[10px] sm:text-xs mt-0.5">
              No: {payment.receiptNumber}
            </p>
            <p className="text-[9px] text-slate-500">
              Tgl: {formatDateIndo(payment.date)}
            </p>
          </div>
        </div>

        {/* Copy Indicator Tag */}
        <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-250">
          <span className="flex items-center gap-1 text-emerald-800 font-extrabold uppercase">
            <CheckCheck className="w-3 h-3 text-emerald-600" />
            <span>{copyLabel}</span>
          </span>
          <span className="text-slate-500 font-mono">Unit: {school.id}</span>
        </div>

        {/* Main Content Info Grid */}
        <div className={`space-y-1 relative z-10 ${isMicro ? 'text-[9px]' : isMini ? 'text-[10px]' : 'text-xs'}`}>
          <div className="grid grid-cols-12 gap-1 py-0.5 border-b border-dashed border-slate-250">
            <span className="col-span-3 text-slate-500 font-medium">Telah terima dari</span>
            <span className="col-span-9 font-bold text-slate-900">: {payment.payerName} <span className="text-slate-500 font-normal">(Wali dari: {payment.studentName} / {payment.className})</span></span>
          </div>

          <div className="grid grid-cols-12 gap-1 py-0.5 border-b border-dashed border-slate-250">
            <span className="col-span-3 text-slate-500 font-medium">Uang Sejumlah</span>
            <span className="col-span-9 font-bold text-emerald-800 italic bg-emerald-50/80 px-1 py-0.5 rounded border border-emerald-100/80">
              : "{terbilang(payment.totalAmount)} Rupiah"
            </span>
          </div>

          {/* Payment breakdown items */}
          <div className="grid grid-cols-12 gap-1 py-0.5 border-b border-slate-250 items-start">
            <span className="col-span-3 text-slate-500 font-medium">Untuk Pembayaran</span>
            <div className="col-span-9">
              {payment.items && payment.items.length > 0 ? (
                <div className="space-y-0.5">
                  {payment.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                      <span className="font-semibold text-slate-800">• {it.name}</span>
                      <span className="font-mono font-bold text-slate-900">{formatRupiah(it.nominal)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="font-semibold text-slate-800">
                  : {payment.paymentType === 'SPP_DSP' ? 'SPP & DSP' : payment.paymentType === 'SPP_DSP_ADM' ? 'SPP, DSP & Administrasi' : payment.paymentType}
                  {payment.sppMonths && payment.sppMonths.length > 0 && ` (Bulan: ${payment.sppMonths.join(', ')})`}
                  {payment.otherFeeDetail && ` - ${payment.otherFeeDetail}`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Total & Signatures */}
        <div className={`grid grid-cols-12 gap-2 items-end pt-1 relative z-10 ${
          isMicro ? 'mt-0.5' : isMini ? 'mt-1' : 'mt-2'
        }`}>
          {/* Left: Total Amount Box */}
          <div className="col-span-5 sm:col-span-6 space-y-1">
            <div className="bg-emerald-100 border-2 border-emerald-400 text-slate-900 p-1.5 sm:p-2 rounded-lg shadow-2xs flex items-center justify-between">
              <span className="text-[8px] sm:text-[9.5px] uppercase font-bold text-slate-900">Total Lunas:</span>
              <span className={`font-mono font-black text-slate-900 ${
                isMicro ? 'text-xs' : isMini ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
              }`}>
                {formatRupiah(payment.totalAmount)}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-slate-500">
              <span className="px-1 py-0.2 bg-slate-100 rounded border border-slate-300 font-semibold text-slate-700">
                {payment.paymentMethod} {payment.bankDestination ? `(${payment.bankDestination})` : ''}
              </span>
              <span>• Status: <strong className="text-emerald-700">LUNAS TERCATAT</strong></span>
            </div>
          </div>

          {/* Right: Signatures Block */}
          <div className="col-span-7 sm:col-span-6 text-right space-y-0.5">
            <p className="text-[8.5px] sm:text-[9.5px] text-slate-500">
              {cityName}, {formatDateIndo(payment.date)}
            </p>
            <p className="text-[8px] sm:text-[9px] font-semibold text-slate-700">
              Bendahara Penerima,
            </p>
            
            {/* Signature Space / Digital Stamp */}
            <div className="h-7 sm:h-9 flex items-center justify-end pr-2">
              <div className="flex items-center gap-1 border border-emerald-600/40 bg-emerald-50/50 px-1.5 py-0.5 rounded text-[7.5px] sm:text-[8px] text-emerald-800 font-mono font-bold">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                <span>TERVERIFIKASI SISTEM</span>
              </div>
            </div>

            <p className="font-bold text-slate-900 underline text-[9px] sm:text-[10px]">
              ( {payment.treasurerName || school.treasurerName} )
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="border-t border-slate-200 pt-0.5 flex justify-between text-[7px] sm:text-[8px] text-slate-400 font-mono">
          <span>* Simpan bukti pembayaran ini sebagai tanda bukti resmi yang sah.</span>
          <span>Dicetak: {new Date().toLocaleDateString('id-ID')}</span>
        </div>
      </div>
    );
  };

  // Thermal Mini Receipt Layout
  const renderThermalReceipt = () => {
    const is58 = activeDimensions.widthMm <= 60;
    return (
      <div 
        className={`bg-white text-black font-mono shadow-md border border-slate-300 mx-auto text-center page-break-inside-avoid ${
          is58 ? 'w-[56mm] p-1.5 text-[9px]' : 'w-[76mm] p-3 text-[10.5px]'
        }`}
      >
        <div className="flex justify-center mb-1">
          <div className="w-8 h-8 rounded-full border border-slate-300 p-0.5 flex items-center justify-center">
            <SchoolLogo unit={payment.unit} className="w-full h-full object-contain" />
          </div>
        </div>
        <h3 className="font-bold text-xs uppercase leading-tight">{school.name}</h3>
        <p className="text-[8px] text-slate-600 leading-tight">{school.address}</p>
        <p className="text-[8px] text-slate-600 mb-1">Telp: {school.phone || '-'}</p>

        <div className="border-t border-b border-dashed border-black py-1 my-1 text-left text-[9px] space-y-0.5">
          <div className="flex justify-between">
            <span>No. Kwitansi:</span>
            <span className="font-bold">{payment.receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Tgl:</span>
            <span>{formatDateIndo(payment.date)}</span>
          </div>
          <div className="flex justify-between">
            <span>Santri/Siswa:</span>
            <span className="font-bold truncate max-w-[120px]">{payment.studentName}</span>
          </div>
          <div className="flex justify-between">
            <span>Kelas:</span>
            <span>{payment.className}</span>
          </div>
          <div className="flex justify-between">
            <span>Penyetor:</span>
            <span>{payment.payerName}</span>
          </div>
        </div>

        {/* Items */}
        <div className="text-left text-[9px] border-b border-dashed border-black pb-1 mb-1 space-y-0.5">
          {payment.items && payment.items.length > 0 ? (
            payment.items.map((it, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{it.name}</span>
                <span className="font-bold">{formatRupiah(it.nominal)}</span>
              </div>
            ))
          ) : (
            <div className="flex justify-between">
              <span>{payment.paymentType}</span>
              <span className="font-bold">{formatRupiah(payment.totalAmount)}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between text-xs font-black py-1 border-b border-black text-black">
          <span>TOTAL LUNAS:</span>
          <span>{formatRupiah(payment.totalAmount)}</span>
        </div>

        <div className="text-[8px] text-slate-600 my-1 text-left">
          <span>Metode: {payment.paymentMethod} • Status: LUNAS</span>
        </div>

        {/* Footer */}
        <div className="text-[8px] mt-2 space-y-0.5">
          <p className="font-bold">*** JAZAKUMULLAHU KHAIRAN ***</p>
          <p>Simpan struk ini sebagai bukti pembayaran sah.</p>
          <p className="text-[7px] text-slate-500">Bendahara: {payment.treasurerName || school.treasurerName}</p>
        </div>
      </div>
    );
  };

  const selectedPresetObj = PAPER_PRESETS.find(p => p.id === paperPreset) || PAPER_PRESETS[0];

  const modalContent = (
    <>
      {/* Inject strictly scoped @page and print media CSS */}
      <style dangerouslySetInnerHTML={{ __html: dynamicPrintStyle }} />

      {/* Main Modal Backdrop */}
      <div 
        id="receipt-modal-backdrop" 
        className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 print-receipt-modal-overlay"
      >
        <div 
          id="receipt-modal-card" 
          className="bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden print-receipt-modal-card"
        >
          
          {/* Top Control Bar (No Print) */}
          <div className="bg-slate-900 text-white p-3.5 sm:px-6 sm:py-3 flex items-center justify-between gap-2 border-b border-slate-800 shrink-0 no-print">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-xs shrink-0">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white truncate">Cetak & Bagikan Kwitansi Resmi</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 shrink-0">
                    No: {payment.receiptNumber}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {school.name} • {payment.studentName} ({payment.className})
                </p>
              </div>
            </div>

            {/* Top Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* WhatsApp Share Button */}
              <button
                type="button"
                onClick={() => setShowWaShare(!showWaShare)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                  showWaShare 
                    ? 'bg-emerald-600 text-white border-emerald-400' 
                    : 'bg-slate-800 text-emerald-400 border-emerald-600/40 hover:bg-emerald-950'
                }`}
                title="Bagikan Teks Kwitansi via WhatsApp ke Wali Murid"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kirim WA</span>
              </button>

              {/* Full Settings Drawer Toggle */}
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                  showSettings 
                    ? 'bg-slate-700 text-emerald-400 border-emerald-500/50' 
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
                title="Atur Format Kertas, Rangkap & Margin Lengkap"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Pengaturan Kertas & Margin</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
              </button>

              {/* Main Print Button */}
              <button
                type="button"
                id="btn-print-receipt-modal"
                onClick={handlePrint}
                disabled={isPrinting}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-102 disabled:opacity-50"
                title="Cetak Kwitansi Sekarang (Pas 1 Halaman Sesuai Kertas & Margin)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isPrinting ? 'Menyiapkan...' : 'Cetak Sekarang'}</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Paper Preset Selector Bar */}
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 text-slate-200 flex items-center justify-between gap-2 overflow-x-auto no-print">
            <div className="flex items-center gap-1.5 flex-nowrap shrink-0 text-xs">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kertas:</span>
              </span>

              {PAPER_PRESETS.slice(0, 6).map(preset => {
                const isSelected = paperPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs font-bold'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                    <span>{preset.shortName}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="px-2 py-1 rounded-lg text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-slate-900 border border-slate-700 hover:bg-slate-700 whitespace-nowrap"
              >
                + Pilihan Lain
              </button>
            </div>

            <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-300 shrink-0 font-mono">
              <span className="text-slate-400">
                Margin: T:<strong className="text-white">{activeMargins.topMm}</strong> B:<strong className="text-white">{activeMargins.bottomMm}</strong> L:<strong className="text-white">{activeMargins.leftMm}</strong> R:<strong className="text-white">{activeMargins.rightMm}mm</strong>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-300 font-sans font-bold">{isFitOnePage ? '✓ Auto Pas 1 Halaman' : `Skala ${customScalePercent}%`}</span>
            </div>
          </div>

          {/* Collapsible Full Paper & Scaling Settings Drawer (No Print) */}
          {showSettings && (
            <div className="bg-slate-900 text-slate-200 border-b border-slate-700 p-4 transition-all duration-200 no-print animate-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                
                {/* 1. Paper Preset Selector */}
                <div>
                  <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                    1. Ukuran Kertas Pilihan
                  </label>
                  <select
                    value={paperPreset}
                    onChange={(e) => handleSelectPreset(e.target.value as PaperPresetId)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                  >
                    {PAPER_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name} [{preset.tag}]
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {selectedPresetObj.description}
                  </p>
                </div>

                {/* 2. Format & Layout Mode */}
                <div>
                  <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                    2. Format Rangkap
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setLayoutMode('SINGLE')}
                      className={`py-1 text-center rounded text-[11px] font-semibold transition-colors ${
                        layoutMode === 'SINGLE' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      1 Lembar
                    </button>
                    <button
                      type="button"
                      onClick={() => setLayoutMode('DUAL')}
                      className={`py-1 text-center rounded text-[11px] font-semibold transition-colors ${
                        layoutMode === 'DUAL' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      2 Rangkap
                    </button>
                    <button
                      type="button"
                      onClick={() => setLayoutMode('THERMAL')}
                      className={`py-1 text-center rounded text-[11px] font-semibold transition-colors ${
                        layoutMode === 'THERMAL' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Thermal
                    </button>
                  </div>
                  
                  {/* Secondary Layout Controls */}
                  <div className="flex flex-col gap-1 mt-1.5 text-[10px] text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Orientasi Kertas:</span>
                      <div className="flex gap-1.5">
                        <button 
                          type="button" 
                          onClick={() => setOrientation('portrait')}
                          className={`px-1.5 py-0.5 rounded ${orientation === 'portrait' ? 'bg-slate-700 text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          Tegak (Portrait)
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setOrientation('landscape')}
                          className={`px-1.5 py-0.5 rounded ${orientation === 'landscape' ? 'bg-slate-700 text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          Mendatar (Landscape)
                        </button>
                      </div>
                    </div>

                    {layoutMode === 'DUAL' && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
                        <span>Posisi 2 Rangkap:</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setDualDirection('auto')}
                            className={`px-1.5 py-0.5 rounded text-[9px] ${dualDirection === 'auto' ? 'bg-emerald-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            Auto
                          </button>
                          <button
                            type="button"
                            onClick={() => setDualDirection('vertical')}
                            className={`px-1.5 py-0.5 rounded text-[9px] ${dualDirection === 'vertical' ? 'bg-emerald-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            Atas-Bawah
                          </button>
                          <button
                            type="button"
                            onClick={() => setDualDirection('horizontal')}
                            className={`px-1.5 py-0.5 rounded text-[9px] ${dualDirection === 'horizontal' ? 'bg-emerald-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            Kiri-Kanan
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Scale & 1-Page Guarantee */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      3. Skala Cetak (1 Halaman)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFitOnePage(true);
                        setCustomScalePercent(100);
                      }}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Auto Pas</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="50"
                      max="140"
                      step="5"
                      value={isFitOnePage ? Math.round(computedScaleRatio * 100) : customScalePercent}
                      onChange={(e) => {
                        setIsFitOnePage(false);
                        setCustomScalePercent(Number(e.target.value));
                      }}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-emerald-400 text-xs w-10 text-right">
                      {Math.round(computedScaleRatio * 100)}%
                    </span>
                  </div>

                  <div className="flex gap-1 mt-1 text-[10px]">
                    {[100, 90, 80, 75].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          setIsFitOnePage(false);
                          setCustomScalePercent(pct);
                        }}
                        className="px-1.5 py-0.5 rounded bg-slate-950 hover:bg-slate-700 text-slate-300 font-mono"
                      >
                        {pct}%
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIsFitOnePage(true)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isFitOnePage ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-300'
                      }`}
                    >
                      Auto Pas
                    </button>
                  </div>
                </div>

                {/* 4. Margin Atas, Bawah, Kiri, Kanan (mm) */}
                <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="block text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                      4. Margin Kertas (mm)
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      T:{activeMargins.topMm} B:{activeMargins.bottomMm} L:{activeMargins.leftMm} R:{activeMargins.rightMm}
                    </span>
                  </div>

                  {/* Margin Mode Presets */}
                  <div className="grid grid-cols-5 gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMarginOption('auto');
                        const autoM = getAutoMarginsForPreset(paperPreset, orientation, layoutMode);
                        setCustomMargins(autoM);
                      }}
                      className={`py-1 px-0.5 rounded border text-[10px] font-bold text-center ${
                        marginOption === 'auto'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                      title="Otomatis menyesuaikan kertas"
                    >
                      ✓ Auto
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMarginOption('normal');
                        setCustomMargins({ topMm: 8, bottomMm: 8, leftMm: 8, rightMm: 8 });
                      }}
                      className={`py-1 px-0.5 rounded border text-[10px] font-semibold text-center ${
                        marginOption === 'normal'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      8mm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMarginOption('compact');
                        setCustomMargins({ topMm: 4, bottomMm: 4, leftMm: 4, rightMm: 4 });
                      }}
                      className={`py-1 px-0.5 rounded border text-[10px] font-semibold text-center ${
                        marginOption === 'compact'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      4mm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMarginOption('none');
                        setCustomMargins({ topMm: 0, bottomMm: 0, leftMm: 0, rightMm: 0 });
                      }}
                      className={`py-1 px-0.5 rounded border text-[10px] font-semibold text-center ${
                        marginOption === 'none'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      0mm
                    </button>
                    <button
                      type="button"
                      onClick={() => setMarginOption('custom')}
                      className={`py-1 px-0.5 rounded border text-[10px] font-semibold text-center ${
                        marginOption === 'custom'
                          ? 'bg-amber-600 text-white border-amber-500 font-bold'
                          : 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800'
                      }`}
                    >
                      Kustom
                    </button>
                  </div>

                  {/* 4 Interactive Controls for Atas, Bawah, Kiri, Kanan */}
                  <div className="grid grid-cols-4 gap-1 pt-1.5 border-t border-slate-800/80 mt-1">
                    <div className="bg-slate-900 p-1 rounded border border-slate-800 text-center">
                      <span className="text-[9px] text-slate-400 block font-semibold">Atas</span>
                      <input
                        type="number"
                        min={0}
                        max={40}
                        value={activeMargins.topMm}
                        onChange={(e) => {
                          setMarginOption('custom');
                          setCustomMargins(prev => ({ ...prev, topMm: Math.max(0, Number(e.target.value)) }));
                        }}
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded p-0.5 text-[11px] font-mono text-center"
                      />
                    </div>
                    <div className="bg-slate-900 p-1 rounded border border-slate-800 text-center">
                      <span className="text-[9px] text-slate-400 block font-semibold">Bawah</span>
                      <input
                        type="number"
                        min={0}
                        max={40}
                        value={activeMargins.bottomMm}
                        onChange={(e) => {
                          setMarginOption('custom');
                          setCustomMargins(prev => ({ ...prev, bottomMm: Math.max(0, Number(e.target.value)) }));
                        }}
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded p-0.5 text-[11px] font-mono text-center"
                      />
                    </div>
                    <div className="bg-slate-900 p-1 rounded border border-slate-800 text-center">
                      <span className="text-[9px] text-slate-400 block font-semibold">Kiri</span>
                      <input
                        type="number"
                        min={0}
                        max={40}
                        value={activeMargins.leftMm}
                        onChange={(e) => {
                          setMarginOption('custom');
                          setCustomMargins(prev => ({ ...prev, leftMm: Math.max(0, Number(e.target.value)) }));
                        }}
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded p-0.5 text-[11px] font-mono text-center"
                      />
                    </div>
                    <div className="bg-slate-900 p-1 rounded border border-slate-800 text-center">
                      <span className="text-[9px] text-slate-400 block font-semibold">Kanan</span>
                      <input
                        type="number"
                        min={0}
                        max={40}
                        value={activeMargins.rightMm}
                        onChange={(e) => {
                          setMarginOption('custom');
                          setCustomMargins(prev => ({ ...prev, rightMm: Math.max(0, Number(e.target.value)) }));
                        }}
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded p-0.5 text-[11px] font-mono text-center"
                      />
                    </div>
                  </div>

                </div>

              </div>

              {/* Custom Paper Dimension Inputs (Visible when 'CUSTOM' selected) */}
              {paperPreset === 'CUSTOM' && (
                <div className="mt-3 pt-3 border-t border-slate-750 bg-slate-950/80 p-3 rounded-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-400 text-xs">Atur Ukuran Kustom:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-400">Lebar:</span>
                        <input
                          type="number"
                          min="40"
                          max="500"
                          value={customWidthMm}
                          onChange={(e) => setCustomWidthMm(Math.max(40, Number(e.target.value)))}
                          className="w-18 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono text-center"
                        />
                        <span className="text-[11px] text-slate-400">mm</span>
                      </div>

                      <span className="text-slate-500">×</span>

                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-400">Tinggi:</span>
                        <input
                          type="number"
                          min="40"
                          max="500"
                          value={customHeightMm}
                          onChange={(e) => setCustomHeightMm(Math.max(40, Number(e.target.value)))}
                          className="w-18 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono text-center"
                        />
                        <span className="text-[11px] text-slate-400">mm</span>
                      </div>
                    </div>

                    {/* Quick Custom Presets */}
                    <div className="flex items-center gap-1 flex-wrap text-[10px]">
                      <span className="text-slate-400">Pilihan cepat:</span>
                      <button
                        type="button"
                        onClick={() => { setCustomWidthMm(210); setCustomHeightMm(100); setOrientation('landscape'); }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      >
                        1/3 HVS (210×100)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setCustomWidthMm(165); setCustomHeightMm(105); setOrientation('landscape'); }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      >
                        Blangko (165×105)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setCustomWidthMm(215); setCustomHeightMm(165); setOrientation('landscape'); }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      >
                        1/2 Folio (215×165)
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* WhatsApp Share Panel Modal/Drawer */}
          {showWaShare && (
            <div className="bg-emerald-950 text-emerald-100 p-4 border-b border-emerald-800 no-print animate-in slide-in-from-top duration-150">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs text-white">Bagikan Bukti Kwitansi WhatsApp</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWaShare(false)}
                  className="text-emerald-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <textarea
                readOnly
                rows={4}
                value={waShareText}
                className="w-full bg-emerald-900/60 border border-emerald-700 rounded-lg p-2.5 text-xs text-emerald-100 font-mono mb-2 focus:outline-none"
              />

              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] text-emerald-300">
                  Penyetor: <strong>{payment.payerName}</strong> ({payment.studentName})
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyWa}
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Tersalin!' : 'Salin Teks'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenWaDirect}
                    className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Buka WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Printable Sheet Viewport Area */}
          <div className="p-3 sm:p-5 overflow-y-auto overflow-x-auto flex-1 bg-slate-200/90 flex flex-col items-center justify-start print-receipt-viewport relative">
            
            {/* Real-time Paper Dimension & Auto-Width Header Badge (No Print) */}
            <div className="no-print w-full max-w-[850px] mb-2.5 flex items-center justify-between flex-wrap gap-2 text-[10px] text-slate-600 px-1 font-mono">
              <div className="flex items-center gap-1.5 bg-white/95 px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Ukuran Kertas:</span>
                <strong className="text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {activeDimensions.widthMm} × {activeDimensions.heightMm} mm
                </strong>
                <span className="text-slate-400">|</span>
                <span>Margin: Atas <strong>{activeMargins.topMm}mm</strong>, Bawah <strong>{activeMargins.bottomMm}mm</strong>, Kiri <strong>{activeMargins.leftMm}mm</strong>, Kanan <strong>{activeMargins.rightMm}mm</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] bg-slate-900 text-emerald-300 font-semibold px-2.5 py-1 rounded-lg shadow-2xs">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Margin & Ukuran Otomatis Menyesuaikan Kertas</span>
              </div>
            </div>

            {/* The Print Sheet Container (Dynamically Sized to Exact Paper Width & Height with Active Margins) */}
            <div 
              ref={printSheetRef}
              className="receipt-print-sheet bg-white shadow-xl rounded-xl border border-slate-300 my-auto transition-all duration-200"
              style={{
                width: `${activeDimensions.widthMm}mm`,
                maxWidth: '100%',
                minHeight: layoutMode === 'THERMAL' ? 'auto' : `${activeDimensions.heightMm}mm`,
                paddingTop: `${activeMargins.topMm}mm`,
                paddingBottom: `${activeMargins.bottomMm}mm`,
                paddingLeft: `${activeMargins.leftMm}mm`,
                paddingRight: `${activeMargins.rightMm}mm`,
                boxSizing: 'border-box',
              }}
            >
              
              {/* Scale Wrapper (Ensures 1-Page Fitting on Print & Screen) */}
              <div 
                className="receipt-scale-wrapper w-full h-full flex flex-col justify-between"
                style={{
                  transformOrigin: 'top center',
                  transform: computedScaleRatio !== 1 ? `scale(${computedScaleRatio})` : undefined,
                  width: computedScaleRatio !== 1 ? `${100 / computedScaleRatio}%` : '100%',
                }}
              >
                
                {/* 1. SINGLE COPY LAYOUT */}
                {layoutMode === 'SINGLE' && (
                  <div className="w-full">
                    {renderSingleReceiptCard('LEMBAR ASLI: UNTUK WALI MURID / PENYETOR', false)}
                  </div>
                )}

                {/* 2. DUAL COPY LAYOUT (2 Rangkap Otomatis Pas 1 Halaman Kertas Pilihan) */}
                {layoutMode === 'DUAL' && (
                  effectiveDualDirection === 'horizontal' ? (
                    <div className="dual-horizontal-layout w-full h-full flex flex-row items-stretch justify-between gap-3">
                      {/* Lembar 1: Wali Murid */}
                      <div className="flex-1 flex flex-col min-w-0">
                        {renderSingleReceiptCard('LEMBAR 1: UNTUK WALI (ASLI)', true)}
                      </div>

                      {/* Vertical Dotted Cut Line */}
                      <div className="relative flex flex-col items-center justify-center select-none shrink-0 px-1">
                        <div className="absolute inset-y-0 left-1/2 border-l-2 border-dashed border-slate-400"></div>
                        <div className="relative bg-white py-2 px-1 rounded flex flex-col items-center justify-center gap-1 text-slate-500 text-[8.5px] font-bold shadow-2xs border border-slate-300">
                          <Scissors className="w-3.5 h-3.5 rotate-90" />
                          <span className="[writing-mode:vertical-rl] tracking-wider uppercase font-mono">Potong Di Sini</span>
                        </div>
                      </div>

                      {/* Lembar 2: Arsip Bendahara */}
                      <div className="flex-1 flex flex-col min-w-0">
                        {renderSingleReceiptCard('LEMBAR 2: ARSIP BENDAHARA', true)}
                      </div>
                    </div>
                  ) : (
                    <div className="dual-vertical-layout w-full h-full flex flex-col justify-between space-y-1.5 sm:space-y-2">
                      {/* Lembar 1: Wali Murid */}
                      <div className="flex-1 flex flex-col">
                        {renderSingleReceiptCard('LEMBAR 1: UNTUK WALI MURID (ASLI)', true)}
                      </div>

                      {/* Horizontal Dotted Cut Line */}
                      <div className="relative py-0.5 text-center text-slate-400 text-[9px] font-mono select-none shrink-0">
                        <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-slate-400"></div>
                        <span className="relative bg-white px-3 py-0.5 flex items-center justify-center gap-1.5 w-fit mx-auto text-slate-600 font-bold border border-slate-300 rounded-full shadow-2xs text-[8.5px]">
                          <Scissors className="w-3 h-3 text-slate-500" />
                          <span>Gunting di sini untuk arsip pembukuan bendahara</span>
                        </span>
                      </div>

                      {/* Lembar 2: Arsip Bendahara */}
                      <div className="flex-1 flex flex-col">
                        {renderSingleReceiptCard('LEMBAR 2: ARSIP BUKU KAS BENDAHARA', true)}
                      </div>
                    </div>
                  )
                )}

                {/* 3. THERMAL RECEIPT LAYOUT */}
                {layoutMode === 'THERMAL' && (
                  <div className="w-full flex justify-center">
                    {renderThermalReceipt()}
                  </div>
                )}

              </div>

            </div>

          </div>

        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};
