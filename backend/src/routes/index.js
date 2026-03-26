import { Router } from 'express';

import authRouter from './auth.routes.js';
import contractRouter from './contract.routes.js';
import firmRouter from './firm.routes.js';
import hoaRouter from './hoa.routes.js';
import invoiceRouter from './invoice.routes.js';
import profileRouter from './profile.routes.js';
import requestRouter from './request.routes.js';
import reviewRouter from './review.routes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/requests', requestRouter);
router.use('/invoices', invoiceRouter);
router.use('/contracts', contractRouter);
router.use('/reviews', reviewRouter);
router.use('/firms', firmRouter);
router.use('/profile', profileRouter);
router.use('/hoa', hoaRouter);

export default router;