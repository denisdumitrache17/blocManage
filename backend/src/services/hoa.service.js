import prisma from '../config/prisma.js';
import AppError from '../utils/appError.js';
import { publicTenantSelect } from '../utils/selects.js';

const ensureHoaProfile = (user) => {
  if (!user.hoa?.id) {
    throw new AppError('Utilizatorul autentificat nu are profil HOA', 403);
  }
};

// ── Public (no auth) ────────────────────────────────────

export const listPublicHoas = async () => {
  return prisma.hoa.findMany({
    select: {
      id: true,
      buildingAddress: true,
      staircases: {
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      }
    },
    orderBy: { buildingAddress: 'asc' }
  });
};

export const createStaircase = async (user, payload) => {
  ensureHoaProfile(user);

  return prisma.staircase.create({
    data: {
      hoaId: user.hoa.id,
      name: payload.name,
      apartmentsCount: payload.apartmentsCount
    }
  });
};

export const listStaircases = async (user) => {
  ensureHoaProfile(user);

  return prisma.staircase.findMany({
    where: { hoaId: user.hoa.id },
    orderBy: { name: 'asc' }
  });
};

export const listHoaTenants = async (user) => {
  ensureHoaProfile(user);

  return prisma.tenant.findMany({
    where: { hoaId: user.hoa.id },
    select: publicTenantSelect,
    orderBy: [
      { isApproved: 'asc' },
      { lastName: 'asc' }
    ]
  });
};

export const updateTenantApproval = async (user, tenantId, payload) => {
  ensureHoaProfile(user);

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  if (!tenant || tenant.hoaId !== user.hoa.id) {
    throw new AppError('Tenant-ul nu apartine HOA-ului autentificat', 404);
  }

  return prisma.tenant.update({
    where: { id: tenantId },
    data: {
      isApproved: payload.isApproved
    },
    select: publicTenantSelect
  });
};

export const rejectTenant = async (user, tenantId) => {
  ensureHoaProfile(user);

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  if (!tenant || tenant.hoaId !== user.hoa.id) {
    throw new AppError('Tenant-ul nu apartine HOA-ului autentificat', 404);
  }

  // Deleting the User cascades to Tenant
  await prisma.user.delete({ where: { id: tenant.userId } });

  return { deleted: true };
};