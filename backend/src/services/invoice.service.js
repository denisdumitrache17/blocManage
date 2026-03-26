import prisma from '../config/prisma.js';
import AppError from '../utils/appError.js';
import { publicFirmWithUserSelect, publicUserSelect } from '../utils/selects.js';

const invoiceInclude = {
  request: {
    select: {
      id: true,
      requesterId: true,
      firmId: true,
      category: true,
      description: true,
      urgencyLevel: true,
      scope: true,
      status: true,
      createdAt: true,
      updatedAt: true
    }
  },
  firm: {
    select: publicFirmWithUserSelect
  },
  client: {
    select: publicUserSelect
  }
};

const getRoleScopedInvoiceWhere = (user) => {
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

  return { firmId: user.firm?.id };
};

const ensureVisibleInvoice = async (user, invoiceId) => {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      ...getRoleScopedInvoiceWhere(user)
    },
    include: invoiceInclude
  });

  if (!invoice) {
    throw new AppError('Factura nu a fost gasita sau nu poate fi accesata', 404);
  }

  return invoice;
};

export const createInvoice = async (user, payload) => {
  if (user.role !== 'PLATFORM_ADMIN') {
    throw new AppError('Doar un PLATFORM_ADMIN poate emite facturi', 403);
  }

  const request = await prisma.request.findUnique({
    where: { id: payload.requestId },
    include: { firm: true }
  });

  if (!request) {
    throw new AppError('Cererea asociata facturii nu exista', 404);
  }

  if (!request.firmId) {
    throw new AppError('Cererea trebuie sa aiba o firma asignata pentru a emite factura', 400);
  }

  return prisma.invoice.create({
    data: {
      requestId: request.id,
      firmId: request.firmId,
      clientId: request.requesterId,
      amount: payload.amount,
      pdfUrl: payload.pdfUrl,
      status: 'UNPAID'
    },
    include: invoiceInclude
  });
};

export const listInvoices = async (user) => prisma.invoice.findMany({
  where: getRoleScopedInvoiceWhere(user),
  include: invoiceInclude,
  orderBy: { createdAt: 'desc' }
});

export const updateInvoiceStatus = async (user, invoiceId, status) => {
  if (user.role !== 'PLATFORM_ADMIN') {
    throw new AppError('Doar un PLATFORM_ADMIN poate modifica statusul facturilor', 403);
  }

  await ensureVisibleInvoice(user, invoiceId);

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status },
    include: invoiceInclude
  });
};

export const uploadInvoicePdf = async (user, invoiceId, pdfPath) => {
  if (user.role !== 'PLATFORM_ADMIN') {
    throw new AppError('Doar un PLATFORM_ADMIN poate încărca facturi PDF', 403);
  }

  await ensureVisibleInvoice(user, invoiceId);

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { pdfUrl: `/uploads/invoices/${pdfPath}` },
    include: invoiceInclude
  });
};