import asyncHandler from '../utils/asyncHandler.js';
import {
  assignFirmToRequest,
  createRequest,
  getEligibleFirms,
  getRequestById,
  hoaApproveRequest,
  hoaRejectRequest,
  listRequests,
  updateRequestStatus
} from '../services/request.service.js';

export const createRequestController = asyncHandler(async (req, res) => {
  const request = await createRequest(req.authUser, req.body);
  res.status(201).json({ request });
});

export const listRequestsController = asyncHandler(async (req, res) => {
  const requests = await listRequests(req.authUser);
  res.status(200).json({ requests });
});

export const getRequestController = asyncHandler(async (req, res) => {
  const request = await getRequestById(req.authUser, req.params.requestId);
  res.status(200).json({ request });
});

export const updateRequestStatusController = asyncHandler(async (req, res) => {
  const request = await updateRequestStatus(req.authUser, req.params.requestId, req.body.status);
  res.status(200).json({ request });
});

export const assignFirmController = asyncHandler(async (req, res) => {
  const request = await assignFirmToRequest(req.authUser, req.params.requestId, req.body.firmId);
  res.status(200).json({ request });
});

export const hoaApproveController = asyncHandler(async (req, res) => {
  const request = await hoaApproveRequest(req.authUser, req.params.requestId);
  res.status(200).json({ request });
});

export const hoaRejectController = asyncHandler(async (req, res) => {
  const request = await hoaRejectRequest(req.authUser, req.params.requestId);
  res.status(200).json({ request });
});

export const eligibleFirmsController = asyncHandler(async (req, res) => {
  const bypass = req.query.bypass === 'true';
  const firms = await getEligibleFirms(req.authUser, req.params.requestId, bypass);
  res.status(200).json({ firms });
});