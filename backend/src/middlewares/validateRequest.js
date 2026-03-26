import { ZodError } from 'zod';

const buildValidationMiddleware = (schema, target) => (req, _res, next) => {
  try {
    req[target] = schema.parse(req[target]);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      error.statusCode = 400;
    }
    next(error);
  }
};

export const validateBody = (schema) => buildValidationMiddleware(schema, 'body');
export const validateParams = (schema) => buildValidationMiddleware(schema, 'params');
export const validateQuery = (schema) => buildValidationMiddleware(schema, 'query');