import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import slugify from 'slugify';
import dotenv from 'dotenv';

// -------------------------------------------------------------
// 1. ENVIRONMENT SETUP
// -------------------------------------------------------------
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// Use SUPABASE_SERVICE_ROLE_KEY to bypass RLS, fallback to ANON key if not provided
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Supabase credentials missing. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY) are set in .env.');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  Notice: SUPABASE_SERVICE_ROLE_KEY is not set in .env. Falling back to ANON key.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const CSV_FILE = 'wc-product-export-12-9-2026-1789189680541_3.csv';
const UPLOADS_BASE_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure base upload directory exists
fse.ensureDirSync(UPLOADS_BASE_DIR);

// -------------------------------------------------------------
// HELPERS & CACHES
// -------------------------------------------------------------
function makeSlug(text) {
  return slugify(text || '', { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
}

// In-Memory Caches to eliminate duplicate lookups
const categoryCache = new Map(); // slug -> id
const brandCache = new Map();    // slug -> id
const productCache = new Map();  // ID / SKU -> UUID
const usedProductSlugs = new Set();

function generateUniqueProductSlug(name, id) {
  let base = makeSlug(name) || `product-${id}`;
  let candidate = base;
  let counter = 1;
  while (usedProductSlugs.has(candidate)) {
    candidate = `${base}-${id || counter++}`;
  }
  usedProductSlugs.add(candidate);
  return candidate;
}

// Known Brands Dictionary
const KNOWN_BRANDS = [
  'Toshiba', 'Acer', 'Western Digital', 'WD', 'Transcend', 'Dell', 'HP',
  'Fujitsu', 'Lenovo', 'Samsung', 'Sony', 'Asus', 'Kingston', 'Wise',
  'Logitech', 'Handboss', 'Lexar', 'Apple', '3KS', 'Mikuso', 'DATO',
  'Singer', 'Silicon Power', 'SP', 'Canon', 'Intel'
];

function detectBrandName(row) {
  // 1. Use explicit Brands column if provided
  if (row['Brands'] && row['Brands'].trim()) {
    return row['Brands'].split(',')[0].trim();
  }

  // 2. Check deepest category segment
  const categoryStr = row['Categories'] || '';
  for (const p of categoryStr.split(',')) {
    if (p.includes('>')) {
      const parts = p.split('>').map((s) => s.trim());
      const candidate = parts[parts.length - 1];
      if (candidate && !['screen', 'battery', 'keyboard', 'fan', 'ram', 'ssd', 'hdd'].some((w) => candidate.toLowerCase().includes(w))) {
        const matched = KNOWN_BRANDS.find((b) => b.toLowerCase() === candidate.toLowerCase());
        if (matched) return matched;
      }
    }
  }

  // 3. Check Tags
  const tagsStr = row['Tags'] || '';
  if (tagsStr) {
    const tags = tagsStr.split(',').map((t) => t.trim());
    for (const b of KNOWN_BRANDS) {
      if (tags.some((t) => t.toLowerCase() === b.toLowerCase())) {
        return b;
      }
    }
  }

  // 4. Check Product Name
  const productName = row['Name'] || '';
  if (productName) {
    for (const b of KNOWN_BRANDS) {
      if (new RegExp(`\\b${b}\\b`, 'i').test(productName)) {
        return b;
      }
    }
  }

  return 'SUNX';
}

// -------------------------------------------------------------
// 2. RELATIONAL UPSERT: CATEGORIES & BRANDS
// -------------------------------------------------------------
async function upsertCategoryHierarchy(categoryString) {
  if (!categoryString || !categoryString.trim()) {
    return { categoryId: null, categorySlug: 'general' };
  }

  // Find the most specific path with '>' if available
  const paths = categoryString.split(',').map((s) => s.trim()).filter(Boolean);
  const bestPath = paths.find((p) => p.includes('>')) || paths[0];
  if (!bestPath) return { categoryId: null, categorySlug: 'general' };

  const parts = bestPath.split('>').map((s) => s.trim()).filter(Boolean);

  let parentId = null;
  let parentSlug = '';
  let leafId = null;

  for (let i = 0; i < parts.length; i++) {
    const partName = parts[i];
    const nodeSlug = i === 0 ? makeSlug(partName) : `${makeSlug(parts[0])}-${makeSlug(partName)}`;

    if (i === 0) parentSlug = nodeSlug;

    if (categoryCache.has(nodeSlug)) {
      parentId = categoryCache.get(nodeSlug);
      leafId = parentId;
      continue;
    }

    // Check if category exists in Supabase
    const { data: existing } = await supabase
      .from('categories')
      .select('id, slug')
      .eq('slug', nodeSlug)
      .maybeSingle();

    if (existing) {
      categoryCache.set(nodeSlug, existing.id);
      parentId = existing.id;
      leafId = existing.id;
      continue;
    }

    // Upsert Category
    const { data, error } = await supabase
      .from('categories')
      .upsert(
        {
          name: partName,
          slug: nodeSlug,
          parent_id: parentId
        },
        { onConflict: 'slug' }
      )
      .select('id, slug')
      .single();

    if (error) {
      console.warn(`[Category Warning] ⚠️ Failed upserting category "${partName}" (${nodeSlug}): ${error.message}`);
      break;
    }

    categoryCache.set(nodeSlug, data.id);
    parentId = data.id;
    leafId = data.id;
  }

  return {
    categoryId: leafId,
    categorySlug: parentSlug || 'general'
  };
}

async function upsertBrand(brandName) {
  const brandSlug = makeSlug(brandName) || 'brand-generic';
  if (brandCache.has(brandSlug)) return { brandId: brandCache.get(brandSlug), brandSlug };

  // Check if exists
  const { data: existing } = await supabase
    .from('brands')
    .select('id, slug')
    .eq('slug', brandSlug)
    .maybeSingle();

  if (existing) {
    brandCache.set(brandSlug, existing.id);
    return { brandId: existing.id, brandSlug };
  }

  const logoUrl = `https://placehold.co/200x80/111827/FFFFFF.png?text=${encodeURIComponent(brandName)}`;

  const { data, error } = await supabase
    .from('brands')
    .upsert(
      {
        name: brandName,
        slug: brandSlug,
        logo_url: logoUrl
      },
      { onConflict: 'slug' }
    )
    .select('id, slug')
    .single();

  if (error) {
    console.warn(`[Brand Warning] ⚠️ Failed upserting brand "${brandName}": ${error.message}`);
    return { brandId: null, brandSlug };
  }

  brandCache.set(brandSlug, data.id);
  return { brandId: data.id, brandSlug };
}

// -------------------------------------------------------------
// 3. SPECIFICATIONS PARSER (Cheerio)
// -------------------------------------------------------------
function extractSpecifications(htmlContent) {
  if (!htmlContent) return {};
  const normalizedHtml = htmlContent.replace(/\\n/g, '\n').replace(/\\r/g, '');
  const $ = cheerio.load(normalizedHtml);
  const specs = {};

  const cleanKey = (k) => (k ? k.replace(/^[\n\r\s\-_:•*]+/, '').replace(/[:\-_]+$/, '').trim() : '');
  const cleanVal = (v) => (v ? v.replace(/^[\n\r\s\-_:]+/, '').replace(/\s+/g, ' ').trim() : '');

  // 1. Process <li> elements
  $('li').each((_, el) => {
    const rawText = $(el).text().trim();
    if (!rawText) return;
    if (rawText.includes(':')) {
      const idx = rawText.indexOf(':');
      const k = cleanKey(rawText.substring(0, idx));
      const v = cleanVal(rawText.substring(idx + 1));
      if (k && v && k.length < 50 && v.length < 250) specs[k] = v;
    } else if (rawText.includes(' – ') || rawText.includes(' - ')) {
      const sep = rawText.includes(' – ') ? ' – ' : ' - ';
      const parts = rawText.split(sep);
      const k = cleanKey(parts[0]);
      const v = cleanVal(parts.slice(1).join(sep));
      if (k && v && k.length < 50 && v.length < 250) specs[k] = v;
    }
  });

  // 2. Process Two-Column Specification Tables
  $('tr').each((_, el) => {
    const cells = $(el).find('th, td');
    if (cells.length === 2) {
      const k = cleanKey($(cells[0]).text());
      const v = cleanVal($(cells[1]).text());
      if (k && v && k.length < 50 && v.length < 250 && !specs[k]) {
        specs[k] = v;
      }
    }
  });

  // 3. Fallback: Parse plain text lines with "Key: Value"
  const fullText = $.text();
  const lines = fullText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.includes(':') && !trimmed.startsWith('http') && !trimmed.startsWith('//')) {
      const idx = trimmed.indexOf(':');
      const k = cleanKey(trimmed.substring(0, idx));
      const v = cleanVal(trimmed.substring(idx + 1));
      const lowerK = k.toLowerCase();
      if (
        k && v &&
        k.length < 40 &&
        v.length > 0 &&
        v.length < 200 &&
        !specs[k] &&
        !['categories', 'tags', 'tag', 'description', 'reviews', 'note', 'warranty terms'].includes(lowerK)
      ) {
        specs[k] = v;
      }
    }
  }

  return specs;
}

// -------------------------------------------------------------
// 4. ATTRIBUTES PARSER (For Variants)
// -------------------------------------------------------------
function parseAttributes(row) {
  const attrs = {};
  if (row['Attributes']) {
    const pairs = row['Attributes'].split(',');
    pairs.forEach((p) => {
      const [k, v] = p.split(':');
      if (k && v) attrs[k.trim()] = v.trim();
    });
  }

  for (const col in row) {
    if (col.match(/^Attribute \d+ name$/i)) {
      const match = col.match(/\d+/);
      if (match) {
        const num = match[0];
        const valCol = `Attribute ${num} value(s)`;
        if (row[col] && row[valCol]) {
          attrs[row[col].trim()] = row[valCol].trim();
        }
      }
    }
  }

  return attrs;
}

// -------------------------------------------------------------
// 5. LOCAL ASSET PIPELINE: DOWNLOAD & RELATIVE PATH MAPPING
// -------------------------------------------------------------
async function downloadAndSaveImage(imageUrl, categorySlug, brandSlug, filename) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const cleanUrl = imageUrl.trim();
  if (!cleanUrl.startsWith('http')) return null;

  const targetDir = path.join(process.cwd(), 'public', 'uploads', categorySlug, brandSlug);
  fse.ensureDirSync(targetDir);

  const localFilePath = path.join(targetDir, filename);
  const relativePath = `/uploads/${categorySlug}/${brandSlug}/${filename}`;

  // If already downloaded locally, reuse to save bandwidth and prevent re-download
  if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).size > 0) {
    return relativePath;
  }

  try {
    const response = await axios.get(cleanUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      validateStatus: (status) => status === 200
    });

    fs.writeFileSync(localFilePath, Buffer.from(response.data));
    return relativePath;
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.warn(`   ⚠️ [404 Not Found] Image skipped: ${cleanUrl}`);
    } else {
      console.warn(`   ⚠️ [Download Failed] (${err.message}) ${cleanUrl}`);
    }
    return null;
  }
}

// -------------------------------------------------------------
// 6. MAIN ETL PIPELINE
// -------------------------------------------------------------
async function runLocalMigration() {
  console.log('==================================================================');
  console.log('🚀 STARTING SUNX TECHNOLOGIES LOCAL ETL MIGRATION PIPELINE');
  console.log(`📄 Source CSV: ${CSV_FILE}`);
  console.log(`📂 Asset Destination: public/uploads/{category}/{brand}/`);
  console.log(`🌐 Supabase URL: ${SUPABASE_URL}`);
  console.log('==================================================================\n');

  if (!fs.existsSync(CSV_FILE)) {
    console.error(`❌ CSV File "${CSV_FILE}" not found in project root.`);
    process.exit(1);
  }

  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on('data', (data) => rows.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📋 Loaded ${rows.length} records from CSV. Starting processing...\n`);

  let parentCount = 0;
  let variantCount = 0;
  let imagesDownloaded = 0;
  let skippedCount = 0;

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const rawType = (row['Type'] || '').trim().toLowerCase();
    const isVariation = rawType === 'variation';

    // -------------------------------------------------------------
    // SCENARIO 1: SIMPLE OR MAIN PRODUCT
    // -------------------------------------------------------------
    if (!isVariation) {
      try {
        // 1. Relational Upsert: Category & Brand
        const { categoryId, categorySlug } = await upsertCategoryHierarchy(row['Categories']);
        const brandName = detectBrandName(row);
        const { brandId, brandSlug } = await upsertBrand(brandName);

        // 2. Product Slug
        const productSlug = generateUniqueProductSlug(row['Name'], row['ID']);

        // 3. Local Asset Pipeline: Download Images & Map Relative Paths
        const rawImages = row['Images']
          ? row['Images'].split(',').map((s) => s.trim()).filter(Boolean)
          : [];

        const localRelativeImages = [];
        for (let imgIdx = 0; imgIdx < rawImages.length; imgIdx++) {
          const imgUrl = rawImages[imgIdx];
          const filename = imgIdx === 0 ? `${productSlug}.jpg` : `${productSlug}-${imgIdx + 1}.jpg`;
          const savedPath = await downloadAndSaveImage(imgUrl, categorySlug, brandSlug, filename);
          if (savedPath) {
            localRelativeImages.push(savedPath);
            imagesDownloaded++;
          }
        }

        // 4. Pricing & Discount
        const regularPrice = parseFloat(row['Regular price']) || 0;
        const salePrice = parseFloat(row['Sale price']) || 0;
        const activePrice = salePrice > 0 ? salePrice : (regularPrice > 0 ? regularPrice : 0);
        const originalPrice = regularPrice > 0 ? regularPrice : (salePrice > 0 ? salePrice : null);
        let discountPercent = 0;
        if (regularPrice > 0 && salePrice > 0 && regularPrice > salePrice) {
          discountPercent = Math.round(((regularPrice - salePrice) / regularPrice) * 100);
        }

        // 5. Stock & SKU
        const stockQty = parseInt(row['Stock'], 10) || (row['In stock?'] === '1' ? 10 : 0);
        const cleanSku = row['SKU']?.trim() || null;

        // 6. Cheerio Specification Parsing
        const specifications = extractSpecifications(row['Description']);

        // 7. Product Upsert into Supabase products table
        const productPayload = {
          title: row['Name']?.trim() || 'Untitled Product',
          slug: productSlug,
          price: activePrice,
          original_price: originalPrice,
          sale_price: salePrice > 0 ? salePrice : null,
          discount_percent: discountPercent,
          stock_quantity: stockQty,
          sku: cleanSku,
          description: row['Description'] || '',
          specifications: specifications || {},
          category_id: categoryId,
          brand_id: brandId,
          images: localRelativeImages,
          rating: 5.0,
          review_count: 0,
          is_featured: row['Is featured?'] === '1',
          is_deal_of_day: false
        };

        const { data: insertedProduct, error: prodError } = await supabase
          .from('products')
          .upsert(productPayload, { onConflict: 'slug' })
          .select('id, slug')
          .single();

        if (prodError) {
          console.error(`[Error] ❌ Failed to upsert product "${row['Name']}": ${prodError.message}`);
          skippedCount++;
        } else {
          parentCount++;
          console.log(
            `📦 [${idx + 1}/${rows.length}] Upserted Product: "${productPayload.title}" | Images: ${localRelativeImages.length} saved (UUID: ${insertedProduct.id})`
          );

          // Cache product ID for variant linking
          if (row['ID']) {
            productCache.set(row['ID'], insertedProduct.id);
            productCache.set(`id:${row['ID']}`, insertedProduct.id);
          }
          if (cleanSku) {
            productCache.set(cleanSku, insertedProduct.id);
          }
        }
      } catch (err) {
        console.error(`[Error] ❌ Exception processing row ${idx + 1} (${row['ID']}):`, err.message);
        skippedCount++;
      }

    // -------------------------------------------------------------
    // SCENARIO 2: VARIANT PRODUCT ('variation')
    // -------------------------------------------------------------
    } else {
      try {
        const parentRef = (row['Parent'] || '').trim();
        let parentId =
          productCache.get(parentRef) ||
          productCache.get(`id:${parentRef}`) ||
          productCache.get(parentRef.replace(/^id:/, ''));

        // If parent not in memory, attempt database lookup
        if (!parentId && parentRef) {
          const { data: parentRecord } = await supabase
            .from('products')
            .select('id')
            .or(`sku.eq.${parentRef},id.eq.${parentRef}`)
            .maybeSingle();

          if (parentRecord) {
            parentId = parentRecord.id;
            productCache.set(parentRef, parentId);
          }
        }

        if (!parentId) {
          console.warn(`[Variant Warning] ⚠️ Skipped variation (ID: ${row['ID']}) - Parent reference "${parentRef}" not found.`);
          skippedCount++;
          continue;
        }

        // Relational Upsert: Category & Brand
        const { categorySlug } = await upsertCategoryHierarchy(row['Categories']);
        const brandName = detectBrandName(row);
        const { brandSlug } = await upsertBrand(brandName);

        // Download variant specific image if available
        let variantImageUrl = null;
        if (row['Images']) {
          const firstImage = row['Images'].split(',')[0].trim();
          if (firstImage) {
            const varFilename = `variant-${row['ID']}.jpg`;
            variantImageUrl = await downloadAndSaveImage(firstImage, categorySlug, brandSlug, varFilename);
            if (variantImageUrl) imagesDownloaded++;
          }
        }

        const regularPrice = parseFloat(row['Regular price']) || 0;
        const salePrice = parseFloat(row['Sale price']) || 0;
        const activePrice = salePrice > 0 ? salePrice : (regularPrice > 0 ? regularPrice : 0);
        const originalPrice = regularPrice > 0 ? regularPrice : (salePrice > 0 ? salePrice : null);
        const stockQty = parseInt(row['Stock'], 10) || (row['In stock?'] === '1' ? 5 : 0);
        const attributes = parseAttributes(row);

        const variantPayload = {
          product_id: parentId,
          sku: row['SKU']?.trim() || `VAR-${row['ID']}`,
          variant_name: row['Name']?.trim() || `Variant ${row['ID']}`,
          price: activePrice,
          original_price: originalPrice,
          stock_quantity: stockQty,
          attributes: attributes,
          image_url: variantImageUrl
        };

        const { error: varError } = await supabase
          .from('product_variants')
          .upsert(variantPayload, { onConflict: 'sku' });

        if (varError) {
          console.error(`[Error] ❌ Failed to upsert variant "${variantPayload.variant_name}": ${varError.message}`);
          skippedCount++;
        } else {
          variantCount++;
          console.log(`🔌 [${idx + 1}/${rows.length}] Upserted Variant: "${variantPayload.variant_name}" -> Parent UUID: ${parentId}`);
        }
      } catch (err) {
        console.error(`[Error] ❌ Exception processing variant row ${idx + 1}:`, err.message);
        skippedCount++;
      }
    }
  }

  console.log('\n==================================================================');
  console.log('🎉 LOCAL ETL MIGRATION COMPLETED SUCCESSFULLY!');
  console.log(`📦 Simple / Parent Products Upserted: ${parentCount}`);
  console.log(`🔌 Product Variants Upserted:        ${variantCount}`);
  console.log(`🖼️ Local Images Saved:               ${imagesDownloaded}`);
  console.log(`⚠️ Skipped / Error Records:           ${skippedCount}`);
  console.log(`📁 Local Storage Directory:          public/uploads/`);
  console.log('==================================================================\n');
}

runLocalMigration().catch((err) => {
  console.error('❌ Fatal unhandled exception during ETL migration:', err);
  process.exit(1);
});
