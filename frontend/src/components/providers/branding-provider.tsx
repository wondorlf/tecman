'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface BrandingSettings {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
}

const BrandingContext = createContext<BrandingSettings | null>(null);

export const useBranding = () => useContext(BrandingContext);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandingSettings>({
    name: 'TecMan',
    logoUrl: null,
    primaryColor: '#2563eb',
    secondaryColor: '#0f172a',
  });

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const response = await axios.get('/api/tenants/public');
        if (response.data) {
          setBranding(response.data);
          applyBranding(response.data);
        }
      } catch (error) {
        console.error('Error fetching branding:', error);
      }
    };

    fetchBranding();
  }, []);

  const applyBranding = (data: BrandingSettings) => {
    const root = document.documentElement;
    if (data.primaryColor) {
      const hsl = hexToHsl(data.primaryColor);
      if (hsl) {
        root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
        root.style.setProperty('--ring', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      }
    }
  };

  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>;
}

function hexToHsl(hex: string) {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Convert to RGB
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}
