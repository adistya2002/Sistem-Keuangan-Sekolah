import React, { useId } from 'react';
import { SchoolUnitType } from '../../types';

interface SchoolLogoProps {
  className?: string;
  size?: number | string;
  unit?: SchoolUnitType | 'SUPER' | 'YAYASAN' | 'ALL' | string;
  topText?: string;
  bottomText?: string;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  className = '',
  size = 48,
  unit = 'TK',
  topText,
  bottomText
}) => {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '_');

  // Gradient and path unique IDs
  const domeGradId = `domeGrad_${uid}`;
  const handGradId = `handGrad_${uid}`;
  const quranGradLeftId = `quranGradLeft_${uid}`;
  const quranGradRightId = `quranGradRight_${uid}`;
  const topCurveId = `topCurve_${uid}`;
  const bottomCurveId = `bottomCurve_${uid}`;

  // Determine top and bottom text based on unit or custom prop
  let finalTopText = topText;
  let finalBottomText = bottomText;

  if (!finalTopText) {
    if (unit === 'RQ') {
      finalTopText = "RUMAH QUR'AN";
    } else if (unit === 'KB') {
      finalTopText = 'KELOMPOK BERMAIN';
    } else if (unit === 'SD') {
      finalTopText = 'SD IT';
    } else if (unit === 'SMP') {
      finalTopText = 'SMP IT';
    } else if (unit === 'SMA') {
      finalTopText = 'SMA IT';
    } else if (unit === 'SUPER' || unit === 'YAYASAN' || unit === 'ALL') {
      finalTopText = 'YAYASAN';
    } else {
      finalTopText = 'TK ISLAM';
    }
  }

  if (!finalBottomText) {
    if (unit === 'SUPER' || unit === 'YAYASAN' || unit === 'ALL' || unit === 'SD' || unit === 'SMP' || unit === 'SMA') {
      finalBottomText = 'THORIQUL JANNAH SINJAI';
    } else {
      finalBottomText = 'THORIQUL JANNAH';
    }
  }

  // Adjust font size and spacing based on text length for arc harmony
  const topFontSize = finalTopText.length > 14 ? 26 : finalTopText.length > 10 ? 32 : finalTopText.length > 8 ? 36 : 40;
  const topLetterSpacing = finalTopText.length > 14 ? '0.08em' : finalTopText.length > 10 ? '0.12em' : finalTopText.length > 8 ? '0.16em' : '0.22em';

  // Bottom font size and spacing
  const bottomFontSize = finalBottomText.length > 20 ? 25 : finalBottomText.length > 16 ? 32 : 38;
  const bottomLetterSpacing = finalBottomText.length > 20 ? '0.08em' : finalBottomText.length > 16 ? '0.11em' : '0.16em';

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 500 500"
        width={size}
        height={size}
        className="w-full h-full drop-shadow-xs"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={domeGradId} x1="250" y1="120" x2="250" y2="300" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#84CC16" />
            <stop offset="60%" stopColor="#65A30D" />
            <stop offset="100%" stopColor="#4D7C0F" />
          </linearGradient>

          <linearGradient id={handGradId} x1="250" y1="200" x2="250" y2="380" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#84CC16" />
            <stop offset="100%" stopColor="#4D7C0F" />
          </linearGradient>

          <linearGradient id={quranGradLeftId} x1="210" y1="230" x2="250" y2="320" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>

          <linearGradient id={quranGradRightId} x1="290" y1="230" x2="250" y2="320" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>

          {/* Curved text paths */}
          <path id={topCurveId} d="M 60,250 A 190,190 0 0,1 440,250" fill="none" />
          <path id={bottomCurveId} d="M 60,260 A 190,190 0 0,0 440,260" fill="none" />
        </defs>

        {/* Circular Background Glow/Badge */}
        <circle cx="250" cy="250" r="236" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />

        {/* Crescent & Star at Mosque Top */}
        <g transform="translate(250, 105)">
          <path
            d="M 0,-14 A 14,14 0 1,1 -10,10 A 10,10 0 1,0 0,-14 Z"
            fill="#84CC16"
          />
          {/* 5-pointed Star */}
          <polygon
            points="4,-2 6,3 11,3 7,7 9,12 4,9 0,12 1,7 -3,3 2,3"
            fill="#84CC16"
          />
        </g>

        {/* Mosque Main Dome */}
        <path
          d="M 250,118 
             C 285,140 320,185 320,240 
             L 180,240 
             C 180,185 215,140 250,118 Z"
          fill={`url(#${domeGradId})`}
        />

        {/* Dome White Arch Accent */}
        <path
          d="M 250,170 
             C 275,188 300,215 305,240 
             L 195,240 
             C 200,215 225,188 250,170 Z"
          fill="#FFFFFF"
          fillOpacity="0.3"
        />

        {/* Left Small Minaret Dome */}
        <path
          d="M 160,202 
             C 172,210 182,222 182,240 
             L 138,240 
             C 138,222 148,210 160,202 Z"
          fill="#65A30D"
        />
        <rect x="140" y="240" width="40" height="35" rx="3" fill="#84CC16" />

        {/* Right Small Minaret Dome */}
        <path
          d="M 340,202 
             C 352,210 362,222 362,240 
             L 318,240 
             C 318,222 328,210 340,202 Z"
          fill="#65A30D"
        />
        <rect x="320" y="240" width="40" height="35" rx="3" fill="#84CC16" />

        {/* Mosque Building Walls & 3 White Arches */}
        <rect x="180" y="240" width="140" height="42" fill="#65A30D" />
        
        {/* Left Arch */}
        <path
          d="M 195,278 L 195,225 C 195,215 212,205 212,205 C 212,205 230,215 230,225 L 230,278 Z"
          fill="#FFFFFF"
        />
        {/* Center Main Arch */}
        <path
          d="M 233,278 L 233,212 C 233,200 250,190 250,190 C 250,190 267,200 267,212 L 267,278 Z"
          fill="#FFFFFF"
        />
        {/* Right Arch */}
        <path
          d="M 270,278 L 270,225 C 270,215 287,205 287,205 C 287,205 305,215 305,225 L 305,278 Z"
          fill="#FFFFFF"
        />

        {/* Open Holy Quran Book (Al-Qur'an) */}
        {/* Left Page Book */}
        <g>
          {/* White Outer Outline */}
          <path
            d="M 245,282 
               C 220,240 200,245 200,285 
               C 200,300 220,295 245,335 
               Z"
            fill="#FFFFFF"
            stroke="#FFFFFF"
            strokeWidth="4"
          />
          <path
            d="M 243,284 
               C 222,245 205,248 205,285 
               C 205,295 222,292 243,328 
               Z"
            fill={`url(#${quranGradLeftId})`}
          />
          {/* Inner Bookmark Ribbon Leaf Left */}
          <polygon points="220,305 225,325 230,308" fill="#F97316" />
        </g>

        {/* Right Page Book */}
        <g>
          {/* White Outer Outline */}
          <path
            d="M 255,282 
               C 280,240 300,245 300,285 
               C 300,300 280,295 255,335 
               Z"
            fill="#FFFFFF"
            stroke="#FFFFFF"
            strokeWidth="4"
          />
          <path
            d="M 257,284 
               C 278,245 295,248 295,285 
               C 295,295 278,292 257,328 
               Z"
            fill={`url(#${quranGradRightId})`}
          />
          {/* Inner Bookmark Ribbon Leaf Right */}
          <polygon points="270,308 275,325 280,305" fill="#EA580C" />
        </g>

        {/* Left Holding / Praying Hand */}
        <path
          d="M 230,332 
             C 175,345 130,325 110,290 
             C 95,265 100,230 115,205 
             C 125,190 135,200 132,215 
             C 125,235 120,260 135,280 
             C 150,295 190,305 228,300
             C 230,312 230,322 230,332 Z"
          fill={`url(#${handGradId})`}
          stroke="#FFFFFF"
          strokeWidth="3"
        />
        {/* Left Thumb / Fingers Detail */}
        <path
          d="M 120,265 C 130,270 145,282 145,295"
          stroke="#4D7C0F"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Right Holding / Praying Hand */}
        <path
          d="M 270,332 
             C 325,345 370,325 390,290 
             C 405,265 400,230 385,205 
             C 375,190 365,200 368,215 
             C 375,235 380,260 365,280 
             C 350,295 310,305 272,300
             C 270,312 270,322 270,332 Z"
          fill={`url(#${handGradId})`}
          stroke="#FFFFFF"
          strokeWidth="3"
        />
        {/* Right Thumb / Fingers Detail */}
        <path
          d="M 380,265 C 370,270 355,282 355,295"
          stroke="#4D7C0F"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Top Text (with outline) */}
        <text
          style={{ fontSize: `${topFontSize}px`, letterSpacing: topLetterSpacing }}
          className="font-black select-none"
          fill="#111827"
          stroke="#111827"
          strokeWidth="1.5"
        >
          <textPath href={`#${topCurveId}`} startOffset="50%" textAnchor="middle">
            {finalTopText}
          </textPath>
        </text>

        {/* Bottom Text: THORIQUl JANNAH / THORIQUL JANNAH SINJAI (with outline) */}
        <text 
          style={{ fontSize: `${bottomFontSize}px`, letterSpacing: bottomLetterSpacing }}
          className="font-black select-none" 
          fill="#111827" 
          stroke="#111827" 
          strokeWidth="1.5"
        >
          <textPath href={`#${bottomCurveId}`} startOffset="50%" textAnchor="middle">
            {finalBottomText}
          </textPath>
        </text>
      </svg>
    </div>
  );
};
