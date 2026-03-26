import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const projectRootEnvPath = path.resolve(currentDirPath, '..', '..', '..', '.env');
const backendEnvPath = path.resolve(currentDirPath, '..', '..', '.env');

dotenv.config({ path: projectRootEnvPath });
dotenv.config({ path: backendEnvPath, override: false });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL este obligatoriu'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET trebuie sa aiba cel putin 32 de caractere'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  AUTH_COOKIE_NAME: z.string().default('blocmanage_token'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  CORS_ORIGIN: z.string().default('http://localhost:3000')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Configuratia de mediu este invalida:', parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsedEnv.data;

export const isProduction = env.NODE_ENV === 'production';
export const corsOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);

export default env;