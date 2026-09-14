import { Product } from '../types';

export const MOCK_DEALS: Product[] = [
  {
    id: 'p1',
    name: 'SUNX Pro Laptop 15"',
    description: 'High performance gaming laptop',
    price: 799.99,
    originalPrice: 999.99,
    discount: 20,
    rating: 4.8,
    reviewCount: 85,
    imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80',
    categoryId: 'c1',
    brandId: 'b1',
    stock: 50,
    createdAt: new Date().toISOString()
  },
  {
    id: 'p2',
    name: 'Wireless Headphones',
    description: 'Noise cancelling over-ear headphones',
    price: 59.99,
    originalPrice: 69.99,
    discount: 15,
    rating: 4.5,
    reviewCount: 128,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    categoryId: 'c2',
    brandId: 'b2',
    stock: 100,
    createdAt: new Date().toISOString()
  },
  {
    id: 'p3',
    name: 'Smart Watch Pro',
    description: 'Fitness tracking smartwatch',
    price: 89.99,
    originalPrice: 119.99,
    discount: 25,
    rating: 4.7,
    reviewCount: 96,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    categoryId: 'c3',
    brandId: 'b3',
    stock: 75,
    createdAt: new Date().toISOString()
  },
  {
    id: 'p4',
    name: 'Gaming Mouse X1',
    description: 'Ergonomic RGB gaming mouse',
    price: 29.99,
    originalPrice: 39.99,
    discount: 30,
    rating: 4.6,
    reviewCount: 76,
    imageUrl: 'https://images.unsplash.com/photo-1527814050087-379381547914?auto=format&fit=crop&w=800&q=80',
    categoryId: 'c4',
    brandId: 'b4',
    stock: 200,
    createdAt: new Date().toISOString()
  },
  {
    id: 'p5',
    name: 'Mechanical Keyboard',
    description: 'RGB mechanical gaming keyboard',
    price: 48.99,
    originalPrice: 69.99,
    discount: 10,
    rating: 4.9,
    reviewCount: 64,
    imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80',
    categoryId: 'c4',
    brandId: 'b5',
    stock: 150,
    createdAt: new Date().toISOString()
  }
];

export const MOCK_CATEGORIES = [
  { id: 'c1', name: 'Laptops', count: '120+' },
  { id: 'c2', name: 'Gaming', count: '150+' },
  { id: 'c3', name: 'Mobile Phones', count: '200+' },
  { id: 'c4', name: 'Smart Watches', count: '60+' },
  { id: 'c5', name: 'Audio', count: '80+' },
  { id: 'c6', name: 'Accessories', count: '500+' },
  { id: 'c7', name: 'Components', count: '100+' },
  { id: 'c8', name: 'Storage', count: '70+' },
];

export const MOCK_BRANDS = [
  'SX', 'ASUS', 'logitech', 'SAMSUNG', 'hp', 'SONY', 'msi', 'DELL'
];
