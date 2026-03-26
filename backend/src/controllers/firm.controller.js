import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';
import {
  listFirms,
  getFirmById,
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem
} from '../services/firm.service.js';

export const listFirmsController = asyncHandler(async (req, res) => {
  const firms = await listFirms();
  res.status(200).json({ firms });
});

export const getFirmByIdController = asyncHandler(async (req, res) => {
  const firm = await getFirmById(req.params.firmId);
  res.status(200).json({ firm });
});

export const addPortfolioController = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('Imaginea este obligatorie', 400);
  }

  const title = req.body.title?.trim();
  if (!title) {
    throw new AppError('Titlul este obligatoriu', 400);
  }

  const imageUrl = `/uploads/portfolio/${req.file.filename}`;
  const item = await addPortfolioItem(req.authUser, title, imageUrl);
  res.status(201).json({ portfolio: item });
});

export const updatePortfolioController = asyncHandler(async (req, res) => {
  const title = req.body.title?.trim() || undefined;
  const imageUrl = req.file ? `/uploads/portfolio/${req.file.filename}` : undefined;

  const item = await updatePortfolioItem(req.authUser, req.params.portfolioId, title, imageUrl);
  res.status(200).json({ portfolio: item });
});

export const deletePortfolioController = asyncHandler(async (req, res) => {
  await deletePortfolioItem(req.authUser, req.params.portfolioId);
  res.status(200).json({ message: 'Elementul a fost șters din portofoliu' });
});
