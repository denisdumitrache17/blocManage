import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

import env from '../config/env.js';

const formatZodError = (error) => error.issues.map((issue) => ({
  path: issue.path.join('.'),
  message: issue.message
}));

const errorHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Datele trimise sunt invalide',
      errors: formatZodError(error)
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'Exista deja o inregistrare cu aceste date',
        meta: error.meta
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        message: 'Resursa ceruta nu a fost gasita'
      });
    }
  }

  const statusCode = error.statusCode ?? 500;

  return res.status(statusCode).json({
    message: error.message ?? 'A aparut o eroare interna',
    details: error.details,
    ...(env.NODE_ENV !== 'production' ? { stack: error.stack } : {})
  });
};

export default errorHandler;