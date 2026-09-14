import React from 'react';
import { ShieldCheck, Tags, Truck, CreditCard } from 'lucide-react';

const TRUST_FEATURES = [
  {
    title: '100% Genuine',
    subtitle: 'Authentic Products',
    icon: ShieldCheck,
  },
  {
    title: 'Best Price',
    subtitle: 'Guaranteed',
    icon: Tags,
  },
  {
    title: 'Island-wide Delivery',
    subtitle: 'Fast & Reliable',
    icon: Truck,
  },
  {
    title: 'Multiple Payment',
    subtitle: 'Options Available',
    icon: CreditCard,
  }
];

export function SecondaryTrust() {
  return (
    <div className="bg-gradient-to-b from-gray-900 to-black text-white rounded-2xl mx-0 sm:mx-4 my-8 p-6 shadow-xl">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {TRUST_FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-full border-2 border-gray-700 dark:border-gray-800 flex items-center justify-center bg-gray-900 group-hover:border-[#E50914] transition-colors shrink-0">
                <Icon className="w-6 h-6 text-[#E50914] stroke-[1.5]" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm lg:text-base leading-tight">
                  {feature.title}
                </span>
                <span className="text-gray-400 text-xs lg:text-sm font-medium">
                  {feature.subtitle}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
