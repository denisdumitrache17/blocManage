import asyncHandler from '../utils/asyncHandler.js';
import { createReview, listReviews } from '../services/review.service.js';

export const createReviewController = asyncHandler(async (req, res) => {
  const review = await createReview(req.authUser, req.body);
  res.status(201).json({ review });
});

export const listReviewsController = asyncHandler(async (req, res) => {
  const reviews = await listReviews(req.authUser);
  res.status(200).json({ reviews });
});