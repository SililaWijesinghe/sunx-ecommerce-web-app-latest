import { ChevronRight } from 'lucide-react';
import { Brand } from '../../types';

interface BrandCarouselProps {
  brands: Brand[];
  loading?: boolean;
}

export function BrandCarousel({ brands, loading }: BrandCarouselProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Top Brands You Love</h2>
      <div className="relative">
        <div className="flex items-center gap-4 overflow-x-auto pb-4 ">
          {loading ? (
            // Skeleton Loader
            [...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="flex-shrink-0 w-[140px] h-[70px] bg-white border border-gray-100 rounded-xl flex items-center justify-center animate-pulse"
              >
                <div className="w-16 h-4 bg-gray-200 rounded" />
              </div>
            ))
          ) : brands.length > 0 ? (
            brands.map((brand) => (
              <div 
                key={brand.id} 
                className="flex-shrink-0 w-[140px] h-[70px] bg-white border border-gray-100 rounded-xl flex items-center justify-center hover:border-red-600 transition-colors cursor-pointer group p-2"
              >
                {brand.logoUrl ? (
                  <img src={brand.logoUrl} alt={brand.name} className="max-w-full max-h-full object-contain filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                ) : (
                  <span className="font-black text-xl text-gray-400 group-hover:text-gray-900 transition-colors tracking-tight">
                    {brand.name}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 p-4">No featured brands available.</div>
          )}
        </div>
        
        {!loading && brands.length > 0 && (
          <div className="absolute top-1/2 -translate-y-1/2 -right-4 bg-white shadow-md border border-gray-100 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer hover:bg-gray-50 z-10">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </div>
        )}
      </div>
    </div>
  );
}
