import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define our interface for parsed rows
interface ParsedRow {
  name: string;
  regularPrice: number;
  salePrice: number;
  stock: number;
  images: string[];
  descriptionHtml: string;
  category: string;
  brand: string;
  sku: string;
}

// Ensure slug is clean
const slugify = (text: string) => 
  text.toString().toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

async function runMigration(csvFilePath: string) {
  console.log(`\n🚀 Starting WooCommerce Migration...`);
  console.log(`📄 Reading CSV from: ${csvFilePath}\n`);

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV File not found at ${csvFilePath}`);
    console.error('💡 Please ensure your WooCommerce export is placed there.');
    process.exit(1);
  }

  const rawRows: any[] = [];

  // Step 1: Read and parse CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => rawRows.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`✅ Parsed ${rawRows.length} rows from CSV.`);

  const categoriesSet = new Set<string>();
  const brandsSet = new Set<string>();
  const parsedProducts: ParsedRow[] = [];

  // Step 2: Extract uniques and clean data
  rawRows.forEach((row, i) => {
    const name = row['Name'] || row['Title'] || `Untitled-${i}`;
    if (!name.trim()) return; // Skip empty rows

    // Categories (Find the deepest path if comma separated)
    const categoriesRawStr = row['Categories'] || 'Uncategorized';
    const categoryPaths = categoriesRawStr.split(',');
    let deepestPath = categoryPaths[0];
    let maxDepth = -1;
    
    for (const path of categoryPaths) {
      const depth = (path.match(/>/g) || []).length;
      if (depth > maxDepth) {
        maxDepth = depth;
        deepestPath = path;
      }
    }
    const categoryRaw = deepestPath.trim();
    categoriesSet.add(categoryRaw);

    // Brands (Fallback to 'Unknown Brand' if column doesn't exist or is empty)
    const brand = (row['Brands'] || row['Brand'] || 'Unknown Brand').split(',')[0].trim();
    brandsSet.add(brand);

    const regularPrice = parseFloat(row['Regular price']) || 0;
    const salePrice = parseFloat(row['Sale price']) || 0;
    const stockStr = row['Stock'] || row['Stock quantity'];
    const stock = stockStr && !isNaN(parseInt(stockStr)) ? parseInt(stockStr) : 0;
    const imageStr = row['Images'] || '';
    const images = imageStr ? imageStr.split(',').map((u: string) => u.trim()).filter(Boolean) : [];
    
    parsedProducts.push({
      name,
      regularPrice,
      salePrice,
      stock,
      images,
      descriptionHtml: row['Description'] || '',
      category: categoryRaw,
      brand,
      sku: row['SKU'] || `WP-${Date.now()}-${i}`
    });
  });

  console.log(`🔍 Found ${categoriesSet.size} unique categories and ${brandsSet.size} unique brands.`);

  // Step 3: Upsert Categories & Brands and build mapping
  const categoryMap = new Map<string, string>();
  const brandMap = new Map<string, string>();

  console.log('\n⏳ Synchronizing Categories...');
  for (const catRaw of Array.from(categoriesSet)) {
    const parts = catRaw.split('>').map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) parts.push('Uncategorized');

    let currentParentId: string | null = null;
    
    for (const catName of parts) {
      let query = supabase.from('categories').select('id').eq('name', catName);
      
      if (currentParentId) {
         query = query.eq('parent_id', currentParentId);
      } else {
         query = query.is('parent_id', null);
      }

      let { data: cat } = await query.single();
      
      if (!cat) {
        const { data: newCat, error } = await supabase.from('categories')
          .insert({ 
            name: catName, 
            slug: `${slugify(catName)}-${Date.now().toString().slice(-4)}`,
            parent_id: currentParentId 
          })
          .select('id').single();
          
        if (error) {
           console.error(`❌ Error inserting category ${catName}:`, error.message);
        }
        cat = newCat;
      }
      currentParentId = cat?.id || null;
    }
    
    if (currentParentId) {
      categoryMap.set(catRaw, currentParentId);
    }
  }

  console.log('⏳ Synchronizing Brands...');
  for (const brandName of Array.from(brandsSet)) {
    let { data: brand } = await supabase.from('brands').select('id').eq('name', brandName).single();
    if (!brand) {
      const { data: newBrand } = await supabase.from('brands')
        .insert({ name: brandName })
        .select('id').single();
      brand = newBrand;
    }
    if (brand) brandMap.set(brandName, brand.id);
  }

  console.log('✅ Relational dependencies mapped successfully.\n');

  // Step 4: Map Products & Calculate Pricing & Parse HTML
  const finalProducts = parsedProducts.map((p, i) => {
    // Pricing Algorithm
    let price = p.regularPrice;
    let original_price = p.regularPrice;
    let discount_percent = 0;

    if (p.salePrice > 0 && p.salePrice < p.regularPrice) {
      price = p.salePrice;
      discount_percent = Math.round(((p.regularPrice - p.salePrice) / p.regularPrice) * 100);
    }

    // HTML Parsing for Specs using Cheerio
    let specifications: Record<string, string> | null = null;
    let cleanDescription = '';

    if (p.descriptionHtml) {
      const $ = cheerio.load(p.descriptionHtml);
      const extractedSpecs: Record<string, string> = {};
      
      $('li').each((_, el) => {
        const text = $(el).text().trim();
        const parts = text.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          if (key && value) {
            extractedSpecs[key] = value;
          }
        }
      });

      if (Object.keys(extractedSpecs).length > 0) {
        specifications = extractedSpecs;
      }
      
      // Attempt to extract a clean string description (stripping out the ul/li tags we parsed)
      $('ul, ol').remove();
      cleanDescription = $.text().replace(/\s+/g, ' ').trim();
    }

    return {
      title: p.name,
      slug: `${slugify(p.name)}-${Date.now().toString().slice(-4)}${i}`,
      price,
      original_price,
      discount_percent,
      images: p.images,
      sku: p.sku,
      description: cleanDescription || p.name,
      category_id: categoryMap.get(p.category) || null,
      brand_id: brandMap.get(p.brand) || null,
      stock_quantity: p.stock,
      specifications
    };
  });

  // Step 5: Batch Insert
  console.log(`📦 Batch inserting ${finalProducts.length} products to Supabase...`);
  
  const CHUNK_SIZE = 50;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < finalProducts.length; i += CHUNK_SIZE) {
    const chunk = finalProducts.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from('products').insert(chunk);
    
    if (error) {
      console.error(`❌ Error inserting chunk ${i / CHUNK_SIZE + 1}:`, error.message);
      failCount += chunk.length;
    } else {
      successCount += chunk.length;
      process.stdout.write(`\r✅ Inserted ${successCount} / ${finalProducts.length}`);
    }
  }

  console.log('\n\n🎉 Migration Complete!');
  console.log(`=========================`);
  console.log(`✅ Success: ${successCount} products inserted.`);
  if (failCount > 0) {
    console.log(`❌ Failed: ${failCount} products failed to insert.`);
  }
  console.log(`=========================\n`);
}

// Execute the migration, assuming CSV is passed via CLI argument or defaults to data/export.csv
const args = process.argv.slice(2);
const csvPath = args[0] ? path.resolve(process.cwd(), args[0]) : path.resolve(process.cwd(), 'export.csv');

runMigration(csvPath).catch(console.error);
