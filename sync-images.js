import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import csv from 'csv-parser';

// Load environment variables from .env
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Supabase credentials missing. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY) are set in .env.');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  Warning: SUPABASE_SERVICE_ROLE_KEY is not explicitly set in .env. Falling back to ANON key.');
  console.warn('⚠️  If storage uploads fail with RLS policy violations (403), please set SUPABASE_SERVICE_ROLE_KEY in .env.\n');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const STORAGE_BUCKET = 'product-gallery';

// Helper delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Loads CSV file from root if present to build a fallback image mapping
 */
async function loadCsvImageMap() {
  const csvFiles = [
    'wc-product-export-12-9-2026-1789189680541_3.csv',
    'wc-product-export-12-9-2026-1789189680541.csv'
  ];

  const targetCsv = csvFiles.find((f) => fs.existsSync(f));
  const csvMap = new Map();

  if (!targetCsv) {
    console.log('ℹ️  No WooCommerce CSV export file found in root, proceeding with database records only.');
    return csvMap;
  }

  console.log(`📄 Reading CSV image catalog: ${targetCsv}...`);

  return new Promise((resolve) => {
    fs.createReadStream(targetCsv)
      .pipe(csv())
      .on('data', (row) => {
        const name = (row['Name'] || '').trim().toLowerCase();
        const imagesStr = (row['Images'] || '').trim();
        if (name && imagesStr) {
          const imgUrls = imagesStr.split(',').map((u) => u.trim()).filter(Boolean);
          if (imgUrls.length > 0) {
            csvMap.set(name, imgUrls);
          }
        }
      })
      .on('end', () => {
        console.log(`✅ Loaded ${csvMap.size} product image records from CSV.\n`);
        resolve(csvMap);
      })
      .on('error', (err) => {
        console.warn(`⚠️ Warning: Failed to parse CSV (${err.message}). Proceeding without CSV fallback.`);
        resolve(csvMap);
      });
  });
}

/**
 * Main Image ETL Migration Function
 */
async function syncImages() {
  console.log('================================================================');
  console.log('🖼️  STARTING WORDPRESS TO SUPABASE STORAGE IMAGE MIGRATION');
  console.log(`🗄️  Target Bucket: "${STORAGE_BUCKET}"`);
  console.log(`🌐 Supabase URL:  ${SUPABASE_URL}`);
  console.log('================================================================\n');

  // Load CSV images as fallback
  const csvImageMap = await loadCsvImageMap();

  // Target Identification: Query products table
  console.log('🔍 Querying products table for legacy images matching "sunxlaptop.lk"...');

  const { data: allProducts, error: fetchError } = await supabase
    .from('products')
    .select('id, title, slug, images')
    .order('created_at', { ascending: true });

  if (fetchError) {
    console.error(`❌ Failed to fetch products from Supabase: ${fetchError.message}`);
    process.exit(1);
  }

  const totalProductsInDb = allProducts.length;

  // Filter products that have images matching 'sunxlaptop.lk'
  const targetProducts = allProducts.filter((product) => {
    let hasMatchingImage = false;

    if (Array.isArray(product.images) && product.images.length > 0) {
      hasMatchingImage = product.images.some(
        (img) => typeof img === 'string' && img.includes('sunxlaptop.lk')
      );
    }

    // Fallback: If DB images are empty, check if CSV has a matching image
    if (!hasMatchingImage && (!product.images || product.images.length === 0)) {
      const csvUrls = csvImageMap.get((product.title || '').trim().toLowerCase());
      if (csvUrls && csvUrls.some((u) => u.includes('sunxlaptop.lk'))) {
        product.images = csvUrls;
        hasMatchingImage = true;
      }
    }

    return hasMatchingImage;
  });

  console.log(`📊 Found ${targetProducts.length} products to migrate (out of ${totalProductsInDb} total products).\n`);

  if (targetProducts.length === 0) {
    console.log('✨ No legacy images found to migrate. Everything is already up to date!');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  // Sequential Processing Loop (for...of)
  for (const [index, product] of targetProducts.entries()) {
    const progressLabel = `[${index + 1}/${totalProductsInDb}]`;

    try {
      // 1. Buffer Extraction: find the first legacy URL
      const legacyUrl =
        product.images.find(
          (u) => typeof u === 'string' && u.includes('sunxlaptop.lk')
        ) || product.images[0];

      if (!legacyUrl || !legacyUrl.startsWith('http')) {
        console.warn(`⚠️ ${progressLabel} Skipped invalid image URL for: ${product.slug}`);
        failCount++;
        continue;
      }

      // Download legacy image as ArrayBuffer using axios
      const response = await axios.get(legacyUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        validateStatus: (status) => status === 200
      });

      const buffer = Buffer.from(response.data);

      // 2. Storage Injection
      const storagePath = `products/${product.slug}/main-image.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, buffer, {
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        throw new Error(`Storage upload error: ${uploadError.message}`);
      }

      // 3. Database Overwrite: Retrieve public URL and update product
      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(storagePath);

      const newPublicUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from('products')
        .update({ images: [newPublicUrl] })
        .eq('id', product.id);

      if (updateError) {
        throw new Error(`Database update error: ${updateError.message}`);
      }

      successCount++;
      console.log(`✅ ${progressLabel} Migrated image for: ${product.slug}`);
    } catch (err) {
      failCount++;
      console.warn(`⚠️ ${progressLabel} Warning: Could not migrate image for "${product.slug}" (${err.message})`);
    }

    // Resilience & Throttling: 500ms delay between items
    await delay(500);
  }

  console.log('\n================================================================');
  console.log('🎉 IMAGE MIGRATION COMPLETE');
  console.log(`✅ Successfully Migrated: ${successCount}`);
  console.log(`⚠️  Failed / Skipped:     ${failCount}`);
  console.log(`📊 Total Target:         ${targetProducts.length}`);
  console.log('================================================================\n');
}

syncImages().catch((err) => {
  console.error('❌ Fatal error in sync-images script:', err);
  process.exit(1);
});
