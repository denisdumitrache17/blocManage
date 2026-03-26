import prisma from '../config/prisma.js';
import AppError from '../utils/appError.js';
import {
  publicUserBaseSelect, publicTenantSelect, publicHoaSelect,
  publicFirmSelect, publicFirmWithUserSelect
} from '../utils/selects.js';
import { createContractFromRequest } from './contract.service.js';

const requestInclude = {
  requester: {
    select: {
      ...publicUserBaseSelect,
      tenant: {
        select: {
          ...publicTenantSelect,
          hoa: { select: publicHoaSelect }
        }
      },
      hoa: { select: publicHoaSelect },
      firm: { select: publicFirmSelect }
    }
  },
  firm: {
    select: publicFirmWithUserSelect
  },
  invoices: true,
  review: true
};

// ── Visibility scoping per role ─────────────────────────

const getRoleScopedRequestWhere = (user) => {
  if (user.role === 'PLATFORM_ADMIN') {
    return {}; // vede totul
  }

  if (user.role === 'TENANT') {
    return {
      OR: [
        { requesterId: user.id },
        {
          scope: 'BUILDING',
          requester: { tenant: { hoaId: user.tenant?.hoaId } }
        },
        {
          scope: 'BUILDING',
          requester: { hoa: { id: user.tenant?.hoaId } }
        }
      ]
    };
  }

  if (user.role === 'HOA') {
    return {
      OR: [
        { requesterId: user.id },
        {
          requester: { tenant: { hoaId: user.hoa?.id } },
          scope: 'BUILDING'
        }
      ]
    };
  }

  // FIRM — vede doar cererile asignate
  return { firmId: user.firm?.id };
};

const ensureVisibleRequest = async (user, requestId) => {
  const request = await prisma.request.findFirst({
    where: {
      id: requestId,
      ...getRoleScopedRequestWhere(user)
    },
    include: requestInclude
  });

  if (!request) {
    throw new AppError('Cererea nu a fost gasita sau nu poate fi accesata', 404);
  }

  return request;
};

// ── Create request ──────────────────────────────────────

export const createRequest = async (user, payload) => {
  if (user.role !== 'TENANT' && user.role !== 'HOA') {
    throw new AppError('Doar un locatar sau o asociatie poate crea cereri', 403);
  }

  if (user.role === 'TENANT' && !user.tenant?.isApproved) {
    throw new AppError('Tenant-ul trebuie aprobat de HOA inainte sa poata crea cereri', 403);
  }

  // Determine initial status based on scope
  // BUILDING → needs HOA approval first; PERSONAL → goes straight to PLATFORM_ADMIN
  const initialStatus = payload.scope === 'BUILDING'
    ? 'PENDING_HOA_APPROVAL'
    : 'PENDING';

  return prisma.request.create({
    data: {
      requesterId: user.id,
      category: payload.category,
      workType: payload.workType,
      description: payload.description,
      urgencyLevel: payload.urgencyLevel,
      scope: payload.scope,
      status: initialStatus
    },
    include: requestInclude
  });
};

// ── List requests ───────────────────────────────────────

export const listRequests = async (user) => prisma.request.findMany({
  where: getRoleScopedRequestWhere(user),
  include: requestInclude,
  orderBy: { createdAt: 'desc' }
});

export const getRequestById = async (user, requestId) => ensureVisibleRequest(user, requestId);

// ── HOA: approve / reject BUILDING requests ─────────────

export const hoaApproveRequest = async (user, requestId) => {
  if (user.role !== 'HOA') {
    throw new AppError('Doar HOA poate aproba cereri de tip BUILDING', 403);
  }

  const request = await ensureVisibleRequest(user, requestId);

  if (request.scope !== 'BUILDING' || request.status !== 'PENDING_HOA_APPROVAL') {
    throw new AppError('Aceasta cerere nu poate fi aprobata de HOA', 400);
  }

  return prisma.request.update({
    where: { id: requestId },
    data: { status: 'PENDING' },
    include: requestInclude
  });
};

export const hoaRejectRequest = async (user, requestId) => {
  if (user.role !== 'HOA') {
    throw new AppError('Doar HOA poate respinge cereri de tip BUILDING', 403);
  }

  const request = await ensureVisibleRequest(user, requestId);

  if (request.scope !== 'BUILDING' || request.status !== 'PENDING_HOA_APPROVAL') {
    throw new AppError('Aceasta cerere nu poate fi respinsa de HOA', 400);
  }

  return prisma.request.update({
    where: { id: requestId },
    data: { status: 'REJECTED' },
    include: requestInclude
  });
};

// ── Status transitions (PLATFORM_ADMIN + FIRM) ─────────

const ALLOWED_TRANSITIONS = {
  PENDING: 'VALIDATED',
  VALIDATED: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED'
};

export const updateRequestStatus = async (user, requestId, status) => {
  const request = await ensureVisibleRequest(user, requestId);

  if (user.role === 'TENANT' || user.role === 'HOA') {
    throw new AppError('Nu ai permisiunea de a modifica statusul unei cereri', 403);
  }

  if (user.role === 'FIRM' && request.firmId !== user.firm?.id) {
    throw new AppError('Firma nu poate modifica o cerere care nu ii este asignata', 403);
  }

  const expectedNext = ALLOWED_TRANSITIONS[request.status];

  if (!expectedNext || expectedNext !== status) {
    throw new AppError(
      `Tranzitie invalida: ${request.status} -> ${status}. Urmatorul status permis este ${expectedNext ?? 'niciunul (cererea este finalizata)'}`,
      400
    );
  }

  return prisma.request.update({
    where: { id: requestId },
    data: { status },
    include: requestInclude
  });
};

// ── Assign firm (PLATFORM_ADMIN only) ───────────────────

export const assignFirmToRequest = async (user, requestId, firmId) => {
  if (user.role !== 'PLATFORM_ADMIN') {
    throw new AppError('Doar un PLATFORM_ADMIN poate asigna o firma unei cereri', 403);
  }

  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: requestInclude
  });

  if (!request) {
    throw new AppError('Cererea nu a fost gasita', 404);
  }

  if (request.status !== 'PENDING' && request.status !== 'VALIDATED') {
    throw new AppError('Firma poate fi asignata doar la cereri cu status PENDING sau VALIDATED', 400);
  }

  const firm = await prisma.firm.findUnique({ where: { id: firmId } });

  if (!firm) {
    throw new AppError('Firma selectata nu exista', 404);
  }

  const updatedRequest = await prisma.request.update({
    where: { id: requestId },
    data: { firmId },
    include: requestInclude
  });

  // Creare automată contract la asignarea firmei
  const existingContract = await prisma.contract.findUnique({ where: { requestId } });
  if (!existingContract) {
    await createContractFromRequest(updatedRequest);
  }

  return updatedRequest;
};