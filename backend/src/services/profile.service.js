import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import AppError from '../utils/appError.js';
import { publicUserSelect } from '../utils/selects.js';

export const updateProfile = async (user, data) => {
  const role = user.role;

  if (role === 'TENANT') {
    await prisma.tenant.update({
      where: { userId: user.id },
      data
    });
  } else if (role === 'HOA') {
    await prisma.hoa.update({
      where: { userId: user.id },
      data
    });
  } else if (role === 'FIRM') {
    const updateData = { ...data };
    if (updateData.contactEmail) {
      updateData.email = updateData.contactEmail;
      delete updateData.contactEmail;
    }
    await prisma.firm.update({
      where: { userId: user.id },
      data: updateData
    });
  } else {
    throw new AppError('Rol necunoscut', 400);
  }

  return prisma.user.findUnique({
    where: { id: user.id },
    select: publicUserSelect
  });
};

export const changePassword = async (user, currentPassword, newPassword) => {
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) throw new AppError('Utilizatorul nu a fost găsit', 404);

  const isMatch = await bcrypt.compare(currentPassword, dbUser.passwordHash);
  if (!isMatch) throw new AppError('Parola curentă este incorectă', 400);

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash }
  });
};
