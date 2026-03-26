import { z } from 'zod';

export const portfolioItemSchema = z.object({
  title: z.string().min(1, 'Titlul este obligatoriu').max(200),
  imageUrl: z.string().url('URL-ul imaginii trebuie să fie valid')
});

export const updatePortfolioItemSchema = z.object({
  title: z.string().min(1, 'Titlul este obligatoriu').max(200).optional(),
  imageUrl: z.string().url('URL-ul imaginii trebuie să fie valid').optional()
});

export const firmIdParamSchema = z.object({
  firmId: z.string().uuid()
});

export const portfolioIdParamSchema = z.object({
  portfolioId: z.string().uuid()
});
