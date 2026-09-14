import express from 'express';
import multer from 'multer';
import fse from 'fs-extra';
import path from 'path';

const router = express.Router();

/**
 * Sanitizes category and brand slugs for filesystem safety
 */
function sanitizeSlug(slug, fallback = 'general') {
  if (!slug || typeof slug !== 'string') return fallback;
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/(^-|-$)+/g, '') || fallback;
}

// -------------------------------------------------------------
// MULTER DISK STORAGE CONFIGURATION
// -------------------------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const categorySlug = sanitizeSlug(req.body?.categorySlug || req.query?.categorySlug, 'uncategorized');
    const brandSlug = sanitizeSlug(req.body?.brandSlug || req.query?.brandSlug, 'generic');
    const destDir = path.join(process.cwd(), 'public', 'uploads', categorySlug, brandSlug);

    // Dynamically ensure directory exists using fs-extra
    fse.ensureDirSync(destDir);
    cb(null, destDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: Date.now() + '-' + sanitized original name
    const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFilename = `${Date.now()}-${sanitizedOriginal}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB max per image
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, GIF, SVG) are allowed.'));
    }
  }
});

/**
 * Upload Handler: Accepts multiple images, moves to dynamic directory, returns relative paths
 */
const handleUpload = (req, res) => {
  upload.any()(req, res, (err) => {
    if (err) {
      console.error('❌ Multer Upload Error:', err);
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded. Please select at least one image.' });
    }

    const categorySlug = sanitizeSlug(req.body?.categorySlug || req.query?.categorySlug, 'uncategorized');
    const brandSlug = sanitizeSlug(req.body?.brandSlug || req.query?.brandSlug, 'generic');
    const targetDir = path.join(process.cwd(), 'public', 'uploads', categorySlug, brandSlug);
    fse.ensureDirSync(targetDir);

    const relativePaths = req.files.map((file) => {
      const currentPath = file.path;
      const finalPath = path.join(targetDir, file.filename);

      // Handle stream order edge-case: if fields were parsed after files, relocate
      if (currentPath !== finalPath) {
        try {
          fse.moveSync(currentPath, finalPath, { overwrite: true });
        } catch (moveErr) {
          console.error('Error relocating file to target directory:', moveErr);
        }
      }

      return `/uploads/${categorySlug}/${brandSlug}/${file.filename}`;
    });

    console.log(`[Upload Success] 📸 Saved ${relativePaths.length} image(s) to public/uploads/${categorySlug}/${brandSlug}/`);

    return res.status(200).json({
      success: true,
      message: `${relativePaths.length} file(s) uploaded successfully.`,
      paths: relativePaths,
      urls: relativePaths // Alias for maximum frontend compatibility
    });
  });
};

// Route definitions for both '/api/upload' and '/upload'
router.post('/api/upload', handleUpload);
router.post('/upload', handleUpload);

export default router;
export { router as uploadRouter, handleUpload };
