import { Router } from 'express';

import { createInvoiceController, listInvoicesController, updateInvoiceStatusController, uploadInvoicePdfController } from '../controllers/invoice.controller.js';
import { authorizeRoles, protect } from '../middlewares/auth.js';
import { validateBody, validateParams } from '../middlewares/validateRequest.js';
import { createInvoiceSchema, invoiceIdParamSchema, updateInvoiceStatusSchema } from '../validations/invoice.validation.js';
import { uploadInvoicePdf } from '../middlewares/upload.js';

const router = Router();

router.use(protect);
router.get('/', listInvoicesController);
router.post('/', authorizeRoles('PLATFORM_ADMIN'), validateBody(createInvoiceSchema), createInvoiceController);
router.patch('/:invoiceId/status', authorizeRoles('PLATFORM_ADMIN'), validateParams(invoiceIdParamSchema), validateBody(updateInvoiceStatusSchema), updateInvoiceStatusController);
router.patch('/:invoiceId/upload-pdf', authorizeRoles('PLATFORM_ADMIN'), validateParams(invoiceIdParamSchema), uploadInvoicePdf, uploadInvoicePdfController);

export default router;