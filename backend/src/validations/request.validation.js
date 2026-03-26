import { z } from 'zod';

export const createRequestSchema = z.object({
  category: z.string().trim().min(2).max(100),
  workType: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(5000),
  urgencyLevel: z.enum(['LOW', 'MEDIUM', 'CRITICAL']).default('LOW'),
  scope: z.enum(['PERSONAL', 'BUILDING'])
});

export const updateRequestStatusSchema = z.object({
  status: z.enum(['PENDING_HOA_APPROVAL', 'PENDING', 'VALIDATED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'])
});

export const assignFirmSchema = z.object({
  firmId: z.string().uuid()
});

export const requestIdParamSchema = z.object({
  requestId: z.string().uuid()
});