import { Router } from 'express';

import { updateProfileController, changePasswordController } from '../controllers/profile.controller.js';
import { protect } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validateRequest.js';
import {
  updateTenantProfileSchema,
  updateHoaProfileSchema,
  updateFirmProfileSchema,
  changePasswordSchema
} from '../validations/profile.validation.js';

const router = Router();

router.use(protect);

// Dynamic validation based on role
const validateProfileByRole = (req, res, next) => {
  const schemaMap = {
    TENANT: updateTenantProfileSchema,
    HOA: updateHoaProfileSchema,
    FIRM: updateFirmProfileSchema,
    PLATFORM_ADMIN: null // admin has no profile sub-entity to update
  };

  const schema = schemaMap[req.authUser.role];
  if (schema === undefined) {
    return res.status(400).json({ message: 'Rol necunoscut' });
  }
  if (schema === null) {
    return res.status(400).json({ message: 'PLATFORM_ADMIN nu are profil editabil' });
  }

  return validateBody(schema)(req, res, next);
};

router.put('/', validateProfileByRole, updateProfileController);
router.put('/password', validateBody(changePasswordSchema), changePasswordController);

export default router;
