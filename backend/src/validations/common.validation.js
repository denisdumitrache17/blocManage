import { z } from 'zod';

export const idParamSchema = z.object({
  requestId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional()
});

export const uuidSchema = z.string().uuid();