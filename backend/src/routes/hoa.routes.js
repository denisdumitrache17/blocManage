import { Router } from 'express';

import {
  createStaircaseController,
  listHoaTenantsController,
  listPublicHoasController,
  listStaircasesController,
  rejectTenantController,
  updateTenantApprovalController
} from '../controllers/hoa.controller.js';
import { authorizeRoles, protect } from '../middlewares/auth.js';
import { validateBody, validateParams } from '../middlewares/validateRequest.js';
import { createStaircaseSchema, tenantIdParamSchema, updateTenantApprovalSchema } from '../validations/hoa.validation.js';

const router = Router();

// Public route — no auth needed
router.get('/public', listPublicHoasController);

// Protected HOA routes
router.use(protect, authorizeRoles('HOA'));
router.get('/staircases', listStaircasesController);
router.post('/staircases', validateBody(createStaircaseSchema), createStaircaseController);
router.get('/tenants', listHoaTenantsController);
router.patch('/tenants/:tenantId/approval', validateParams(tenantIdParamSchema), validateBody(updateTenantApprovalSchema), updateTenantApprovalController);
router.delete('/tenants/:tenantId', validateParams(tenantIdParamSchema), rejectTenantController);

export default router;