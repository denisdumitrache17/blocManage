/**
 * Teste de integrare: Modulul de Autentificare
 *
 * Scenarii testate:
 *  - Înregistrare tenant cu adresă care SĂ matchuiască un HOA
 *  - Înregistrare tenant cu adresă fără HOA (hoaId = null)
 *  - isApproved mereu false la înregistrare
 *  - Tenant neaprobat nu poate crea cereri
 *  - Înregistrare HOA cu bulk insert scări
 *  - Înregistrare firmă cu bulk insert portofolii
 *  - Login valid și invalid
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

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

// ═════════════════════════════════════════════════════════
// ── Register Tenant ─────────────────────────────────────
// ═════════════════════════════════════════════════════════

describe('POST /api/v1/auth/register/tenant', () => {
  it('creează tenant cu hoaId populat când adresa matchuiește un HOA existent', async () => {
    // 1. Creăm mai întâi un HOA cu această adresă
    const { res: hoaRes } = await registerHoa({ buildingAddress: 'Strada Lalelelor 22' });
    expect(hoaRes.status).toBe(201);

    // 2. Înregistrăm un tenant cu aceeași adresă
    const { res } = await registerTenant({ addressText: 'Strada Lalelelor 22' });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/aprobarea asociatiei/i);
    expect(res.body.user.profile).toBeDefined();
    expect(res.body.user.profile.hoaId).not.toBeNull();
    expect(res.body.user.profile.isApproved).toBe(false);
  });

  it('creează tenant cu hoaId = null când adresa NU matchuiește niciun HOA', async () => {
    const { res } = await registerTenant({ addressText: 'Adresa Inexistenta 999' });

    expect(res.status).toBe(201);
    expect(res.body.user.profile.hoaId).toBeNull();
    expect(res.body.user.profile.isApproved).toBe(false);
  });

  it('isApproved este MEREU false indiferent de ce trimite clientul', async () => {
    // Încercăm să injectăm isApproved: true — nu ar trebui să ajungă în DB
    const { res } = await registerTenant({ isApproved: true });

    expect(res.status).toBe(201);
    expect(res.body.user.profile.isApproved).toBe(false);
  });

  it('auto-match HOA funcționează case-insensitive', async () => {
    await registerHoa({ buildingAddress: 'Strada Florilor 10' });
    const { res } = await registerTenant({ addressText: 'strada florilor 10' });

    expect(res.status).toBe(201);
    expect(res.body.user.profile.hoaId).not.toBeNull();
  });

  it('returnează eroare 400 dacă lipsesc câmpuri obligatorii', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/tenant')
      .send({ email: 'bad@test.com', password: 'Test1234!' });

    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════════════════
// ── Register HOA ────────────────────────────────────────
// ═════════════════════════════════════════════════════════

describe('POST /api/v1/auth/register/hoa', () => {
  it('creează HOA cu scări (bulk insert)', async () => {
    const { res } = await registerHoa({
      staircases: [
        { name: 'Scara A', apartmentsCount: 10 },
        { name: 'Scara B', apartmentsCount: 8 },
        { name: 'Scara C', apartmentsCount: 12 }
      ]
    });

    expect(res.status).toBe(201);

    // Verificăm că scările au fost inserate
    const staircases = await prisma.staircase.findMany({
      where: { hoa: { user: { email: res.body.user.email } } }
    });

    expect(staircases).toHaveLength(3);
  });

  it('returnează eroare dacă array-ul de scări este gol', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/hoa')
      .send({
        email: 'hoa@test.com',
        password: 'Test1234!',
        presidentName: 'Test',
        adminName: 'Test',
        buildingAddress: 'Adresa Test',
        staircases: []
      });

    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════════════════
// ── Register Firm ───────────────────────────────────────
// ═════════════════════════════════════════════════════════

describe('POST /api/v1/auth/register/firm', () => {
  it('creează firmă cu portofolii (bulk insert)', async () => {
    const { res } = await registerFirm({
      portfolios: [
        { title: 'Proiect 1', imageUrl: 'https://example.com/1.jpg' },
        { title: 'Proiect 2', imageUrl: 'https://example.com/2.jpg' }
      ]
    });

    expect(res.status).toBe(201);

    const portfolios = await prisma.portfolio.findMany({
      where: { firm: { user: { email: res.body.user.email } } }
    });

    expect(portfolios).toHaveLength(2);
  });
});

// ═════════════════════════════════════════════════════════
// ── Login ───────────────────────────────────────────────
// ═════════════════════════════════════════════════════════

describe('POST /api/v1/auth/login', () => {
  it('returnează token JWT pentru credențiale valide', async () => {
    const { body: regBody } = await registerTenant();
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: regBody.email, password: regBody.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
  });

  it('returnează 401 pentru parolă greșită', async () => {
    const { body: regBody } = await registerTenant();
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: regBody.email, password: 'ParolaGresita!' });

    expect(res.status).toBe(401);
  });

  it('returnează 401 pentru email inexistent', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nimeni@nowhere.com', password: 'Test1234!' });

    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════
// ── Tenant Neaprobat — Restricții ───────────────────────
// ═════════════════════════════════════════════════════════

describe('Tenant neaprobat — restricții', () => {
  it('tenant neaprobat NU poate crea cereri (403)', async () => {
    const { res: regRes, body: regBody } = await registerTenant();
    expect(regRes.status).toBe(201);

    const token = await loginAs(regBody.email);
    const reqRes = await createTestRequest(token);

    expect(reqRes.status).toBe(403);
    expect(reqRes.body.message).toMatch(/aprobat/i);
  });

  it('tenant aprobat POATE crea cereri', async () => {
    const { res: regRes, body: regBody } = await registerTenant();
    expect(regRes.status).toBe(201);

    // Aprobăm manual tenant-ul
    const tenant = await prisma.tenant.findFirst({
      where: { user: { email: regBody.email } }
    });
    await approveTenant(tenant.id);

    const token = await loginAs(regBody.email);
    const reqRes = await createTestRequest(token);

    expect(reqRes.status).toBe(201);
    expect(reqRes.body.request).toBeDefined();
  });
});
