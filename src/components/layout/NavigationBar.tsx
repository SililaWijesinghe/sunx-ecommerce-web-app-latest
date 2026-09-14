import { Menu, ChevronDown } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', href: '#', active: true },
  { label: 'Shop', href: '#' },
  { label: 'Deals', href: '#' },
  { label: 'New Arrivals', href: '#' },
  { label: 'Best Sellers', href: '#' },
  { label: 'Brands', href: '#' },
  { label: 'Track Order', href: '#' },
  { label: 'Support', href: '#' },
];

export function NavigationBar() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 flex items-center">
        
        {/* All Categories Button */}
        <button className="w-[260px] bg-red-600 hover:bg-red-700 text-white flex items-center justify-between px-4 py-3.5 transition-colors cursor-pointer rounded-t-md mt-2">
          <div className="flex items-center gap-3">
            <Menu className="w-5 h-5" />
            <span className="font-semibold text-sm">All Categories</span>
          </div>
          <ChevronDown className="w-4 h-4" />
        </button>

        {/* Horizontal Links */}
        <ul className="flex items-center gap-8 ml-8">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a 
                href={link.href}
                className={`text-sm font-semibold transition-colors hover:text-red-600 ${
                  link.active ? 'text-red-600' : 'text-gray-700'
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

      </div>
    </nav>
  );
}
