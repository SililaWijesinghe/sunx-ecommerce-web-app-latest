import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useCategoryStore } from '../../store/useCategoryStore';
import { HardDrive, Printer, BatteryCharging, Fan, Keyboard, Plug, Cpu, Monitor, Laptop, Database, Box } from 'lucide-react';

const getCategoryIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('hdd')) return HardDrive;
  if (n.includes('ink')) return Printer;
  if (n.includes('battery')) return BatteryCharging;
  if (n.includes('fan')) return Fan;
  if (n.includes('keyboard')) return Keyboard;
  if (n.includes('adapter') || n.includes('power')) return Plug;
  if (n.includes('ram')) return Cpu;
  if (n.includes('screen')) return Monitor;
  if (n.includes('laptop')) return Laptop;
  if (n.includes('ssd')) return Database;
  return Box;
};

export function CategoryGrid() {
  const { categories, fetchCategories, isLoading } = useCategoryStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const mainCategories = categories.filter(c => c.parent_id === null);

  return (
    <div className="w-full flex flex-col mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Shop By Category</h2>
        <Link to="/shop" className="text-xs font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-[#111111] border border-gray-200 dark:border-gray-800 px-4 py-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-[#1a1a1c] transition-colors shadow-sm">
          View All
        </Link>
      </div>
      <div className="flex flex-wrap gap-3 md:gap-4 justify-center md:justify-start">
        {isLoading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 bg-white dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-full shadow-sm animate-pulse w-40">
              <div className="w-8 h-8 bg-gray-100 dark:bg-[#0a0a0c] rounded-full shrink-0" />
              <div className="w-20 h-3 bg-gray-100 dark:bg-[#0a0a0c] rounded" />
            </div>
          ))
        ) : (
          mainCategories.slice(0, 10).map((cat) => {
            const Icon = getCategoryIcon(cat.name);
            return (
              <Link key={cat.id} to={`/shop?category=${cat.slug}`}>
                <motion.div
                  initial={false}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 0 20px rgba(229,9,20,0.6), 0 0 10px rgba(255,255,255,0.5) inset",
                    borderColor: "rgba(255,255,255,1)",
                    backgroundColor: "rgba(229,9,20,1)",
                    color: "rgba(255,255,255,1)"
                  }}
                  whileTap={{
                    scale: 0.95,
                    boxShadow: "0 0 25px rgba(229,9,20,0.8), 0 0 15px rgba(255,255,255,0.8) inset",
                    borderColor: "rgba(255,255,255,1)",
                    backgroundColor: "rgba(229,9,20,1)",
                    color: "rgba(255,255,255,1)"
                  }}
                  className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-[#111111] border-[4px] border-transparent dark:border-white/5 rounded-[60px] shadow-sm transition-colors duration-300 group"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-[#0a0a0c] flex items-center justify-center shrink-0 group-hover:bg-transparent transition-colors">
                    <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-white transition-colors truncate">
                    {cat.name}
                  </span>
                </motion.div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
