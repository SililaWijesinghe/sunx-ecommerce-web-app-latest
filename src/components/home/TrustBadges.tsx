import { Truck, ShieldCheck, RefreshCw, HeadphonesIcon } from 'lucide-react';

const BADGES = [
  {
    icon: Truck,
    title: 'Free Shipping',
    desc: 'On orders over $100',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Payment',
    desc: '100% secure payment',
  },
  {
    icon: RefreshCw,
    title: '30 Day Returns',
    desc: 'Hassle free returns',
  },
  {
    icon: HeadphonesIcon,
    title: '24/7 Support',
    desc: "We're here to help",
  },
];

export function TrustBadges() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      {BADGES.map((badge, idx) => {
        const Icon = badge.icon;
        return (
          <div key={idx} className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center border border-gray-200 rounded-full flex-shrink-0">
              <Icon className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">{badge.title}</h4>
              <p className="text-xs text-gray-500 mt-0.5">{badge.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
