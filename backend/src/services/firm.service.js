import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import prisma from '../config/prisma.js';
import AppError from '../utils/appError.js';
import { publicFirmSelect } from '../utils/selects.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const listFirms = async () => {
  const firms = await prisma.firm.findMany({
    select: {
      ...publicFirmSelect,
      reviews: {
        select: { rating: true }
      }
    },
    orderBy: { companyName: 'asc' }
  });

  return firms.map((firm) => {
    const { reviews, ...rest } = firm;
    const ratings = reviews.map((r) => r.rating);
    return { ...rest, ratings };
  });
};

export const getFirmById = async (firmId) => {
  const firm = await prisma.firm.findUnique({
    where: { id: firmId },
    select: {
      ...publicFirmSelect,
      reviews: {
        select: {
          rating: true,
          comment: true,
          createdAt: true,
          reviewer: {
            select: {
              email: true,
              role: true,
              tenant: { select: { firstName: true, lastName: true } },
              hoa: { select: { presidentName: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!firm) {
    throw new AppError('Firma nu a fost găsită', 404);
  }

  const { reviews, ...rest } = firm;
  const ratings = reviews.map((r) => r.rating);
  return { ...rest, ratings, reviews };
};

// ── Portfolio CRUD (FIRM only) ──────────────────────────

const removeImageFile = (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;
  const filePath = path.resolve(__dirname, '..', imageUrl.slice(1)); // resolve relative to backend/
  fs.unlink(filePath, () => {}); // fire-and-forget
};

export const addPortfolioItem = async (user, title, imageUrl) => {
  if (user.role !== 'FIRM') {
    throw new AppError('Doar firmele pot gestiona portofoliul', 403);
  }

  return prisma.portfolio.create({
    data: {
      firmId: user.firm.id,
      title,
      imageUrl
    }
  });
};

export const updatePortfolioItem = async (user, portfolioId, title, newImageUrl) => {
  if (user.role !== 'FIRM') {
    throw new AppError('Doar firmele pot gestiona portofoliul', 403);
  }

  const item = await prisma.portfolio.findUnique({ where: { id: portfolioId } });

  if (!item || item.firmId !== user.firm.id) {
    throw new AppError('Elementul de portofoliu nu a fost găsit', 404);
  }

  const data = {};
  if (title) data.title = title;
  if (newImageUrl) {
    removeImageFile(item.imageUrl);
    data.imageUrl = newImageUrl;
  }

  return prisma.portfolio.update({
    where: { id: portfolioId },
    data
  });
};

export const deletePortfolioItem = async (user, portfolioId) => {
  if (user.role !== 'FIRM') {
    throw new AppError('Doar firmele pot gestiona portofoliul', 403);
  }

  const item = await prisma.portfolio.findUnique({ where: { id: portfolioId } });

  if (!item || item.firmId !== user.firm.id) {
    throw new AppError('Elementul de portofoliu nu a fost găsit', 404);
  }

  removeImageFile(item.imageUrl);
  return prisma.portfolio.delete({ where: { id: portfolioId } });
};
