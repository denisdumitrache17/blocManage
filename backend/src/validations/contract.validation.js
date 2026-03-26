import { z } from 'zod';

export const contractIdParamSchema = z.object({
  contractId: z.string().uuid()
});