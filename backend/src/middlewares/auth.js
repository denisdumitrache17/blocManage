import prisma from '../config/prisma.js';
import env from '../config/env.js';
import AppError from '../utils/appError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/jwt.js';

const resolveToken = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return req.cookies?.[env.AUTH_COOKIE_NAME] ?? null;
};

export const protect = asyncHandler(async (req, _res, next) => {
  const token = resolveToken(req);

  if (!token) {
    throw new AppError('Autentificare necesara', 401);
  }

  let payload;

  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AppError('Token invalid sau expirat', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: {
      tenant: true,
      hoa: true,
      firm: true
    }
  });

  if (!user) {
    throw new AppError('Utilizatorul asociat token-ului nu mai exista', 401);
  }

  req.authUser = user;
  next();
});

export const authorizeRoles = (...roles) => (req, _res, next) => {
  if (!req.authUser) {
    return next(new AppError('Autentificare necesara', 401));
  }

  if (!roles.includes(req.authUser.role)) {
    return next(new AppError('Nu ai permisiunea necesara pentru aceasta actiune', 403));
  }

  return next();
};