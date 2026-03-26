import { z } from 'zod';

export const createInvoiceSchema = z.object({
  requestId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  pdfUrl: z.string().trim().url().optional().nullable()
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['UNPAID', 'PAID', 'OVERDUE'])
});

export const invoiceIdParamSchema = z.object({
  invoiceId: z.string().uuid()
});