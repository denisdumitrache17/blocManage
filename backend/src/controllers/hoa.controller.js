import asyncHandler from '../utils/asyncHandler.js';
import { createStaircase, listHoaTenants, listPublicHoas, listStaircases, rejectTenant, updateTenantApproval } from '../services/hoa.service.js';

export const listPublicHoasController = asyncHandler(async (_req, res) => {
  const hoas = await listPublicHoas();
  res.status(200).json({ hoas });
});

export const createStaircaseController = asyncHandler(async (req, res) => {
  const staircase = await createStaircase(req.authUser, req.body);
  res.status(201).json({ staircase });
});

export const listStaircasesController = asyncHandler(async (req, res) => {
  const staircases = await listStaircases(req.authUser);
  res.status(200).json({ staircases });
});

export const listHoaTenantsController = asyncHandler(async (req, res) => {
  const tenants = await listHoaTenants(req.authUser);
  res.status(200).json({ tenants });
});

export const updateTenantApprovalController = asyncHandler(async (req, res) => {
  const tenant = await updateTenantApproval(req.authUser, req.params.tenantId, req.body);
  res.status(200).json({ tenant });
});

export const rejectTenantController = asyncHandler(async (req, res) => {
  await rejectTenant(req.authUser, req.params.tenantId);
  res.status(200).json({ message: 'Locatar respins și cont șters.' });
});