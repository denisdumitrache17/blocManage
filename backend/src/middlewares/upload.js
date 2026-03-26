import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import AppError from '../utils/appError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Portfolio image upload ──────────────────────────────

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const PORTFOLIO_DIR = path.resolve(__dirname, '../../uploads/portfolio');

const portfolioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PORTFOLIO_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  }
});

export const uploadPortfolioImage = multer({
  storage: portfolioStorage,
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new AppError('Tip de fișier nepermis. Sunt acceptate: JPG, PNG, WebP, GIF', 400), false);
  },
  limits: { fileSize: MAX_IMAGE_SIZE }
}).single('image');

// ── Contract PDF upload ─────────────────────────────────

const ALLOWED_PDF_TYPES = ['application/pdf'];
const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10 MB
const CONTRACTS_DIR = path.resolve(__dirname, '../../uploads/contracts');

// Ensure directory exists
if (!fs.existsSync(CONTRACTS_DIR)) {
  fs.mkdirSync(CONTRACTS_DIR, { recursive: true });
}

const contractStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CONTRACTS_DIR),
  filename: (_req, file, cb) => {
    cb(null, `${randomUUID()}.pdf`);
  }
});

export const uploadContractPdf = multer({
  storage: contractStorage,
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_PDF_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new AppError('Doar fișiere PDF sunt acceptate', 400), false);
  },
  limits: { fileSize: MAX_PDF_SIZE }
}).single('pdf');

// ── Invoice PDF upload ──────────────────────────────────

const INVOICES_DIR = path.resolve(__dirname, '../../uploads/invoices');

if (!fs.existsSync(INVOICES_DIR)) {
  fs.mkdirSync(INVOICES_DIR, { recursive: true });
}

const invoiceStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, INVOICES_DIR),
  filename: (_req, file, cb) => {
    cb(null, `${randomUUID()}.pdf`);
  }
});

export const uploadInvoicePdf = multer({
  storage: invoiceStorage,
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_PDF_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new AppError('Doar fișiere PDF sunt acceptate', 400), false);
  },
  limits: { fileSize: MAX_PDF_SIZE }
}).single('pdf');
