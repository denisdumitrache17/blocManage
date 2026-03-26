import { z } from 'zod';

const emailSchema = z.string().trim().email();
const passwordSchema = z.string().min(8).max(72);

// ── Tenant ──────────────────────────────────────────────
export const registerTenantSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  cnp: z.string().trim().min(13).max(20).optional().nullable().or(z.literal('')),
  hoaId: z.string().uuid(),
  staircaseId: z.string().uuid(),
  apartmentNumber: z.string().trim().min(1).max(20)
});

// ── HOA ─────────────────────────────────────────────────
const staircaseItemSchema = z.object({
  name: z.string().trim().min(1).max(100),
  apartmentsCount: z.number().int().positive()
});

export const registerHoaSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  presidentName: z.string().trim().min(2).max(100),
  adminName: z.string().trim().min(2).max(100),
  buildingAddress: z.string().trim().min(5).max(255),
  staircases: z.array(staircaseItemSchema).min(1),
  documentsUrl: z.string().trim().url().optional().nullable()
});

// ── Firm ────────────────────────────────────────────────
const portfolioItemSchema = z.object({
  title: z.string().trim().min(2).max(200),
  imageUrl: z.string().trim().url()
});

export const registerFirmSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  companyName: z.string().trim().min(2).max(120),
  cui: z.string().trim().min(2).max(50),
  caen: z.string().trim().min(2).max(20),
  adminName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  contactEmail: emailSchema,
  hqAddress: z.string().trim().min(5).max(255),
  iban: z.string().trim().min(8).max(34),
  bankName: z.string().trim().min(2).max(100),
  domains: z.array(z.string().trim().min(1)).min(1, 'Selectează cel puțin un domeniu'),
  portfolios: z.array(portfolioItemSchema).optional().default([])
});

// ── Login ───────────────────────────────────────────────
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});