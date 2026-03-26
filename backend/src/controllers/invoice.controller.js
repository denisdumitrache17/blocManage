import asyncHandler from '../utils/asyncHandler.js';
import { createInvoice, listInvoices, updateInvoiceStatus, uploadInvoicePdf } from '../services/invoice.service.js';
import AppError from '../utils/appError.js';

export const createInvoiceController = asyncHandler(async (req, res) => {
  const invoice = await createInvoice(req.authUser, req.body);
  res.status(201).json({ invoice });
});

export const listInvoicesController = asyncHandler(async (req, res) => {
  const invoices = await listInvoices(req.authUser);
  res.status(200).json({ invoices });
});

export const updateInvoiceStatusController = asyncHandler(async (req, res) => {
  const invoice = await updateInvoiceStatus(req.authUser, req.params.invoiceId, req.body.status);
  res.status(200).json({ invoice });
});

export const uploadInvoicePdfController = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Fișierul PDF este obligatoriu', 400);
  const invoice = await uploadInvoicePdf(req.authUser, req.params.invoiceId, req.file.filename);
  res.status(200).json({ invoice });
});