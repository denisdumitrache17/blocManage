import { Router } from 'express';

import {
  listFirmsController,
  getFirmByIdController,
  addPortfolioController,
  updatePortfolioController,
  deletePortfolioController
} from '../controllers/firm.controller.js';
import { authorizeRoles, protect } from '../middlewares/auth.js';
import { validateParams } from '../middlewares/validateRequest.js';
import { uploadPortfolioImage } from '../middlewares/upload.js';
import {
  firmIdParamSchema,
  portfolioIdParamSchema
} from '../validations/firm.validation.js';

const router = Router();

router.use(protect);
router.get('/', listFirmsController);
router.get('/:firmId', validateParams(firmIdParamSchema), getFirmByIdController);

// Portfolio management (FIRM only) — file upload via multipart/form-data
router.post('/portfolio', authorizeRoles('FIRM'), uploadPortfolioImage, addPortfolioController);
router.put('/portfolio/:portfolioId', authorizeRoles('FIRM'), validateParams(portfolioIdParamSchema), uploadPortfolioImage, updatePortfolioController);
router.delete('/portfolio/:portfolioId', authorizeRoles('FIRM'), validateParams(portfolioIdParamSchema), deletePortfolioController);

export default router;
