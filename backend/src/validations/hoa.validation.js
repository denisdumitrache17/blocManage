import { z } from 'zod';

export const createStaircaseSchema = z.object({
  name: z.string().trim().min(1).max(100),
  apartmentsCount: z.number().int().positive()
});

export const updateTenantApprovalSchema = z.object({
  isApproved: z.boolean()
});

export const tenantIdParamSchema = z.object({
  tenantId: z.string().uuid()
});