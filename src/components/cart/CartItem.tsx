import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '../../types';

export interface CartItemProps {
  item: CartItemType;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
}

export function CartItem({ item, updateQuantity, removeItem }: CartItemProps) {
  // Bind directly to images[0] or fallback to imageUrl / default placeholder
  const imageSrc =
    (Array.isArray((item as any).images) && (item as any).images.length > 0 && (item as any).images[0])
      ? (item as any).images[0]
      : (item.imageUrl || '/placeholder.png');

  return (
    <div className="flex gap-4 p-4 bg-white dark:bg-[#111111] border border-slate-200/60 dark:border-gray-800 rounded-xl relative group hover:shadow-md transition-shadow">
      <div className="w-20 h-20 bg-gray-50 dark:bg-[#1a1a1c] rounded-lg shrink-0 flex items-center justify-center overflow-hidden p-2">
        <img
          src={imageSrc}
          alt={item.name}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
          }}
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-bold text-sm line-clamp-2 text-gray-900 dark:text-gray-100 leading-snug">
            {item.name}
          </h3>
          <button
            onClick={() => removeItem(item.id)}
            className="text-gray-400 dark:text-gray-500 hover:text-[#E50914] transition-colors p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center bg-gray-100 dark:bg-[#0a0a0c] rounded-md border border-gray-200 dark:border-gray-800">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
              disabled={item.quantity <= 1}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="font-black text-[#E50914]">
            Rs. {(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CartItem;
