import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '../shared/ProductCard';
import { Product } from '../../types';

interface DealsSectionProps {
  deals: Product[];
  loading?: boolean;
}

export function DealsSection({ deals, loading }: DealsSectionProps) {
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-6">
          <h2 className="text-xl font-bold text-gray-900">Best Deals of the Day</h2>
          
          {/* Countdown */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div className="bg-gray-100 text-gray-900 font-bold px-2 py-1 rounded text-lg min-w-[40px] text-center">
                08
              </div>
              <span className="text-[10px] text-gray-500 mt-1 uppercase font-bold">Hours</span>
            </div>
            <span className="text-gray-400 font-bold text-lg -mt-4">:</span>
            <div className="flex flex-col items-center">
              <div className="bg-gray-100 text-gray-900 font-bold px-2 py-1 rounded text-lg min-w-[40px] text-center">
                34
              </div>
              <span className="text-[10px] text-gray-500 mt-1 uppercase font-bold">Mins</span>
            </div>
            <span className="text-gray-400 font-bold text-lg -mt-4">:</span>
            <div className="flex flex-col items-center">
              <div className="bg-gray-100 text-gray-900 font-bold px-2 py-1 rounded text-lg min-w-[40px] text-center">
                56
              </div>
              <span className="text-[10px] text-gray-500 mt-1 uppercase font-bold">Secs</span>
            </div>
          </div>
        </div>

        <button className="text-xs font-semibold text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-full hover:border-gray-300 transition-colors w-fit">
          View All Deals
        </button>
      </div>

      {/* Grid / Carousel */}
      <div className="relative group">
        {!loading && deals.length > 0 && (
          <div className="absolute top-1/2 -translate-y-1/2 -left-4 bg-white shadow-md border border-gray-100 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer hover:bg-gray-50 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {loading ? (
            // Skeleton Loader
            [...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 h-full animate-pulse flex flex-col">
                <div className="h-48 bg-gray-200 rounded-lg mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="mt-auto flex justify-between items-end">
                  <div className="h-6 bg-gray-200 rounded w-16" />
                  <div className="h-8 w-8 bg-gray-200 rounded-full" />
                </div>
              </div>
            ))
          ) : deals.length > 0 ? (
            deals.map((deal) => (
              <ProductCard key={deal.id} product={deal} />
            ))
          ) : (
            <div className="col-span-full text-sm text-gray-500 p-4 text-center">No deals available right now.</div>
          )}
        </div>

        {!loading && deals.length > 0 && (
          <div className="absolute top-1/2 -translate-y-1/2 -right-4 bg-white shadow-md border border-gray-100 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer hover:bg-gray-50 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </div>
        )}
      </div>
    </div>
  );
}
