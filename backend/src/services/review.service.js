import prisma from '../config/prisma.js';
import AppError from '../utils/appError.js';
import { publicFirmWithUserSelect, publicUserSelect } from '../utils/selects.js';

const reviewInclude = {
  request: {
    select: {
      id: true,
      requesterId: true,
      status: true,
      scope: true,
      category: true,
      description: true,
      firmId: true,
      createdAt: true,
      updatedAt: true
    }
  },
  reviewer: {
    select: publicUserSelect
  },
  firm: {
    select: publicFirmWithUserSelect
  }
};

const getRoleScopedReviewWhere = (user) => {
  if (user.role === 'PLATFORM_ADMIN') {
    return {};
  }

  if (user.role === 'FIRM') {
    return { firmId: user.firm?.id };
  }

  if (user.role === 'HOA') {
    return {
      OR: [
        { reviewerId: user.id },
        { reviewer: { tenant: { hoaId: user.hoa?.id } } }
      ]
    };
  }

  return { reviewerId: user.id };
};

export const createReview = async (user, payload) => {
  const request = await prisma.request.findUnique({
    where: { id: payload.requestId },
    include: {
      review: true
    }
  });

  if (!request) {
    throw new AppError('Cererea nu a fost gasita', 404);
  }

  if (request.requesterId !== user.id) {
    throw new AppError('Doar initiatorul cererii poate lasa un review', 403);
  }

  if (request.status !== 'COMPLETED') {
    throw new AppError('Review-ul poate fi adaugat doar pentru cereri finalizate', 400);
  }

  if (!request.firmId) {
    throw new AppError('Cererea trebuie sa fie asignata unei firme pentru a putea primi review', 400);
  }

  if (request.review) {
    throw new AppError('Exista deja un review pentru aceasta cerere', 409);
  }

  return prisma.review.create({
    data: {
      requestId: payload.requestId,
      reviewerId: user.id,
      firmId: request.firmId,
      rating: payload.rating,
      comment: payload.comment
    },
    include: reviewInclude
  });
};

export const listReviews = async (user) => prisma.review.findMany({
  where: getRoleScopedReviewWhere(user),
  include: reviewInclude,
  orderBy: { createdAt: 'desc' }
});