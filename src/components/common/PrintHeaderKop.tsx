import React from 'react';
import { SchoolProfile } from '../../types';
import { SchoolLogo } from './SchoolLogo';

interface PrintHeaderKopProps {
  profile: SchoolProfile;
  documentTitle?: string;
  documentNumber?: string;
}

export const PrintHeaderKop: React.FC<PrintHeaderKopProps> = ({
  profile,
  documentTitle,
  documentNumber,
}) => {
  return (
    <div className="border-b-2 border-slate-900 pb-3 mb-4 select-none">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: School Emblem Badge & Info */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white border border-slate-300 p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
            <SchoolLogo unit={profile.id} size={52} />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">
              {profile.foundation}
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 uppercase leading-tight tracking-tight">
              {profile.name}
            </div>
            <div className="text-[9px] text-slate-600 mt-0.5 leading-snug">
              NPSN: {profile.npsn} • {profile.address} • Telp: {profile.phone}
            </div>
          </div>
        </div>

        {/* Right: Document Badge/Number */}
        {documentNumber && (
          <div className="text-right shrink-0">
            <div className="inline-block px-2.5 py-1 bg-slate-100 text-slate-900 border border-slate-300 rounded-md font-mono font-bold text-[10px]">
              {documentNumber}
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-tight">
              DOKUMEN RESMI
            </div>
          </div>
        )}

      </div>

      {documentTitle && (
        <div className="mt-3 pt-2 border-t border-dashed border-slate-300 text-center font-black uppercase text-xs sm:text-sm tracking-wide text-slate-900">
          {documentTitle}
        </div>
      )}
    </div>
  );
};
