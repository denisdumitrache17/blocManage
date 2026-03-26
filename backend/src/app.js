import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { corsOrigins } from './config/env.js';
import errorHandler from './middlewares/errorHandler.js';
import notFound from './middlewares/notFound.js';
import apiRouter from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes('*') || corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Originea CORS nu este permisa'));
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1', apiRouter);
app.use(notFound);
app.use(errorHandler);

export default app;