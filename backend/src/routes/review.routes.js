import { Router } from 'express';

import { createReviewController, listReviewsController } from '../controllers/review.controller.js';
import { protect } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validateRequest.js';
import { createReviewSchema } from '../validations/review.validation.js';

const router = Router();

router.use(protect);
router.get('/', listReviewsController);
router.post('/', validateBody(createReviewSchema), createReviewController);

export default router;