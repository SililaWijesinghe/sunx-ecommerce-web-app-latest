import React from 'react';
import { DynamicIcon as LucideDynamicIcon } from 'lucide-react/dynamic';
import { Box } from 'lucide-react';

interface DynamicIconProps {
  name: string;
  size?: number | string;
  color?: string;
  className?: string;
}

// Map common DB string mismatches to valid Lucide icon names
const iconAliasMap: Record<string, string> = {
  'mobile-phones': 'smartphone',
  'smart-watches': 'watch',
  'audio-headphones': 'headphones',
  'desktop-computers': 'monitor',
  'components': 'cpu',
  'accessories': 'wrench',
  'networking': 'network',
  'storage': 'hard-drive',
  'cameras': 'camera',
  'business-laptops': 'briefcase',
  'gaming-laptops': 'gamepad-2',
};

export function DynamicIcon({ name, size, color, className }: DynamicIconProps) {
  if (!name) return <Box size={size} color={color} className={className} />;

  // Normalize string: lowercase and replace spaces with hyphens
  let normalizedName = name.toLowerCase().replace(/\s+/g, '-');
  
  // Apply aliases if matches
  normalizedName = iconAliasMap[normalizedName] || normalizedName;

  return (
    <React.Suspense fallback={<Box size={size} color={color} className={className} />}>
      <LucideDynamicIcon name={normalizedName as any} size={size} color={color} className={className} />
    </React.Suspense>
  );
}
