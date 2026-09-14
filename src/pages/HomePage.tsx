import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Hero } from '../components/home/Hero';
import { SidebarCategories } from '../components/layout/SidebarCategories';
import { TrustSignals } from '../components/home/TrustSignals';
import { CategoryGrid } from '../components/home/CategoryGrid';
import { DealOfTheDay } from '../components/home/DealOfTheDay';
import { TopDeals } from '../components/home/TopDeals';
import { ProductCatalog } from '../components/home/ProductCatalog';
import { PromoBanner } from '../components/home/PromoBanner';
import { ClubBanner } from '../components/home/ClubBanner';
import { MatchBanner } from '../components/storefront/MatchBanner';
import { ScrollMatchTrigger } from '../components/storefront/ScrollMatchTrigger';
import { GuidedMatchModal } from '../components/storefront/GuidedMatchModal';
import { StoreMarquee } from '../components/home/StoreMarquee';

export function HomePage() {
  const [isGuidedMatchOpen, setIsGuidedMatchOpen] = useState(false);

  return (
    <div className="flex flex-col pb-12 w-full min-h-screen relative bg-slate-50 dark:bg-[#050505]">
      <div className="max-w-[1600px] mx-auto px-4 w-full pt-6">
        
        {/* Row 1: Sidebar + Hero */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8 lg:mb-10">
          <div className="hidden lg:block w-[280px] shrink-0 h-full">
            <SidebarCategories />
          </div>
          <div className="w-full lg:flex-1 min-w-0 h-[400px] md:h-[500px] lg:h-[600px]">
            <Hero />
          </div>
        </div>

        <StoreMarquee />

        {/* Row 2: Category Pills */}
        <CategoryGrid />

        {/* Row 3: Promo Cards */}
        <PromoBanner />

        {/* Row 4: Deal of the Day, Top Deals, AI Advisor */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr_1fr] xl:grid-cols-[1fr_2fr_1fr] gap-6 mb-12">
          <div className="h-full">
            <DealOfTheDay />
          </div>
          <div className="h-full">
            <TopDeals />
          </div>
          <div className="h-full">
            <MatchBanner />
          </div>
        </div>

        {/* Row 5: Trust Signals (Dark Bar) */}
        <div className="mb-12">
          <TrustSignals />
        </div>

        {/* Row 6: New Arrivals / Best Sellers Tabs */}
        <div className="mb-12">
          <ProductCatalog />
        </div>
        
        {/* Row 7: Power Up Your Game & Promos */}
        <div className="mb-12">
          <ClubBanner />
        </div>

      </div>

      <ScrollMatchTrigger onOpenMatch={() => setIsGuidedMatchOpen(true)} />

      <AnimatePresence>
        {isGuidedMatchOpen && (
          <GuidedMatchModal onClose={() => setIsGuidedMatchOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
