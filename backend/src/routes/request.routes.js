import { Router } from 'express';

import {
  assignFirmController,
  createRequestController,
  eligibleFirmsController,
  getRequestController,
  hoaApproveController,
  hoaRejectController,
  listRequestsController,
  updateRequestStatusController
} from '../controllers/request.controller.js';
import { authorizeRoles, protect } from '../middlewares/auth.js';
import { validateBody, validateParams } from '../middlewares/validateRequest.js';
import { assignFirmSchema, createRequestSchema, requestIdParamSchema, updateRequestStatusSchema } from '../validations/request.validation.js';

const router = Router();

router.use(protect);
router.get('/', listRequestsController);
router.post('/', validateBody(createRequestSchema), createRequestController);
router.get('/:requestId', validateParams(requestIdParamSchema), getRequestController);
router.patch('/:requestId/status', authorizeRoles('PLATFORM_ADMIN', 'FIRM'), validateParams(requestIdParamSchema), validateBody(updateRequestStatusSchema), updateRequestStatusController);
router.patch('/:requestId/assign-firm', authorizeRoles('PLATFORM_ADMIN'), validateParams(requestIdParamSchema), validateBody(assignFirmSchema), assignFirmController);
router.get('/:requestId/eligible-firms', authorizeRoles('PLATFORM_ADMIN'), validateParams(requestIdParamSchema), eligibleFirmsController);
router.patch('/:requestId/hoa-approve', authorizeRoles('HOA'), validateParams(requestIdParamSchema), hoaApproveController);
router.patch('/:requestId/hoa-reject', authorizeRoles('HOA'), validateParams(requestIdParamSchema), hoaRejectController);

export default router;