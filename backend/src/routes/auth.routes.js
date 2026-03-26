import { Router } from 'express';

import {
  login,
  logout,
  me,
  registerTenantController,
  registerHoaController,
  registerFirmController
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validateRequest.js';
import {
  loginSchema,
  registerTenantSchema,
  registerHoaSchema,
  registerFirmSchema
} from '../validations/auth.validation.js';

const router = Router();

router.post('/register/tenant', validateBody(registerTenantSchema), registerTenantController);
router.post('/register/hoa', validateBody(registerHoaSchema), registerHoaController);
router.post('/register/firm', validateBody(registerFirmSchema), registerFirmController);
router.post('/login', validateBody(loginSchema), login);
router.post('/logout', logout);
router.get('/me', protect, me);

export default router;