import prisma from '../config/prisma.js';
import AppError from '../utils/appError.js';
import { publicFirmWithUserSelect, publicUserSelect } from '../utils/selects.js';

const contractInclude = {
  request: {
    select: {
      id: true,
      category: true,
      description: true,
      scope: true,
      status: true,
      urgencyLevel: true,
      requesterId: true,
      firmId: true
    }
  },
  firm: {
    select: publicFirmWithUserSelect
  },
  client: {
    select: publicUserSelect
  }
};

const getRoleScopedContractWhere = (user) => {
  if (user.role === 'PLATFORM_ADMIN') {
    return {}; // vede totul
  }

  if (user.role === 'TENANT') {
    return { clientId: user.id };
  }

  if (user.role === 'HOA') {
    return {
      OR: [
        { clientId: user.id },
        { client: { tenant: { hoaId: user.hoa?.id } } }
      ]
    };
  }

  // FIRM
  return { firmId: user.firm?.id };
};

const ensureVisibleContract = async (user, contractId) => {
  const contract = await prisma.contract.findFirst({
    where: {
      id: contractId,
      ...getRoleScopedContractWhere(user)
    },
    include: contractInclude
  });

  if (!contract) {
    throw new AppError('Contractul nu a fost gasit sau nu poate fi accesat', 404);
  }

  return contract;
};

// Creat automat la asignarea firmei pe o cerere
export const createContractFromRequest = async (request) => {
  return prisma.contract.create({
    data: {
      requestId: request.id,
      firmId: request.firmId,
      clientId: request.requesterId,
      status: 'AWAITING_FIRM_DRAFT'
    },
    include: contractInclude
  });
};

export const listContracts = async (user) => prisma.contract.findMany({
  where: getRoleScopedContractWhere(user),
  include: contractInclude,
  orderBy: { createdAt: 'desc' }
});

export const getContractById = async (user, contractId) => ensureVisibleContract(user, contractId);

// Firma încarcă draft-ul PDF
export const uploadDraft = async (user, contractId, pdfPath) => {
  const contract = await ensureVisibleContract(user, contractId);

  if (user.role !== 'FIRM' && user.role !== 'PLATFORM_ADMIN') {
    throw new AppError('Doar firma asignata poate incarca draft-ul contractului', 403);
  }

  if (user.role === 'FIRM' && contract.firmId !== user.firm?.id) {
    throw new AppError('Nu esti firma asignata acestui contract', 403);
  }

  if (contract.status !== 'AWAITING_FIRM_DRAFT') {
    throw new AppError('Draft-ul poate fi incarcat doar cand contractul asteapta draft-ul firmei', 400);
  }

  return prisma.contract.update({
    where: { id: contractId },
    data: {
      draftPdfUrl: pdfPath,
      status: 'AWAITING_CLIENT_SIGNATURE'
    },
    include: contractInclude
  });
};

// Clientul încarcă contractul semnat
export const uploadSigned = async (user, contractId, pdfPath) => {
  const contract = await ensureVisibleContract(user, contractId);

  if (user.role !== 'PLATFORM_ADMIN') {
    // Doar clientul asignat
    if (contract.clientId !== user.id) {
      throw new AppError('Doar clientul asignat poate incarca contractul semnat', 403);
    }
  }

  if (contract.status !== 'AWAITING_CLIENT_SIGNATURE') {
    throw new AppError('Contractul semnat poate fi incarcat doar cand se asteapta semnatura clientului', 400);
  }

  return prisma.contract.update({
    where: { id: contractId },
    data: {
      signedPdfUrl: pdfPath,
      status: 'SIGNED_AND_ACTIVE'
    },
    include: contractInclude
  });
};