import { z } from 'zod';

// ── Update profile schemas per role ─────────────────────

export const updateTenantProfileSchema = z.object({
  firstName: z.string().trim().min(2).max(100).optional(),
  lastName: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  addressText: z.string().trim().min(5).max(255).optional(),
  apartmentNumber: z.string().trim().min(1).max(20).optional()
});

export const updateHoaProfileSchema = z.object({
  presidentName: z.string().trim().min(2).max(100).optional(),
  adminName: z.string().trim().min(2).max(100).optional(),
  buildingAddress: z.string().trim().min(5).max(255).optional(),
  documentsUrl: z.string().trim().url().optional().nullable()
});

export const updateFirmProfileSchema = z.object({
  companyName: z.string().trim().min(2).max(120).optional(),
  adminName: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  contactEmail: z.string().trim().email().optional(),
  hqAddress: z.string().trim().min(5).max(255).optional(),
  iban: z.string().trim().min(8).max(34).optional(),
  bankName: z.string().trim().min(2).max(100).optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Parola curentă este obligatorie'),
  newPassword: z.string().min(8, 'Parola nouă trebuie să aibă minim 8 caractere').max(72)
});
