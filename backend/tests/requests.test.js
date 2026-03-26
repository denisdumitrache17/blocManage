/**
 * Teste de integrare: Cereri, Facturi și Recenzii
 *
 * Scenarii testate:
 *  - State machine pe cereri (tranzitii valide/invalide)
 *  - Firma nu poate crea cereri
 *  - Facturi: doar firma asignată poate emite
 *  - Factura creată cu status UNPAID forțat
 *  - Recenzie doar pe cerere COMPLETED
 *  - Recenzie duplicată respinsă
 *  - Recenzie de la alt utilizator respinsă
 */
import { describe, it, expect, afterAll, beforeEach } from '@jest/globals';

import {
  app,
  prisma,
  request,
  cleanDatabase,
  registerTenant,
  registerHoa,
  registerFirm,
  loginAs,
  approveTenant,
  createTestRequest
} from './helpers.js';

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});

// ── Helper: setup complet (HOA + tenant aprobat + firmă + cerere asignată) ──

const setupFullFlow = async () => {
  // 1. Creăm HOA
  const { res: hoaRes, body: hoaBody } = await registerHoa({ buildingAddress: 'Bd. Victoriei 1' });
  const hoaToken = hoaRes.body.token;
  const hoaUser = hoaRes.body.user;

  // 2. Creăm tenant cu match pe HOA
  const { res: tenantRes, body: tenantBody } = await registerTenant({ addressText: 'Bd. Victoriei 1' });
  const tenantUser = tenantRes.body.user;

  // 3. Aprobăm tenant-ul
  await approveTenant(tenantUser.profile.id);
  const tenantToken = await loginAs(tenantBody.email);

  // 4. Creăm firmă
  const { res: firmRes, body: firmBody } = await registerFirm();
  const firmToken = firmRes.body.token;
  const firmUser = firmRes.body.user;

  // 5. Tenant creează o cerere
  const reqRes = await createTestRequest(tenantToken);
  const testRequest = reqRes.body.request;

  // 6. HOA asignează firma
  await request(app)
    .patch(`/api/v1/requests/${testRequest.id}/assign-firm`)
    .set('Authorization', `Bearer ${hoaToken}`)
    .send({ firmId: firmUser.profile.id });

  return {
    hoaToken, hoaUser, hoaBody,
    tenantToken, tenantUser, tenantBody,
    firmToken, firmUser, firmBody,
    testRequest
  };
};

// ═════════════════════════════════════════════════════════
// ── Request State Machine ───────────────────────────────
// ═════════════════════════════════════════════════════════

describe('PATCH /api/v1/requests/:id/status — State Machine', () => {
  it('permite tranziții valide: PENDING -> VALIDATED -> IN_PROGRESS -> COMPLETED', async () => {
    const { hoaToken, firmToken, testRequest } = await setupFullFlow();

    // PENDING -> VALIDATED (HOA validează)
    let res = await request(app)
      .patch(`/api/v1/requests/${testRequest.id}/status`)
      .set('Authorization', `Bearer ${hoaToken}`)
      .send({ status: 'VALIDATED' });
    expect(res.status).toBe(200);
    expect(res.body.request.status).toBe('VALIDATED');

    // VALIDATED -> IN_PROGRESS (firma preia)
    res = await request(app)
      .patch(`/api/v1/requests/${testRequest.id}/status`)
      .set('Authorization', `Bearer ${firmToken}`)
      .send({ status: 'IN_PROGRESS' });
    expect(res.status).toBe(200);
    expect(res.body.request.status).toBe('IN_PROGRESS');

    // IN_PROGRESS -> COMPLETED (firma finalizează)
    res = await request(app)
      .patch(`/api/v1/requests/${testRequest.id}/status`)
      .set('Authorization', `Bearer ${firmToken}`)
      .send({ status: 'COMPLETED' });
    expect(res.status).toBe(200);
    expect(res.body.request.status).toBe('COMPLETED');
  });

  it('respinge tranziții invalide (PENDING -> COMPLETED)', async () => {
    const { hoaToken, testRequest } = await setupFullFlow();

    const res = await request(app)
      .patch(`/api/v1/requests/${testRequest.id}/status`)
      .set('Authorization', `Bearer ${hoaToken}`)
      .send({ status: 'COMPLETED' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/tranzitie invalida/i);
  });

  it('respinge tranziții inverse (VALIDATED -> PENDING)', async () => {
    const { hoaToken, testRequest } = await setupFullFlow();

    // Mai întâi avansăm la VALIDATED
    await request(app)
      .patch(`/api/v1/requests/${testRequest.id}/status`)
      .set('Authorization', `Bearer ${hoaToken}`)
      .send({ status: 'VALIDATED' });

    // Încercăm revenire la PENDING
    const res = await request(app)
      .patch(`/api/v1/requests/${testRequest.id}/status`)
      .set('Authorization', `Bearer ${hoaToken}`)
      .send({ status: 'PENDING' });

    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════════════════
// ── Requests — Role Restriction ─────────────────────────
// ═════════════════════════════════════════════════════════

describe('POST /api/v1/requests — Role Restriction', () => {
  it('FIRM nu poate crea cereri (403)', async () => {
    const { firmToken } = await setupFullFlow();

    const res = await createTestRequest(firmToken);
    expect(res.status).toBe(403);
  });
});

// ═════════════════════════════════════════════════════════
// ── Invoices ────────────────────────────────────────────
// ═════════════════════════════════════════════════════════

describe('POST /api/v1/invoices — Protecție Facturi', () => {
  const completeRequest = async (setup) => {
    const { hoaToken, firmToken, testRequest } = setup;
    await request(app)
      .patch(`/api/v1/requests/${testRequest.id}/status`)
      .set('Authorization', `Bearer ${hoaToken}`)
      .send({ status: 'VALIDATED' });
    await request(app)
      .patch(`/api/v1/requests/${testRequest.id}/status`)
      .set('Authorization', `Bearer ${firmToken}`)
      .send({ status: 'IN_PROGRESS' });
    await request(app)
      .patch(`/api/v1/requests/${testRequest.id}/status`)
      .set('Authorization', `Bearer ${firmToken}`)
      .send({ status: 'COMPLETED' });
  };

  it('firma asignată poate emite factură', async () => {
    const setup = await setupFullFlow();
    await completeRequest(setup);

    const res = await request(app)
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${setup.firmToken}`)
      .send({
        requestId: setup.testRequest.id,
        amount: 1500.50
      });

    expect(res.status).toBe(201);
    expect(res.body.invoice.status).toBe('UNPAID');
  });

  it('altă firmă NU poate emite factură pentru cererea altei firme (403)', async () => {
    const setup = await setupFullFlow();
    await completeRequest(setup);

    // Creăm o a doua firmă
    const { res: firm2Res } = await registerFirm({
      cui: `RO${Date.now() + 1}`,
      companyName: 'Alta Firma SRL'
    });
    const firm2Token = firm2Res.body.token;

    const res = await request(app)
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${firm2Token}`)
      .send({
        requestId: setup.testRequest.id,
        amount: 999
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/asignate firmei/i);
  });

  it('statusul facturii este forțat pe UNPAID la creare', async () => {
    const setup = await setupFullFlow();
    await completeRequest(setup);

    const res = await request(app)
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${setup.firmToken}`)
      .send({
        requestId: setup.testRequest.id,
        amount: 500,
        status: 'PAID' // Încercare de injectare
      });

    expect(res.status).toBe(201);
    expect(res.body.invoice.status).toBe('UNPAID');
  });

  it('clientul poate marca factura ca PAID', async () => {
    const setup = await setupFullFlow();
    await completeRequest(setup);

    // Firma creează factura
    const invoiceRes = await request(app)
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${setup.firmToken}`)
      .send({
        requestId: setup.testRequest.id,
        amount: 1200
      });

    // Tenant-ul o plătește
    const res = await request(app)
      .patch(`/api/v1/invoices/${invoiceRes.body.invoice.id}/status`)
      .set('Authorization', `Bearer ${setup.tenantToken}`)
      .send({ status: 'PAID' });

    expect(res.status).toBe(200);
    expect(res.body.invoice.status).toBe('PAID');
  });
});

// ═════════════════════════════════════════════════════════
// ── Reviews ─────────────────────────────────────────────
// ═════════════════════════════════════════════════════════

describe('POST /api/v1/reviews — Validare Recenzii', () => {
  it('recenzie respinsă dacă cererea NU este COMPLETED (400)', async () => {
    const setup = await setupFullFlow();

    // Cererea este încă PENDING — nu facem tranziții
    const res = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${setup.tenantToken}`)
      .send({
        requestId: setup.testRequest.id,
        rating: 5,
        comment: 'Excelent'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/finalizate/i);
  });

  it('recenzie respinsă dacă cererea este IN_PROGRESS (400)', async () => {
    const setup = await setupFullFlow();

    // Avansăm la IN_PROGRESS
    await request(app)
      .patch(`/api/v1/requests/${setup.testRequest.id}/status`)
      .set('Authorization', `Bearer ${setup.hoaToken}`)
      .send({ status: 'VALIDATED' });
    await request(app)
      .patch(`/api/v1/requests/${setup.testRequest.id}/status`)
      .set('Authorization', `Bearer ${setup.firmToken}`)
      .send({ status: 'IN_PROGRESS' });

    const res = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${setup.tenantToken}`)
      .send({
        requestId: setup.testRequest.id,
        rating: 4
      });

    expect(res.status).toBe(400);
  });

  it('recenzie acceptată pentru cerere COMPLETED', async () => {
    const setup = await setupFullFlow();

    // Trecem prin tot ciclul
    await request(app)
      .patch(`/api/v1/requests/${setup.testRequest.id}/status`)
      .set('Authorization', `Bearer ${setup.hoaToken}`)
      .send({ status: 'VALIDATED' });
    await request(app)
      .patch(`/api/v1/requests/${setup.testRequest.id}/status`)
      .set('Authorization', `Bearer ${setup.firmToken}`)
      .send({ status: 'IN_PROGRESS' });
    await request(app)
      .patch(`/api/v1/requests/${setup.testRequest.id}/status`)
      .set('Authorization', `Bearer ${setup.firmToken}`)
      .send({ status: 'COMPLETED' });

    const res = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${setup.tenantToken}`)
      .send({
        requestId: setup.testRequest.id,
        rating: 5,
        comment: 'Lucrare excelenta!'
      });

    expect(res.status).toBe(201);
    expect(res.body.review.rating).toBe(5);
  });

  it('recenzie duplicată respinsă (409)', async () => {
    const setup = await setupFullFlow();

    // Complete
    await request(app)
      .patch(`/api/v1/requests/${setup.testRequest.id}/status`)
      .set('Authorization', `Bearer ${setup.hoaToken}`)
      .send({ status: 'VALIDATED' });
    await request(app)
      .patch(`/api/v1/requests/${setup.testRequest.id}/status`)
      .set('Authorization', `Bearer ${setup.firmToken}`)
      .send({ status: 'IN_PROGRESS' });
    await request(app)
      .patch(`/api/v1/requests/${setup.testRequest.id}/status`)
      .set('Authorization', `Bearer ${setup.firmToken}`)
      .send({ status: 'COMPLETED' });

    // Primul review
    const res1 = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${setup.tenantToken}`)
      .send({ requestId: setup.testRequest.id, rating: 4 });
    expect(res1.status).toBe(201);

    // Al doilea review pe aceeași cerere — respins
    const res2 = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${setup.tenantToken}`)
      .send({ requestId: setup.testRequest.id, rating: 2, comment: 'Alt review' });

    expect(res2.status).toBe(409);
    expect(res2.body.message).toMatch(/deja/i);
  });

  it('alt utilizator nu poate lăsa review pe cererea altcuiva (403)', async () => {
    const setup = await setupFullFlow();

    // Complete
    await request(app)
      .patch(`/api/v1/requests/${setup.testRequest.id}/status`)
      .set('Authorization', `Bearer ${setup.hoaToken}`)
      .send({ status: 'VALIDATED' });
    await request(app)
      .patch(`/api/v1/requests/${setup.testRequest.id}/status`)
      .set('Authorization', `Bearer ${setup.firmToken}`)
      .send({ status: 'IN_PROGRESS' });
    await request(app)
      .patch(`/api/v1/requests/${setup.testRequest.id}/status`)
      .set('Authorization', `Bearer ${setup.firmToken}`)
      .send({ status: 'COMPLETED' });

    // HOA încearcă review — dar cererea e a tenant-ului
    const res = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${setup.hoaToken}`)
      .send({ requestId: setup.testRequest.id, rating: 3 });

    expect(res.status).toBe(403);
  });
});
