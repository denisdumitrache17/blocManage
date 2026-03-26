/**
 * Helpers de test: funcții reutilizabile pentru înregistrare, login,
 * cleanup DB și crearea de entități de test.
 *
 * IMPORTANT: Aceste teste presupun o bază de date de test dedicată
 * configurată prin DATABASE_URL din .env (sau .env.test).
 * NU rulați pe producție.
 */
import { jest } from '@jest/globals';
import request from 'supertest';

import app from '../src/app.js';
import prisma from '../src/config/prisma.js';

// ── Cleanup DB ──────────────────────────────────────────
// Ordinea contează din cauza foreign key constraints
const CLEANUP_ORDER = [
  'review',
  'invoice',
  'contract',
  'portfolio',
  'request',
  'staircase',
  'tenant',
  'hoa',
  'firm',
  'user'
];

export const cleanDatabase = async () => {
  for (const model of CLEANUP_ORDER) {
    await prisma[model].deleteMany();
  }
};

// ── Factory: Register + Login helpers ───────────────────

let counter = 0;
const uniqueEmail = () => `test${++counter}_${Date.now()}@test.com`;

export const registerTenant = async (overrides = {}) => {
  const body = {
    email: uniqueEmail(),
    password: 'Test1234!',
    firstName: 'Ion',
    lastName: 'Popescu',
    phone: '0712345678',
    cnp: '1234567890123',
    addressText: overrides.addressText ?? 'Strada Florilor 10',
    apartmentNumber: '4A',
    ...overrides
  };

  const res = await request(app)
    .post('/api/v1/auth/register/tenant')
    .send(body);

  return { res, body };
};

export const registerHoa = async (overrides = {}) => {
  const body = {
    email: uniqueEmail(),
    password: 'Test1234!',
    presidentName: 'Vasile Marin',
    adminName: 'Maria Admin',
    buildingAddress: overrides.buildingAddress ?? 'Strada Florilor 10',
    staircases: [
      { name: 'Scara A', apartmentsCount: 20 },
      { name: 'Scara B', apartmentsCount: 15 }
    ],
    documentsUrl: null,
    ...overrides
  };

  const res = await request(app)
    .post('/api/v1/auth/register/hoa')
    .send(body);

  return { res, body };
};

export const registerFirm = async (overrides = {}) => {
  const body = {
    email: uniqueEmail(),
    password: 'Test1234!',
    companyName: 'Firma Test SRL',
    cui: `RO${Date.now()}`,
    caen: '4322',
    adminName: 'Admin Firma',
    phone: '0723456789',
    contactEmail: uniqueEmail(),
    hqAddress: 'Bd. Unirii 5',
    iban: 'RO49AAAA1B31007593840000',
    bankName: 'Banca Test',
    portfolios: [
      { title: 'Lucrare 1', imageUrl: 'https://example.com/img1.jpg' }
    ],
    ...overrides
  };

  const res = await request(app)
    .post('/api/v1/auth/register/firm')
    .send(body);

  return { res, body };
};

export const loginAs = async (email, password = 'Test1234!') => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });

  return res.body.token;
};

// ── Helpers: create entities with relationships ─────────

export const approveTenant = async (tenantId) => {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { isApproved: true }
  });
};

export const createTestRequest = async (token, overrides = {}) => {
  const body = {
    category: 'Instalatii',
    description: 'Teava sparta la baie, necesita interventie urgenta',
    urgencyLevel: 'MEDIUM',
    ...overrides
  };

  return request(app)
    .post('/api/v1/requests')
    .set('Authorization', `Bearer ${token}`)
    .send(body);
};

export { app, prisma, request };
