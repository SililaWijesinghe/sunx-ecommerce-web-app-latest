import React, { useEffect, useState, useMemo } from 'react';
import { ChevronRight, Zap, ChevronDown, Minus, Plus, HardDrive, Printer, BatteryCharging, Fan, Keyboard, Plug, Cpu, Monitor, Laptop, Database, Box } from 'lucide-react';
import { useCategoryStore, Category } from '../../store/useCategoryStore';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface CategoryNode extends Category {
  children: CategoryNode[];
}

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

export function SidebarCategories() {
  const { categories, fetchCategories, isLoading } = useCategoryStore();
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const categoryTree = useMemo(() => {
    const nodes: Record<string, CategoryNode> = {};
    categories.forEach(item => {
      nodes[item.id] = { ...item, children: [] };
    });

    const rootNodes: CategoryNode[] = [];
    Object.values(nodes).forEach(node => {
      if (node.parent_id && nodes[node.parent_id]) {
        nodes[node.parent_id].children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    // Sort alphabetically
    const sortNodes = (ns: CategoryNode[]) => {
      ns.sort((a, b) => a.name.localeCompare(b.name));
      ns.forEach(n => sortNodes(n.children));
    };
    sortNodes(rootNodes);

    return rootNodes;
  }, [categories]);

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNode = (node: CategoryNode, depth = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = !!expandedCats[node.id];
    const Icon = getCategoryIcon(node.name);

    return (
      <li key={node.id} className="flex flex-col">
        <div className={`w-full flex items-center justify-between px-4 py-2.5 group transition-colors hover:bg-red-50 dark:hover:bg-[#1a1a1c] cursor-pointer`}
          onClick={() => navigate(`/shop?category=${node.slug}`)}
        >
          <div className="flex items-center gap-3" style={{ paddingLeft: depth > 0 ? `${depth * 16}px` : '0px' }}>
            {depth === 0 && (
              <Icon className="w-5 h-5 transition-colors text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-[#E50914]" />
            )}
            <span className={`text-sm font-medium transition-colors text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-[#E50914]`}>
              {node.name}
            </span>
          </div>
          {hasChildren && (
            <button
              onClick={(e) => toggleExpand(e, node.id)}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-[#E50914] transition-colors rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-gray-50 dark:bg-[#111111]/50 border-l-2 border-red-500/20 ml-6"
            >
              <ul className="py-1">
                {node.children.map(child => renderNode(child, depth + 1))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </li>
    );
  };

  return (
    <aside className="w-full h-full bg-white dark:bg-[#0a0a0c] border border-slate-200/90 dark:border-gray-900 rounded-2xl shadow-[0_2px_12px_-2px_rgba(15,23,42,0.06)] dark:shadow-neu-dark hover:shadow-[0_6px_20px_-3px_rgba(220,38,38,0.12)] hover:border-red-500/40 transition-all duration-300 flex flex-col overflow-hidden">
      <ul className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {isLoading ? (
          [...Array(8)].map((_, i) => (
            <li key={i} className="px-4 py-3 flex gap-3 items-center animate-pulse">
              <div className="w-5 h-5 bg-gray-200 dark:bg-gray-800 rounded-full" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24" />
            </li>
          ))
        ) : (
          categoryTree.map((node) => renderNode(node))
        )}
      </ul>
      
      {/* Flash Deals Banner */}
      <div className="bg-red-50 dark:bg-[#1a1a1c] p-4 m-3 rounded-lg border border-red-100 dark:border-red-900/30 flex items-start gap-3 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
        <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-full text-red-600 dark:text-[#E50914]">
          <Zap className="w-5 h-5 fill-red-600" />
        </div>
        <div>
          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Flash Deals</h4>
          <p className="text-red-600 dark:text-[#E50914] font-bold text-xs mt-0.5">Up to 50% OFF</p>
          <span className="text-gray-500 dark:text-gray-400 text-xs font-medium mt-1 inline-block hover:underline">
            View Deals
          </span>
        </div>
      </div>
    </aside>
  );
}
