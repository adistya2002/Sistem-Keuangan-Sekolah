export type PaperPresetId = 
  | 'A4' 
  | 'F4' 
  | 'A5' 
  | 'LETTER' 
  | 'B5' 
  | 'NOTA_HALF' 
  | 'NOTA_THIRD' 
  | 'THERMAL_80' 
  | 'THERMAL_58' 
  | 'CUSTOM';

export type ReceiptLayoutMode = 'SINGLE' | 'DUAL' | 'THERMAL';
export type DualDirection = 'auto' | 'vertical' | 'horizontal';
export type PageOrientation = 'portrait' | 'landscape';
export type MarginOption = 'auto' | 'compact' | 'normal' | 'wide' | 'none' | 'custom';

export interface MarginValues {
  topMm: number;
  bottomMm: number;
  leftMm: number;
  rightMm: number;
}

export interface PaperPreset {
  id: PaperPresetId;
  name: string;
  shortName: string;
  widthMm: number;
  heightMm: number;
  defaultOrientation: PageOrientation;
  defaultLayout: ReceiptLayoutMode;
  defaultDualDirection?: DualDirection;
  tag: string;
  description: string;
}

export const STANDARD_PAPER_PRESETS: PaperPreset[] = [
  {
    id: 'A4',
    name: 'A4 (21 x 29.7 cm) - Standar Resmi',
    shortName: 'A4 Standar',
    widthMm: 210,
    heightMm: 297,
    defaultOrientation: 'portrait',
    defaultLayout: 'DUAL',
    defaultDualDirection: 'vertical',
    tag: 'Standar Dokumen / Kwitansi 2 Rangkap',
    description: 'Ukuran kertas standar internasional HVS/Fotocopy untuk Kwitansi, BKU, & Laporan RAPBS',
  },
  {
    id: 'F4',
    name: 'F4 / Folio / HVS Panjang (21.5 x 33 cm)',
    shortName: 'F4 / Folio',
    widthMm: 215,
    heightMm: 330,
    defaultOrientation: 'portrait',
    defaultLayout: 'DUAL',
    defaultDualDirection: 'vertical',
    tag: 'Standar Sekolah / Kantor',
    description: 'Kertas Folio HVS panjang standar administrasi sekolah untuk Kwitansi & Laporan',
  },
  {
    id: 'A5',
    name: 'A5 (14.8 x 21 cm) - Kompak Hemat',
    shortName: 'A5 Kompak',
    widthMm: 148,
    heightMm: 210,
    defaultOrientation: 'landscape',
    defaultLayout: 'SINGLE',
    defaultDualDirection: 'horizontal',
    tag: 'Populer 1/2 HVS',
    description: 'Ukuran setengah A4 hemat kertas, sangat cocok untuk kwitansi tunggal & nota mini',
  },
  {
    id: 'LETTER',
    name: 'Letter / Kuarto (21.6 x 27.9 cm)',
    shortName: 'Letter / Kuarto',
    widthMm: 216,
    heightMm: 279,
    defaultOrientation: 'portrait',
    defaultLayout: 'DUAL',
    defaultDualDirection: 'vertical',
    tag: 'Kuarto Standar',
    description: 'Ukuran standar letter/kuarto untuk printer kantor dan cetak laporan',
  },
  {
    id: 'B5',
    name: 'B5 (17.6 x 25 cm) - Ukuran Buku',
    shortName: 'B5 Buku',
    widthMm: 176,
    heightMm: 250,
    defaultOrientation: 'portrait',
    defaultLayout: 'SINGLE',
    defaultDualDirection: 'vertical',
    tag: 'Buku / Catatan',
    description: 'Ukuran kertas sedang proporsional antara A4 dan A5',
  },
  {
    id: 'NOTA_HALF',
    name: '1/2 Folio / Continuous (24 x 14 cm)',
    shortName: '1/2 Folio',
    widthMm: 241,
    heightMm: 140,
    defaultOrientation: 'landscape',
    defaultLayout: 'SINGLE',
    defaultDualDirection: 'horizontal',
    tag: 'Continuous / Faktur',
    description: 'Kertas slip continuous / faktur dot matrix atau 1/2 folio mendatar',
  },
  {
    id: 'NOTA_THIRD',
    name: '1/3 A4 / Slip Panjang (21 x 10 cm)',
    shortName: '1/3 A4 Slip',
    widthMm: 210,
    heightMm: 100,
    defaultOrientation: 'landscape',
    defaultLayout: 'SINGLE',
    defaultDualDirection: 'horizontal',
    tag: 'Slip Ringkas',
    description: '1 lembar A4 dipotong 3 bagian mendatar, sangat hemat untuk slip SPP bulanan',
  },
  {
    id: 'THERMAL_80',
    name: 'Struk Thermal 80mm (POS Kasir)',
    shortName: 'Thermal 80mm',
    widthMm: 80,
    heightMm: 200,
    defaultOrientation: 'portrait',
    defaultLayout: 'THERMAL',
    defaultDualDirection: 'vertical',
    tag: 'Printer Kasir 80mm',
    description: 'Struk gulung printer POS thermal 80mm untuk loket pembayaran cepat',
  },
  {
    id: 'THERMAL_58',
    name: 'Struk Thermal 58mm (Mini Bluetooth POS)',
    shortName: 'Thermal 58mm',
    widthMm: 58,
    heightMm: 160,
    defaultOrientation: 'portrait',
    defaultLayout: 'THERMAL',
    defaultDualDirection: 'vertical',
    tag: 'Mini Bluetooth',
    description: 'Struk gulung printer bluetooth mini 58mm portabel',
  },
  {
    id: 'CUSTOM',
    name: '📐 Ukuran Kustom (P x L & Margin Bebas)',
    shortName: 'Kustom Bebas',
    widthMm: 210,
    heightMm: 297,
    defaultOrientation: 'portrait',
    defaultLayout: 'DUAL',
    defaultDualDirection: 'vertical',
    tag: 'Kustom mm/cm',
    description: 'Tentukan dimensi panjang, lebar, dan margin (atas, bawah, kiri, kanan) secara bebas',
  },
];

/**
 * Calculates optimal auto margins (top, bottom, left, right in mm) based on paper preset,
 * orientation, and layout mode.
 */
export function getAutoMarginsForPreset(
  presetId: PaperPresetId,
  orientation: PageOrientation,
  layoutMode?: ReceiptLayoutMode
): MarginValues {
  // Thermal paper presets
  if (presetId === 'THERMAL_58' || (layoutMode === 'THERMAL' && presetId.startsWith('THERMAL_58'))) {
    return { topMm: 1.5, bottomMm: 1.5, leftMm: 1, rightMm: 1 };
  }
  if (presetId === 'THERMAL_80' || layoutMode === 'THERMAL') {
    return { topMm: 2, bottomMm: 2, leftMm: 2, rightMm: 2 };
  }

  // Mini slips
  if (presetId === 'NOTA_THIRD') {
    return { topMm: 3, bottomMm: 3, leftMm: 4, rightMm: 4 };
  }
  if (presetId === 'NOTA_HALF') {
    return { topMm: 4, bottomMm: 4, leftMm: 5, rightMm: 5 };
  }

  // A5
  if (presetId === 'A5') {
    if (orientation === 'landscape') {
      return { topMm: 5, bottomMm: 5, leftMm: 6, rightMm: 6 };
    }
    return { topMm: 6, bottomMm: 6, leftMm: 6, rightMm: 6 };
  }

  // B5
  if (presetId === 'B5') {
    if (orientation === 'landscape') {
      return { topMm: 5, bottomMm: 5, leftMm: 7, rightMm: 7 };
    }
    return { topMm: 7, bottomMm: 7, leftMm: 7, rightMm: 7 };
  }

  // F4 / Folio (215 x 330 mm)
  if (presetId === 'F4') {
    if (orientation === 'landscape') {
      return { topMm: 6, bottomMm: 6, leftMm: 8, rightMm: 8 };
    }
    return { topMm: 8, bottomMm: 8, leftMm: 8, rightMm: 8 };
  }

  // Letter
  if (presetId === 'LETTER') {
    if (orientation === 'landscape') {
      return { topMm: 6, bottomMm: 6, leftMm: 8, rightMm: 8 };
    }
    return { topMm: 8, bottomMm: 8, leftMm: 8, rightMm: 8 };
  }

  // A4 and default Custom
  if (orientation === 'landscape') {
    return { topMm: 6, bottomMm: 6, leftMm: 8, rightMm: 8 };
  }
  return { topMm: 8, bottomMm: 8, leftMm: 8, rightMm: 8 };
}

/**
 * Resolves effective margins based on the chosen MarginOption and custom overrides.
 */
export function calculateEffectiveMargins(
  marginOption: MarginOption,
  customMargins: MarginValues,
  presetId: PaperPresetId,
  orientation: PageOrientation,
  layoutMode?: ReceiptLayoutMode
): MarginValues {
  const auto = getAutoMarginsForPreset(presetId, orientation, layoutMode);

  switch (marginOption) {
    case 'none':
      return { topMm: 0, bottomMm: 0, leftMm: 0, rightMm: 0 };
    case 'compact':
      if (presetId.startsWith('THERMAL')) {
        return { topMm: 1, bottomMm: 1, leftMm: 1, rightMm: 1 };
      }
      return {
        topMm: Math.max(2, Math.round(auto.topMm * 0.5)),
        bottomMm: Math.max(2, Math.round(auto.bottomMm * 0.5)),
        leftMm: Math.max(3, Math.round(auto.leftMm * 0.5)),
        rightMm: Math.max(3, Math.round(auto.rightMm * 0.5)),
      };
    case 'normal':
      if (presetId.startsWith('THERMAL')) {
        return { topMm: 2.5, bottomMm: 2.5, leftMm: 2, rightMm: 2 };
      }
      return {
        topMm: 8,
        bottomMm: 8,
        leftMm: 8,
        rightMm: 8,
      };
    case 'wide':
      if (presetId.startsWith('THERMAL')) {
        return { topMm: 3, bottomMm: 3, leftMm: 2.5, rightMm: 2.5 };
      }
      return {
        topMm: 12,
        bottomMm: 12,
        leftMm: 12,
        rightMm: 12,
      };
    case 'custom':
      return {
        topMm: Math.max(0, customMargins.topMm ?? auto.topMm),
        bottomMm: Math.max(0, customMargins.bottomMm ?? auto.bottomMm),
        leftMm: Math.max(0, customMargins.leftMm ?? auto.leftMm),
        rightMm: Math.max(0, customMargins.rightMm ?? auto.rightMm),
      };
    case 'auto':
    default:
      return auto;
  }
}
