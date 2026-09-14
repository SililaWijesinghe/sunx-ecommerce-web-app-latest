import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import slugify from 'slugify';
import dotenv from 'dotenv';

// Load local environment configurations if present
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// Prefer service role key if available to bypass any storage RLS, otherwise use anon key
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Fatal Error: Supabase credentials (URL or Key) are missing from the environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

const TARGET_CSV_FILENAME = 'wc-product-export-12-9-2026-1789189680541_3.csv';
const FALLBACK_CSV_FILENAME = 'wc-product-export-12-9-2026-1789189680541.csv';
const CSV_FILE_PATH = fs.existsSync(TARGET_CSV_FILENAME) ? TARGET_CSV_FILENAME : FALLBACK_CSV_FILENAME;
const STORAGE_BUCKET = 'product-gallery';

// Helper: Clean Slugs
function makeSlug(text) {
  return slugify(text || '', { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
}

// In-Memory Lookup Caches to avoid redundant queries & ensure speed
const categoryCache = {}; // Key: `${parentId || 'root'}:${normalizedName}` -> UUID
const categorySlugMap = {}; // Key: UUID -> slug
const brandCache = {};    // Key: brandSlug -> UUID
const productCache = {};  // Key: SKU, ID, or 'id:123' -> UUID
const usedProductSlugs = new Set();

/**
 * HTML PARSER: Uses cheerio to extract clean <li> key-value pairs from HTML Description
 */
function extractSpecifications(htmlContent) {
  if (!htmlContent) return null;
  // Normalize any literal escaped newlines from CSV exports
  const normalizedHtml = htmlContent.replace(/\\n/g, '\n').replace(/\\r/g, '');
  const $ = cheerio.load(normalizedHtml);
  const specs = {};

  // Clean and sanitize string helpers
  const cleanKey = (k) => k ? k.replace(/^[\\n\r\s\-_:•*]+/, '').replace(/[:\-_]+$/, '').trim() : '';
  const cleanVal = (v) => v ? v.replace(/^[\\n\r\s\-_:]+/, '').replace(/\s+/g, ' ').trim() : '';

  // 1. Process <li> elements with key-value pairs (e.g. Capacity: 1TB or Model: X)
  $('li').each((_, el) => {
    const rawText = $(el).text().trim();
    if (!rawText) return;

    if (rawText.includes(':')) {
      const idx = rawText.indexOf(':');
      const k = cleanKey(rawText.substring(0, idx));
      const v = cleanVal(rawText.substring(idx + 1));
      if (k && v && k.length < 50 && v.length < 250) {
        specs[k] = v;
      }
    } else if (rawText.includes(' – ') || rawText.includes(' - ')) {
      const sep = rawText.includes(' – ') ? ' – ' : ' - ';
      const parts = rawText.split(sep);
      const k = cleanKey(parts[0]);
      const v = cleanVal(parts.slice(1).join(sep));
      if (k && v && k.length < 50 && v.length < 250) {
        specs[k] = v;
      }
    }
  });

  // 2. Process Two-Column Specification Tables (e.g. <tr><th>Attribute</th><td>Detail</td></tr>)
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

  // 3. Fallback: Parse plain text lines with "Key: Value" (skipping URLs, headers, boilerplate)
  if (Object.keys(specs).length === 0) {
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
  }

  return Object.keys(specs).length > 0 ? specs : null;
}

/**
 * BRAND EXTRACTOR: Implied from deepest category, tags, or product title
 */
const KNOWN_BRANDS = [
  'Toshiba', 'Acer', 'Western Digital', 'WD', 'Transcend', 'Dell', 'HP',
  'Fujitsu', 'Lenovo', 'Samsung', 'Sony', 'Asus', 'Kingston', 'Wise',
  'Logitech', 'Handboss', 'Lexar', 'Apple', '3KS', 'Mikuso', 'DATO',
  'Singer', 'Silicon Power', 'SP', 'Canon', 'Intel'
];

function detectBrandName(categoryStr, tagsStr, productName) {
  // 1. Check deepest category segment if it matches a brand
  if (categoryStr) {
    const paths = categoryStr.split(',').map(s => s.trim());
    for (const p of paths) {
      if (p.includes('>')) {
        const parts = p.split('>').map(s => s.trim());
        const candidate = parts[parts.length - 1];
        if (candidate && !['screen', 'battery', 'keyboard', 'fan', 'ram', 'ssd', 'hdd'].some(w => candidate.toLowerCase().includes(w))) {
          // Normalize names like "hp" -> "HP", "WD" -> "Western Digital"
          const matched = KNOWN_BRANDS.find(b => b.toLowerCase() === candidate.toLowerCase());
          return matched || candidate;
        }
      }
    }
  }

  // 2. Check Tags
  if (tagsStr) {
    const tags = tagsStr.split(',').map(t => t.trim());
    for (const b of KNOWN_BRANDS) {
      if (tags.some(t => t.toLowerCase() === b.toLowerCase())) {
        return b;
      }
    }
  }

  // 3. Check Product Name
  if (productName) {
    for (const b of KNOWN_BRANDS) {
      if (new RegExp(`\\b${b}\\b`, 'i').test(productName)) {
        return b;
      }
    }
  }

  return 'SUNX';
}

/**
 * BRAND UPSERT: Inserts brand with clean slug and placeholder logo_url
 */
async function upsertBrand(brandName) {
  const brandSlug = makeSlug(brandName) || 'brand-generic';
  if (brandCache[brandSlug]) return brandCache[brandSlug];

  const logoUrl = `https://placehold.co/200x80/111827/FFFFFF.png?text=${encodeURIComponent(brandName)}`;

  // Check if brand exists
  const { data: existing } = await supabase
    .from('brands')
    .select('id')
    .eq('slug', brandSlug)
    .maybeSingle();

  if (existing) {
    brandCache[brandSlug] = existing.id;
    return existing.id;
  }

  // Insert Brand
  const { data, error } = await supabase
    .from('brands')
    .insert({
      name: brandName,
      slug: brandSlug,
      logo_url: logoUrl
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') { // Unique constraint
      const { data: retry } = await supabase.from('brands').select('id').eq('slug', brandSlug).single();
      if (retry) {
        brandCache[brandSlug] = retry.id;
        return retry.id;
      }
    }
    console.warn(`[Brand Warning] ⚠️ Failed upserting brand ${brandName}: ${error.message}`);
    return null;
  }

  brandCache[brandSlug] = data.id;
  console.log(`[Brand] 🏷️ Upserted brand: "${brandName}" (ID: ${data.id})`);
  return data.id;
}

/**
 * CATEGORIES UPSERT: Handles parent and child hierarchy
 */
async function upsertCategoryHierarchy(categoryString) {
  if (!categoryString) return { categoryId: null, categorySlug: 'general' };

  // Pick the most specific path (e.g. "Laptop Battery > Acer, Laptop Battery" -> "Laptop Battery > Acer")
  const paths = categoryString.split(',').map(s => s.trim());
  const bestPath = paths.find(p => p.includes('>')) || paths[0];
  if (!bestPath) return { categoryId: null, categorySlug: 'general' };

  const parts = bestPath.split('>').map(s => s.trim()).filter(Boolean);
  let parentId = null;
  let currentSlug = '';
  let lastId = null;

  for (let i = 0; i < parts.length; i++) {
    const partName = parts[i];
    const cacheKey = `${parentId || 'root'}:${partName.toLowerCase()}`;

    if (categoryCache[cacheKey]) {
      parentId = categoryCache[cacheKey];
      lastId = parentId;
      currentSlug = categorySlugMap[parentId] || makeSlug(partName);
      continue;
    }

    // Build unique slug taking parent into account for child levels
    const nodeSlug = i === 0 ? makeSlug(partName) : `${makeSlug(parts[0])}-${makeSlug(partName)}`;
    currentSlug = nodeSlug;

    // Check if category exists by slug
    const { data: existing } = await supabase
      .from('categories')
      .select('id, slug')
      .eq('slug', nodeSlug)
      .maybeSingle();

    if (existing) {
      parentId = existing.id;
      lastId = existing.id;
      categoryCache[cacheKey] = existing.id;
      categorySlugMap[existing.id] = existing.slug;
      continue;
    }

    // Upsert category
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: partName,
        slug: nodeSlug,
        parent_id: parentId
      })
      .select('id, slug')
      .single();

    if (error) {
      if (error.code === '23505') {
        const { data: retry } = await supabase.from('categories').select('id, slug').eq('slug', nodeSlug).single();
        if (retry) {
          parentId = retry.id;
          lastId = retry.id;
          categoryCache[cacheKey] = retry.id;
          categorySlugMap[retry.id] = retry.slug;
          continue;
        }
      }
      console.warn(`[Category Warning] ⚠️ Failed inserting category "${partName}": ${error.message}`);
      break;
    }

    parentId = data.id;
    lastId = data.id;
    categoryCache[cacheKey] = data.id;
    categorySlugMap[data.id] = data.slug;
    console.log(`[Category] 📂 Upserted ${i === 0 ? 'Parent' : 'Child'} Category: "${partName}" (Slug: ${nodeSlug})`);
  }

  return { categoryId: lastId, categorySlug: currentSlug || 'general' };
}

/**
 * ASSET PIPELINE: Fetches image as ArrayBuffer and uploads directly to product-gallery bucket
 */
async function syncImageToStorage(imageUrl, categorySlug, productSlug) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const cleanUrl = imageUrl.trim();
  if (!cleanUrl.startsWith('http')) return null;

  try {
    const urlObj = new URL(cleanUrl);
    const filename = path.basename(urlObj.pathname) || 'product-image.jpg';
    const storagePath = `${categorySlug}/${productSlug}/${filename}`;

    // 1. Fetch image as ArrayBuffer
    const response = await axios.get(cleanUrl, {
      responseType: 'arraybuffer',
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      validateStatus: (status) => status === 200
    });

    const buffer = Buffer.from(response.data);
    const contentType = response.headers['content-type'] || 'image/jpeg';

    // 2. Upload to Supabase Storage bucket: product-gallery
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        upsert: true,
        contentType: contentType
      });

    if (uploadError) {
      console.warn(`[Storage Warning] ⚠️ Storage upload error for "${storagePath}": ${uploadError.message}. Using fallback original URL.`);
      return cleanUrl;
    }

    // 3. Retrieve public URL
    const { data: publicData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    console.log(`[Asset Pipeline] 🖼️ Synced storage image: ${storagePath}`);
    return publicData.publicUrl;
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.warn(`[Asset Pipeline] 🚫 Skipped dead 404 image link: ${cleanUrl}`);
    } else {
      console.warn(`[Asset Pipeline] 🚫 Skipped unreachable image (${err.message}): ${cleanUrl}`);
    }
    return null;
  }
}

/**
 * UNIQUE SLUG GENERATOR
 */
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

/**
 * ATTRIBUTES PARSER: Handles variants 'Attributes' column or Attribute columns
 */
function parseAttributes(row) {
  const attrs = {};
  if (row['Attributes']) {
    const pairs = row['Attributes'].split(',');
    pairs.forEach(p => {
      const [k, v] = p.split(':');
      if (k && v) attrs[k.trim()] = v.trim();
    });
  }

  // Also check WooCommerce standard Attribute column names
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

/**
 * MAIN ETL PIPELINE
 */
async function runETLMigration() {
  console.log("==================================================================");
  console.log("🚀 STARTING SUNX TECHNOLOGIES ULTIMATE ETL MIGRATION PIPELINE");
  console.log(`📂 Source CSV: ${CSV_FILE_PATH}`);
  console.log(`🗄️ Storage Bucket: ${STORAGE_BUCKET}`);
  console.log("==================================================================\n");

  const rows = [];
  fs.createReadStream(CSV_FILE_PATH)
    .pipe(csv())
    .on('data', (data) => rows.push(data))
    .on('end', async () => {
      console.log(`📋 Successfully loaded ${rows.length} records from CSV.\n`);

      let parentSuccessCount = 0;
      let variantSuccessCount = 0;
      let failureCount = 0;

      for (let idx = 0; idx < rows.length; idx++) {
        const row = rows[idx];
        const rawType = (row['Type'] || '').trim().toLowerCase();
        const isVariation = rawType === 'variation';

        // -------------------------------------------------------------
        // SCENARIO 1: SIMPLE OR VARIABLE PRODUCT
        // -------------------------------------------------------------
        if (!isVariation) {
          try {
            // 1. Categories & Brands
            const { categoryId, categorySlug } = await upsertCategoryHierarchy(row['Categories']);
            const brandName = detectBrandName(row['Categories'], row['Tags'], row['Name']);
            const brandId = await upsertBrand(brandName);

            // 2. Product Slug
            const productSlug = generateUniqueProductSlug(row['Name'], row['ID']);

            // 3. Asset Pipeline (Images)
            const rawImages = row['Images'] ? row['Images'].split(',').map(s => s.trim()).filter(Boolean) : [];
            const syncedImageUrls = [];
            for (const imgUrl of rawImages) {
              const uploadedUrl = await syncImageToStorage(imgUrl, categorySlug, productSlug);
              if (uploadedUrl) syncedImageUrls.push(uploadedUrl);
            }

            // 4. Prices & Discount Calculation
            const salePrice = parseFloat(row['Sale price']) || 0;
            const regularPrice = parseFloat(row['Regular price']) || 0;
            const activePrice = salePrice > 0 ? salePrice : (regularPrice > 0 ? regularPrice : 0);
            const originalPrice = regularPrice > 0 ? regularPrice : (salePrice > 0 ? salePrice : null);
            let discountPercent = 0;
            if (regularPrice > 0 && salePrice > 0 && regularPrice > salePrice) {
              discountPercent = Math.round(((regularPrice - salePrice) / regularPrice) * 100);
            }

            // 5. Stock & SKU
            const stockQty = parseInt(row['Stock'], 10) || (row['In stock?'] === '1' ? 10 : 0);
            const cleanSku = row['SKU']?.trim() || null;

            // 6. Specifications via Cheerio
            const specifications = extractSpecifications(row['Description']);

            // 7. Database Payload
            const productPayload = {
              title: row['Name']?.trim() || 'Untitled Product',
              slug: productSlug,
              price: activePrice,
              sale_price: salePrice > 0 ? salePrice : null,
              original_price: originalPrice,
              discount_percent: discountPercent,
              stock_quantity: stockQty,
              sku: cleanSku,
              description: row['Description'] || '',
              specifications: specifications || {},
              category_id: categoryId,
              brand_id: brandId,
              images: syncedImageUrls,
              rating: 5.0,
              review_count: 0,
              is_featured: row['Is featured?'] === '1',
              is_deal_of_day: false
            };

            const { data, error } = await supabase
              .from('products')
              .insert(productPayload)
              .select('id')
              .single();

            if (error) {
              console.error(`[Error] ❌ Failed to insert product "${row['Name']}": ${error.message}`);
              failureCount++;
            } else {
              parentSuccessCount++;
              console.log(`[Success] 📦 [${parentSuccessCount}/${rows.length}] Inserted Product: "${productPayload.title}" (ID: ${data.id})`);

              // Cache parent mapping for any future variations
              if (row['ID']) {
                productCache[row['ID']] = data.id;
                productCache[`id:${row['ID']}`] = data.id;
              }
              if (cleanSku) {
                productCache[cleanSku] = data.id;
              }
            }
          } catch (err) {
            console.error(`[Error] ❌ Exception processing product ${row['ID']}:`, err.message);
            failureCount++;
          }

        // -------------------------------------------------------------
        // SCENARIO 2: VARIATION
        // -------------------------------------------------------------
        } else {
          try {
            const parentRef = (row['Parent'] || '').trim();
            const parentId = productCache[parentRef] || 
                             productCache[`id:${parentRef}`] || 
                             productCache[parentRef.replace(/^id:/, '')];

            if (!parentId) {
              console.warn(`[Variant Warning] ⚠️ Skipped variation (ID: ${row['ID']}, SKU: ${row['SKU']}) - Parent product not found for Ref: "${parentRef}".`);
              failureCount++;
              continue;
            }

            // Sync single image for variant
            let variantImageUrl = null;
            if (row['Images']) {
              const firstImage = row['Images'].split(',')[0].trim();
              if (firstImage) {
                const varSlug = makeSlug(`${row['Name'] || 'variant'}-${row['ID']}`);
                variantImageUrl = await syncImageToStorage(firstImage, 'variants', varSlug);
              }
            }

            const salePrice = parseFloat(row['Sale price']) || 0;
            const regularPrice = parseFloat(row['Regular price']) || 0;
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
              .insert(variantPayload);

            if (varError) {
              console.error(`[Error] ❌ Failed to insert variant for parent ${parentId}: ${varError.message}`);
              failureCount++;
            } else {
              variantSuccessCount++;
              console.log(`[Success] 🔌 Inserted Variant "${variantPayload.variant_name}" linked to parent ${parentId}`);
            }
          } catch (err) {
            console.error(`[Error] ❌ Exception processing variant ${row['ID']}:`, err.message);
            failureCount++;
          }
        }
      }

      console.log("\n==================================================================");
      console.log("🎉 ETL MIGRATION COMPLETED SUCCESSFULLY!");
      console.log(`📦 Parent Products Inserted:  ${parentSuccessCount}`);
      console.log(`🔌 Product Variants Inserted: ${variantSuccessCount}`);
      console.log(`⚠️ Skipped/Failed Rows:       ${failureCount}`);
      console.log("==================================================================");
    });
}

runETLMigration().catch((err) => {
  console.error("❌ Fatal unhandled exception in migration script:", err);
});
