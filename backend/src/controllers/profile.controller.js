import asyncHandler from '../utils/asyncHandler.js';
import { updateProfile, changePassword } from '../services/profile.service.js';

export const updateProfileController = asyncHandler(async (req, res) => {
  const user = await updateProfile(req.authUser, req.body);
  res.status(200).json({ message: 'Profilul a fost actualizat', user });
});

export const changePasswordController = asyncHandler(async (req, res) => {
  await changePassword(req.authUser, req.body.currentPassword, req.body.newPassword);
  res.status(200).json({ message: 'Parola a fost schimbată cu succes' });
});
