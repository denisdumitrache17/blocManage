import asyncHandler from '../utils/asyncHandler.js';
import { listContracts, getContractById, uploadDraft, uploadSigned } from '../services/contract.service.js';

export const listContractsController = asyncHandler(async (req, res) => {
  const contracts = await listContracts(req.authUser);
  res.status(200).json({ contracts });
});

export const getContractController = asyncHandler(async (req, res) => {
  const contract = await getContractById(req.authUser, req.params.contractId);
  res.status(200).json({ contract });
});

export const uploadDraftController = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Fisierul PDF este obligatoriu' });
  }
  const pdfPath = `/uploads/contracts/${req.file.filename}`;
  const contract = await uploadDraft(req.authUser, req.params.contractId, pdfPath);
  res.status(200).json({ contract });
});

export const uploadSignedController = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Fisierul PDF semnat este obligatoriu' });
  }
  const pdfPath = `/uploads/contracts/${req.file.filename}`;
  const contract = await uploadSigned(req.authUser, req.params.contractId, pdfPath);
  res.status(200).json({ contract });
});