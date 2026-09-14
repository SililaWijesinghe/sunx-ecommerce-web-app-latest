import React from 'react';
import { Gift } from 'lucide-react';

export function Newsletter() {
  return (
    <div className="bg-red-50 dark:bg-[#111111] rounded-xl p-8 flex flex-col md:flex-row items-center justify-between my-8 border border-red-100 dark:border-red-900/30">
      <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left mb-6 md:mb-0">
        <div className="w-16 h-16 shrink-0 bg-white dark:bg-[#0a0a0c] rounded-full flex items-center justify-center shadow-sm">
          <Gift className="w-8 h-8 text-[#E50914]" />
        </div>
        <div>
          <h3 className="text-xl font-black text-[#E50914] uppercase tracking-wide mb-1">
            EXTRA 5% OFF ON FIRST ORDER
          </h3>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            ...and receive Rs. 500 coupon for first shopping
          </p>
        </div>
      </div>
      
      <div className="w-full md:w-auto flex flex-col sm:flex-row gap-0 w-full sm:max-w-md">
        <input 
          type="email" 
          placeholder="Enter your email address" 
          className="flex-1 bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-gray-800 px-4 py-3 rounded-t-md sm:rounded-l-md sm:rounded-tr-none focus:outline-none focus:border-[#E50914] transition-colors"
        />
        <button className="bg-[#E50914] hover:bg-red-700 text-white font-bold px-8 py-3 rounded-b-md sm:rounded-r-md sm:rounded-bl-none transition-colors whitespace-nowrap">
          Sign Up
        </button>
      </div>
    </div>
  );
}
