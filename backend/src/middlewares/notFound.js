import AppError from '../utils/appError.js';

const notFound = (req, _res, next) => {
  next(new AppError(`Ruta ${req.method} ${req.originalUrl} nu exista`, 404));
};

export default notFound;