import { Router } from 'express';

import {
  getContractController,
  listContractsController,
  uploadDraftController,
  uploadSignedController
} from '../controllers/contract.controller.js';
import { protect } from '../middlewares/auth.js';
import { uploadContractPdf } from '../middlewares/upload.js';
import { validateParams } from '../middlewares/validateRequest.js';
import { contractIdParamSchema } from '../validations/contract.validation.js';

const router = Router();

router.use(protect);
router.get('/', listContractsController);
router.get('/:contractId', validateParams(contractIdParamSchema), getContractController);
router.patch('/:contractId/upload-draft', validateParams(contractIdParamSchema), uploadContractPdf, uploadDraftController);
router.patch('/:contractId/upload-signed', validateParams(contractIdParamSchema), uploadContractPdf, uploadSignedController);

export default router;