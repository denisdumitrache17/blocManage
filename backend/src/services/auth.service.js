import bcrypt from 'bcryptjs';

import prisma from '../config/prisma.js';
import env from '../config/env.js';
import AppError from '../utils/appError.js';
import { signAccessToken } from '../utils/jwt.js';
import { publicUserSelect } from '../utils/selects.js';

// ── helpers ─────────────────────────────────────────────

const hashPassword = (plain) => bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);

const buildAuthResult = (user) => ({
  token: signAccessToken({ sub: user.id, role: user.role }),
  user
});

// ── Register Tenant ─────────────────────────────────────

export const registerTenant = async (payload) => {
  const passwordHash = await hashPassword(payload.password);

  // Validate that HOA and staircase exist and match
  const hoa = await prisma.hoa.findUnique({
    where: { id: payload.hoaId },
    include: { staircases: true }
  });
  if (!hoa) {
    throw new AppError('Asociația selectată nu există', 404);
  }

  const staircase = hoa.staircases.find((s) => s.id === payload.staircaseId);
  if (!staircase) {
    throw new AppError('Scara selectată nu aparține acestei asociații', 400);
  }

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: payload.email,
        passwordHash,
        role: 'TENANT'
      }
    });

    await tx.tenant.create({
      data: {
        userId: createdUser.id,
        hoaId: payload.hoaId,
        staircaseId: payload.staircaseId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        phone: payload.phone,
        cnp: payload.cnp,
        addressText: hoa.buildingAddress,
        apartmentNumber: payload.apartmentNumber,
        isApproved: false
      }
    });

    return tx.user.findUnique({
      where: { id: createdUser.id },
      select: publicUserSelect
    });
  });

  return buildAuthResult(user);
};

// ── Register HOA ────────────────────────────────────────

export const registerHoa = async (payload) => {
  const passwordHash = await hashPassword(payload.password);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: payload.email,
        passwordHash,
        role: 'HOA'
      }
    });

    const hoa = await tx.hoa.create({
      data: {
        userId: createdUser.id,
        presidentName: payload.presidentName,
        adminName: payload.adminName,
        buildingAddress: payload.buildingAddress,
        documentsUrl: payload.documentsUrl
      }
    });

    // Bulk insert scări
    if (payload.staircases?.length) {
      await tx.staircase.createMany({
        data: payload.staircases.map((s) => ({
          hoaId: hoa.id,
          name: s.name,
          apartmentsCount: s.apartmentsCount
        }))
      });
    }

    return tx.user.findUnique({
      where: { id: createdUser.id },
      select: publicUserSelect
    });
  });

  return buildAuthResult(user);
};

// ── Register Firm ───────────────────────────────────────

export const registerFirm = async (payload) => {
  const passwordHash = await hashPassword(payload.password);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: payload.email,
        passwordHash,
        role: 'FIRM'
      }
    });

    const firm = await tx.firm.create({
      data: {
        userId: createdUser.id,
        companyName: payload.companyName,
        cui: payload.cui,
        caen: payload.caen,
        adminName: payload.adminName,
        phone: payload.phone,
        email: payload.contactEmail,
        hqAddress: payload.hqAddress,
        iban: payload.iban,
        bankName: payload.bankName,
        domains: payload.domains
      }
    });

    // Bulk insert portofolii
    if (payload.portfolios?.length) {
      await tx.portfolio.createMany({
        data: payload.portfolios.map((p) => ({
          firmId: firm.id,
          title: p.title,
          imageUrl: p.imageUrl
        }))
      });
    }

    return tx.user.findUnique({
      where: { id: createdUser.id },
      select: publicUserSelect
    });
  });

  return buildAuthResult(user);
};

// ── Login ───────────────────────────────────────────────

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      tenant: true,
      hoa: {
        include: {
          staircases: true
        }
      },
      firm: {
        include: {
          portfolios: true
        }
      }
    }
  });

  if (!user) {
    throw new AppError('Email sau parola invalida', 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError('Email sau parola invalida', 401);
  }

  const { passwordHash, ...safeUser } = user;

  return {
    token: signAccessToken({ sub: safeUser.id, role: safeUser.role }),
    user: safeUser
  };
};

// ── Current user ────────────────────────────────────────

export const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect
  });

  if (!user) {
    throw new AppError('Utilizatorul nu a fost gasit', 404);
  }

  return user;
};