import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Printer, X, Sliders, ChevronDown, RefreshCw, Check, FileText,
  Maximize2, ArrowUpDown, ArrowLeftRight
} from 'lucide-react';
import { 
  PaperPresetId, 
  PageOrientation, 
  MarginOption, 
  MarginValues,
  STANDARD_PAPER_PRESETS,
  getAutoMarginsForPreset,
  calculateEffectiveMargins
} from '../../utils/printHelpers';

export { STANDARD_PAPER_PRESETS };
export type { PaperPresetId, PageOrientation, MarginOption, MarginValues };

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badgeText?: string;
  defaultPreset?: PaperPresetId;
  defaultOrientation?: PageOrientation;
  defaultFitOnePage?: boolean;
  children: React.ReactNode;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badgeText = '1-Page Auto Fit',
  defaultPreset = 'A4',
  defaultOrientation = 'portrait',
  defaultFitOnePage = true,
  children,
}) => {
  // Print Configuration States
  const [paperPreset, setPaperPreset] = useState<PaperPresetId>(defaultPreset);
  const [orientation, setOrientation] = useState<PageOrientation>(defaultOrientation);
  const [marginOption, setMarginOption] = useState<MarginOption>('auto');
  
  // Custom Margins in mm (Top, Bottom, Left, Right)
  const [customMargins, setCustomMargins] = useState<MarginValues>({
    topMm: 8,
    bottomMm: 8,
    leftMm: 8,
    rightMm: 8,
  });

  // 1-Page Auto Scale & Fit Control
  const [isFitOnePage, setIsFitOnePage] = useState<boolean>(defaultFitOnePage);
  const [customScalePercent, setCustomScalePercent] = useState<number>(100);

  // Custom Paper Dimensions (in mm)
  const [customWidthMm, setCustomWidthMm] = useState<number>(210);
  const [customHeightMm, setCustomHeightMm] = useState<number>(297);

  // UI state for settings drawer
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const printSheetRef = useRef<HTMLDivElement>(null);

  // Sync state with props when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      const preset = (defaultPreset as PaperPresetId) || 'A4';
      const orient = (defaultOrientation as PageOrientation) || 'portrait';
      setPaperPreset(preset);
      setOrientation(orient);
      setIsFitOnePage(defaultFitOnePage);
      setMarginOption('auto');
      const autoM = getAutoMarginsForPreset(preset, orient);
      setCustomMargins(autoM);
    }
  }, [isOpen, defaultPreset, defaultOrientation, defaultFitOnePage]);

  // Handle Preset Change
  const handleSelectPreset = (presetId: PaperPresetId) => {
    setPaperPreset(presetId);
    const found = STANDARD_PAPER_PRESETS.find(p => p.id === presetId);
    if (found && presetId !== 'CUSTOM') {
      setOrientation(found.defaultOrientation);
      const autoM = getAutoMarginsForPreset(presetId, found.defaultOrientation);
      setCustomMargins(autoM);
    }
  };

  // Dimensions computation
  const activeDimensions = useMemo(() => {
    let w = 210;
    let h = 297;
    if (paperPreset === 'CUSTOM') {
      w = customWidthMm;
      h = customHeightMm;
    } else {
      const p = STANDARD_PAPER_PRESETS.find(item => item.id === paperPreset);
      if (p) {
        w = p.widthMm;
        h = p.heightMm;
      }
    }

    // Apply orientation swap if needed
    const isLandscape = orientation === 'landscape';
    const actualWidth = isLandscape ? Math.max(w, h) : Math.min(w, h);
    const actualHeight = isLandscape ? Math.min(w, h) : Math.max(w, h);

    return {
      widthMm: actualWidth,
      heightMm: actualHeight,
    };
  }, [paperPreset, orientation, customWidthMm, customHeightMm]);

  // Active Effective Margins (Top, Bottom, Left, Right in mm)
  const activeMargins = useMemo<MarginValues>(() => {
    return calculateEffectiveMargins(
      marginOption,
      customMargins,
      paperPreset,
      orientation
    );
  }, [marginOption, customMargins, paperPreset, orientation]);

  // Computed Auto Fit Scale Factor based on paper size & orientation
  const computedScaleRatio = useMemo(() => {
    if (!isFitOnePage) {
      return customScalePercent / 100;
    }

    const { widthMm, heightMm } = activeDimensions;

    if (paperPreset.startsWith('THERMAL')) {
      return widthMm <= 60 ? 0.65 : 0.85;
    }

    if (paperPreset === 'A5') {
      return orientation === 'landscape' ? 0.80 : 0.72;
    }

    if (paperPreset === 'NOTA_HALF' || paperPreset === 'NOTA_THIRD') {
      return 0.75;
    }

    if (paperPreset === 'B5') {
      return 0.88;
    }

    // A4 / F4 / LETTER
    if (orientation === 'landscape') {
      return 0.92;
    }

    if (heightMm <= 220) {
      return 0.85;
    }
    return 0.95;
  }, [isFitOnePage, customScalePercent, activeDimensions, paperPreset, orientation]);

  // Dynamic CSS Style for strict printing - 100% matches selected paper & screen
  const dynamicPrintStyle = useMemo(() => {
    const { widthMm, heightMm } = activeDimensions;
    const isThermal = paperPreset.startsWith('THERMAL');
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
          width: 100% !important;
          max-width: 100% !important;
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
          backdrop-filter: none !important;
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
          display: block !important;
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
          page-break-inside: auto !important;
          break-inside: auto !important;
        }
        .receipt-scale-wrapper {
          transform-origin: top left !important;
          transform: ${scale !== 1 ? `scale(${scale})` : 'none'} !important;
          width: ${scale !== 1 ? `${100 / scale}%` : '100%'} !important;
          box-sizing: border-box !important;
          display: block !important;
        }
        table {
          width: 100% !important;
          page-break-inside: auto !important;
          break-inside: auto !important;
          border-collapse: collapse !important;
        }
        tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        thead {
          display: table-header-group !important;
        }
        tfoot {
          display: table-footer-group !important;
        }
        .print-signature-block {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      }
    `;
  }, [activeDimensions, activeMargins, computedScaleRatio, paperPreset]);

  if (!isOpen) return null;

  const handlePrint = () => {
    setIsPrinting(true);
    
    // Method 1: Using an isolated hidden print iframe for pristine rendering and exact paper margins
    try {
      const printSheetElement = printSheetRef.current;
      if (printSheetElement) {
        const frameId = 'reports-print-frame';
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

          const isThermal = paperPreset.startsWith('THERMAL');
          const { widthMm, heightMm } = activeDimensions;
          const { topMm, bottomMm, leftMm, rightMm } = activeMargins;
          const scale = computedScaleRatio;

          frameDoc.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>${title}</title>
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
                    width: 100% !important;
                    max-width: 100% !important;
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
                    background: #ffffff !important;
                  }
                  .receipt-scale-wrapper {
                    transform-origin: top left !important;
                    transform: ${scale !== 1 ? `scale(${scale})` : 'none'} !important;
                    width: ${scale !== 1 ? `${100 / scale}%` : '100%'} !important;
                    box-sizing: border-box !important;
                  }
                  table {
                    width: 100% !important;
                    page-break-inside: auto !important;
                    break-inside: auto !important;
                    border-collapse: collapse !important;
                  }
                  tr {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                  }
                  thead {
                    display: table-header-group !important;
                  }
                  tfoot {
                    display: table-footer-group !important;
                  }
                  .print-signature-block {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
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

  const selectedPresetObj = STANDARD_PAPER_PRESETS.find(p => p.id === paperPreset) || STANDARD_PAPER_PRESETS[0];

  const modalContent = (
    <>
      {/* Inject strictly scoped @page and print media CSS */}
      <style dangerouslySetInnerHTML={{ __html: dynamicPrintStyle }} />

      {/* Main Modal Backdrop */}
      <div 
        id="print-preview-modal-root"
        className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 print-receipt-modal-overlay"
      >
        <div 
          id="print-preview-card" 
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
                  <h3 className="font-bold text-sm text-white truncate">{title}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 shrink-0">
                    {badgeText}
                  </span>
                </div>
                {subtitle && (
                  <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* Quick Paper Preset Selector in Top Bar */}
              <div className="hidden lg:flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                {(['A4', 'F4', 'A5', 'LETTER', 'B5', 'THERMAL_80'] as PaperPresetId[]).map((pId) => {
                  const preset = STANDARD_PAPER_PRESETS.find(p => p.id === pId);
                  const isSelected = paperPreset === pId;
                  return (
                    <button
                      key={pId}
                      type="button"
                      onClick={() => handleSelectPreset(pId)}
                      className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                        isSelected 
                          ? 'bg-emerald-600 text-white shadow-xs' 
                          : 'text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                      title={preset?.name}
                    >
                      {pId === 'F4' ? 'F4 / Folio' : pId === 'THERMAL_80' ? 'Struk 80mm' : pId}
                    </button>
                  );
                })}
              </div>

              {/* Quick Orientation Toggle */}
              <div className="hidden sm:flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                    orientation === 'portrait' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                  title="Tegak (Portrait)"
                >
                  Tegak
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                    orientation === 'landscape' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                  title="Mendatar (Landscape)"
                >
                  Mendatar
                </button>
              </div>

              {/* Toggle Full Settings Drawer */}
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                  showSettings 
                    ? 'bg-slate-700 text-emerald-400 border-emerald-500/50' 
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
                title="Atur Ukuran Kertas & Margin (Atas, Bawah, Kiri, Kanan) Lengkap"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pengaturan Kertas & Margin</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
              </button>

              {/* Print Button */}
              <button
                type="button"
                id="btn-print-now-modal"
                onClick={handlePrint}
                disabled={isPrinting}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-102 disabled:opacity-50"
                title="Cetak Dokumen Sekarang (Pas Sesuai Kertas & Margin)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isPrinting ? 'Menyiapkan...' : 'Cetak Sekarang'}</span>
              </button>

              {/* Close Modal Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Tutup Pratinjau"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Margin & Paper Info Bar */}
          <div className="bg-slate-800 px-4 py-1.5 border-b border-slate-750 text-slate-300 flex items-center justify-between text-[11px] no-print">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-400">📄 {selectedPresetObj.name}</span>
              <span className="text-slate-500">•</span>
              <span>{orientation === 'portrait' ? 'Tegak (Portrait)' : 'Mendatar (Landscape)'}</span>
            </div>
            <div className="flex items-center gap-3 font-mono">
              <span className="text-slate-400">
                Margin: Atas <strong className="text-white">{activeMargins.topMm}mm</strong> • 
                Bawah <strong className="text-white">{activeMargins.bottomMm}mm</strong> • 
                Kiri <strong className="text-white">{activeMargins.leftMm}mm</strong> • 
                Kanan <strong className="text-white">{activeMargins.rightMm}mm</strong>
              </span>
              <span className="text-emerald-400 font-sans font-bold">
                {isFitOnePage ? `✓ Skala Auto ${Math.round(computedScaleRatio * 100)}%` : `Skala ${customScalePercent}%`}
              </span>
            </div>
          </div>

          {/* Config Settings Accordion / Drawer (No Print) */}
          <div className="no-print">
            {showSettings && (
              <div className="bg-slate-850 text-slate-200 p-4 border-b border-slate-700 animate-in slide-in-from-top-2 duration-150 bg-slate-900">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  
                  {/* Column 1: Paper Presets */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300 block uppercase tracking-wider text-[10px]">
                      1. Ukuran Kertas:
                    </label>
                    <select
                      value={paperPreset}
                      onChange={(e) => handleSelectPreset(e.target.value as PaperPresetId)}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-semibold"
                    >
                      {STANDARD_PAPER_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name} [{preset.tag}]
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400">
                      {selectedPresetObj.description}
                    </p>

                    {/* Custom Paper Size Input Fields */}
                    {paperPreset === 'CUSTOM' && (
                      <div className="pt-2 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block">Lebar (mm):</label>
                          <input
                            type="number"
                            value={customWidthMm}
                            onChange={(e) => setCustomWidthMm(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 text-white rounded p-1 text-xs font-mono text-center"
                            min={40}
                            max={500}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block">Tinggi (mm):</label>
                          <input
                            type="number"
                            value={customHeightMm}
                            onChange={(e) => setCustomHeightMm(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 text-white rounded p-1 text-xs font-mono text-center"
                            min={40}
                            max={500}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Column 2: Orientation */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300 block uppercase tracking-wider text-[10px]">
                      2. Orientasi Halaman:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOrientation('portrait');
                          if (marginOption === 'auto') {
                            setCustomMargins(getAutoMarginsForPreset(paperPreset, 'portrait'));
                          }
                        }}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          orientation === 'portrait'
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        Tegak (Portrait)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOrientation('landscape');
                          if (marginOption === 'auto') {
                            setCustomMargins(getAutoMarginsForPreset(paperPreset, 'landscape'));
                          }
                        }}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          orientation === 'landscape'
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        Mendatar (Landscape)
                      </button>
                    </div>

                    <div className="pt-2">
                      <label className="font-bold text-slate-300 block uppercase tracking-wider text-[10px] mb-1">
                        Skala Pas 1 Halaman:
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setIsFitOnePage(true)}
                          className={`flex-1 py-1.5 rounded-lg border text-[11px] font-bold ${
                            isFitOnePage ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 border-slate-700 text-slate-300'
                          }`}
                        >
                          Auto Pas
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsFitOnePage(false)}
                          className={`flex-1 py-1.5 rounded-lg border text-[11px] font-bold ${
                            !isFitOnePage ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 border-slate-700 text-slate-300'
                          }`}
                        >
                          Manual ({customScalePercent}%)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Auto & 4-Direction Margins (Atas, Bawah, Kiri, Kanan) */}
                  <div className="space-y-1.5 md:col-span-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-emerald-400 block uppercase tracking-wider text-[10px]">
                        3. Margin Atas, Bawah, Kiri & Kanan (mm):
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Aktif: T:{activeMargins.topMm} B:{activeMargins.bottomMm} L:{activeMargins.leftMm} R:{activeMargins.rightMm}mm
                      </span>
                    </div>

                    {/* Margin Mode Presets */}
                    <div className="grid grid-cols-5 gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMarginOption('auto');
                          const autoM = getAutoMarginsForPreset(paperPreset, orientation);
                          setCustomMargins(autoM);
                        }}
                        className={`py-1 px-1 rounded border text-[10px] font-bold text-center ${
                          marginOption === 'auto'
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                        title="Otomatis menyesuaikan jenis kertas & orientasi"
                      >
                        ✓ Otomatis
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMarginOption('normal');
                          setCustomMargins({ topMm: 8, bottomMm: 8, leftMm: 8, rightMm: 8 });
                        }}
                        className={`py-1 px-1 rounded border text-[10px] font-semibold text-center ${
                          marginOption === 'normal'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        Standar (8mm)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMarginOption('compact');
                          setCustomMargins({ topMm: 4, bottomMm: 4, leftMm: 4, rightMm: 4 });
                        }}
                        className={`py-1 px-1 rounded border text-[10px] font-semibold text-center ${
                          marginOption === 'compact'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        Tipis (4mm)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMarginOption('none');
                          setCustomMargins({ topMm: 0, bottomMm: 0, leftMm: 0, rightMm: 0 });
                        }}
                        className={`py-1 px-1 rounded border text-[10px] font-semibold text-center ${
                          marginOption === 'none'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        Nol (0mm)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMarginOption('custom')}
                        className={`py-1 px-1 rounded border text-[10px] font-semibold text-center ${
                          marginOption === 'custom'
                            ? 'bg-amber-600 text-white border-amber-500 font-bold'
                            : 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800'
                        }`}
                      >
                        Kustom mm
                      </button>
                    </div>

                    {/* 4 Interactive Input Boxes for Margins: Top, Bottom, Left, Right */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 mt-2">
                      {/* Top Margin */}
                      <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="flex items-center gap-1 font-semibold text-slate-300">
                            <ArrowUpDown className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Atas:</span>
                          </span>
                          <span className="font-mono font-bold text-white">{activeMargins.topMm} mm</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setMarginOption('custom');
                              setCustomMargins(prev => ({ ...prev, topMm: Math.max(0, prev.topMm - 1) }));
                            }}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={activeMargins.topMm}
                            onChange={(e) => {
                              setMarginOption('custom');
                              setCustomMargins(prev => ({ ...prev, topMm: Math.max(0, Number(e.target.value)) }));
                            }}
                            className="w-full bg-slate-950 border border-slate-700 text-white rounded px-1 py-0.5 text-xs text-center font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setMarginOption('custom');
                              setCustomMargins(prev => ({ ...prev, topMm: prev.topMm + 1 }));
                            }}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Bottom Margin */}
                      <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="flex items-center gap-1 font-semibold text-slate-300">
                            <ArrowUpDown className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Bawah:</span>
                          </span>
                          <span className="font-mono font-bold text-white">{activeMargins.bottomMm} mm</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setMarginOption('custom');
                              setCustomMargins(prev => ({ ...prev, bottomMm: Math.max(0, prev.bottomMm - 1) }));
                            }}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={activeMargins.bottomMm}
                            onChange={(e) => {
                              setMarginOption('custom');
                              setCustomMargins(prev => ({ ...prev, bottomMm: Math.max(0, Number(e.target.value)) }));
                            }}
                            className="w-full bg-slate-950 border border-slate-700 text-white rounded px-1 py-0.5 text-xs text-center font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setMarginOption('custom');
                              setCustomMargins(prev => ({ ...prev, bottomMm: prev.bottomMm + 1 }));
                            }}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Left Margin */}
                      <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="flex items-center gap-1 font-semibold text-slate-300">
                            <ArrowLeftRight className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Kiri:</span>
                          </span>
                          <span className="font-mono font-bold text-white">{activeMargins.leftMm} mm</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setMarginOption('custom');
                              setCustomMargins(prev => ({ ...prev, leftMm: Math.max(0, prev.leftMm - 1) }));
                            }}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={activeMargins.leftMm}
                            onChange={(e) => {
                              setMarginOption('custom');
                              setCustomMargins(prev => ({ ...prev, leftMm: Math.max(0, Number(e.target.value)) }));
                            }}
                            className="w-full bg-slate-950 border border-slate-700 text-white rounded px-1 py-0.5 text-xs text-center font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setMarginOption('custom');
                              setCustomMargins(prev => ({ ...prev, leftMm: prev.leftMm + 1 }));
                            }}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Right Margin */}
                      <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="flex items-center gap-1 font-semibold text-slate-300">
                            <ArrowLeftRight className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Kanan:</span>
                          </span>
                          <span className="font-mono font-bold text-white">{activeMargins.rightMm} mm</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setMarginOption('custom');
                              setCustomMargins(prev => ({ ...prev, rightMm: Math.max(0, prev.rightMm - 1) }));
                            }}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={activeMargins.rightMm}
                            onChange={(e) => {
                              setMarginOption('custom');
                              setCustomMargins(prev => ({ ...prev, rightMm: Math.max(0, Number(e.target.value)) }));
                            }}
                            className="w-full bg-slate-950 border border-slate-700 text-white rounded px-1 py-0.5 text-xs text-center font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setMarginOption('custom');
                              setCustomMargins(prev => ({ ...prev, rightMm: prev.rightMm + 1 }));
                            }}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* Printable Sheet Viewport Area */}
          <div className="p-4 sm:p-6 overflow-auto flex-1 bg-slate-200/80 flex items-start justify-center print-receipt-viewport">
            
            {/* The Print Sheet Container */}
            <div 
              ref={printSheetRef}
              className="receipt-print-sheet bg-white shadow-xl rounded-xl border border-slate-300 my-auto transition-all text-slate-900"
              style={{
                width: `${activeDimensions.widthMm}mm`,
                minHeight: paperPreset.startsWith('THERMAL') ? 'auto' : `${activeDimensions.heightMm}mm`,
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
                  transformOrigin: 'top left',
                  transform: computedScaleRatio !== 1 ? `scale(${computedScaleRatio})` : undefined,
                  width: computedScaleRatio !== 1 ? `${100 / computedScaleRatio}%` : '100%',
                }}
              >
                {children}
              </div>

            </div>

          </div>

        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};
