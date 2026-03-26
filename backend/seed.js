import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'Test1234';

async function main() {
  console.log('Curatare date existente...');
  await prisma.review.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.request.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.staircase.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.hoa.deleteMany();
  await prisma.firm.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  // ═══════════════════════════════════════════
  // 1. Cont HOA
  // ═══════════════════════════════════════════
  console.log('Creare cont HOA...');
  const hoaUser = await prisma.user.create({
    data: {
      email: 'hoa@test.ro',
      passwordHash: hash,
      role: 'HOA',
      hoa: {
        create: {
          presidentName: 'Ion Popescu',
          adminName: 'Maria Ionescu',
          buildingAddress: 'Str. Florilor nr. 10, Bloc A, București',
          documentsUrl: null,
          staircases: {
            create: [
              { name: 'Scara A', apartmentsCount: 20 },
              { name: 'Scara B', apartmentsCount: 16 }
            ]
          }
        }
      }
    },
    include: { hoa: { include: { staircases: true } } }
  });
  console.log(`  HOA: ${hoaUser.email} | HOA ID: ${hoaUser.hoa.id}`);

  // ═══════════════════════════════════════════
  // 2. Cont FIRM
  // ═══════════════════════════════════════════
  console.log('Creare cont FIRM...');
  const firmUser = await prisma.user.create({
    data: {
      email: 'firma@test.ro',
      passwordHash: hash,
      role: 'FIRM',
      firm: {
        create: {
          companyName: 'TehnoFix SRL',
          cui: 'RO12345678',
          caen: '4322',
          adminName: 'Andrei Vasilescu',
          phone: '0722111222',
          email: 'contact@tehnofix.ro',
          hqAddress: 'Str. Industriilor nr. 5, Cluj-Napoca',
          iban: 'RO49AAAA1B31007593840000',
          bankName: 'Banca Transilvania',
          portfolios: {
            create: [
              { title: 'Reparații instalații sanitare', imageUrl: 'https://placehold.co/400x300?text=Instalatii' },
              { title: 'Întreținere lifturi', imageUrl: 'https://placehold.co/400x300?text=Lifturi' },
              { title: 'Zugrăveli și vopsitorie', imageUrl: 'https://placehold.co/400x300?text=Zugraveli' }
            ]
          }
        }
      }
    },
    include: { firm: { include: { portfolios: true } } }
  });
  console.log(`  FIRM: ${firmUser.email} | Firm ID: ${firmUser.firm.id}`);

  // ═══════════════════════════════════════════
  // 3. Cont TENANT (aprobat, legat de HOA)
  // ═══════════════════════════════════════════
  console.log('Creare cont TENANT...');
  const tenantUser = await prisma.user.create({
    data: {
      email: 'locatar@test.ro',
      passwordHash: hash,
      role: 'TENANT',
      tenant: {
        create: {
          hoaId: hoaUser.hoa.id,
          staircaseId: hoaUser.hoa.staircases[0].id,
          firstName: 'Alexandru',
          lastName: 'Dumitrescu',
          phone: '0733444555',
          cnp: '1900101123456',
          addressText: 'Str. Florilor nr. 10, Bloc A, București',
          apartmentNumber: '12',
          isApproved: true
        }
      }
    },
    include: { tenant: true }
  });
  console.log(`  TENANT: ${tenantUser.email} | Tenant ID: ${tenantUser.tenant.id}`);

  // ═══════════════════════════════════════════
  // 1b. Cont HOA #2
  // ═══════════════════════════════════════════
  console.log('Creare cont HOA #2...');
  const hoaUser2 = await prisma.user.create({
    data: {
      email: 'hoa2@test.ro',
      passwordHash: hash,
      role: 'HOA',
      hoa: {
        create: {
          presidentName: 'Vasile Marin',
          adminName: 'Elena Preda',
          buildingAddress: 'Bd. Unirii nr. 42, Bloc C1, Sector 3, București',
          documentsUrl: null,
          staircases: {
            create: [
              { name: 'Scara 1', apartmentsCount: 30 },
              { name: 'Scara 2', apartmentsCount: 30 },
              { name: 'Scara 3', apartmentsCount: 24 }
            ]
          }
        }
      }
    },
    include: { hoa: { include: { staircases: true } } }
  });
  console.log(`  HOA #2: ${hoaUser2.email} | HOA ID: ${hoaUser2.hoa.id}`);

  // ═══════════════════════════════════════════
  // 1c. Cont HOA #3
  // ═══════════════════════════════════════════
  console.log('Creare cont HOA #3...');
  const hoaUser3 = await prisma.user.create({
    data: {
      email: 'hoa3@test.ro',
      passwordHash: hash,
      role: 'HOA',
      hoa: {
        create: {
          presidentName: 'Gheorghe Stancu',
          adminName: 'Ioana Radu',
          buildingAddress: 'Str. Libertății nr. 7, Bloc D2, Cluj-Napoca',
          documentsUrl: null,
          staircases: {
            create: [
              { name: 'Scara A', apartmentsCount: 18 },
              { name: 'Scara B', apartmentsCount: 18 }
            ]
          }
        }
      }
    },
    include: { hoa: { include: { staircases: true } } }
  });
  console.log(`  HOA #3: ${hoaUser3.email} | HOA ID: ${hoaUser3.hoa.id}`);

  // ═══════════════════════════════════════════
  // 2b. Cont FIRM #2
  // ═══════════════════════════════════════════
  console.log('Creare cont FIRM #2...');
  const firmUser2 = await prisma.user.create({
    data: {
      email: 'firma2@test.ro',
      passwordHash: hash,
      role: 'FIRM',
      firm: {
        create: {
          companyName: 'AquaPro Instalații SRL',
          cui: 'RO87654321',
          caen: '4322',
          adminName: 'Cristian Moldovan',
          phone: '0744222333',
          email: 'office@aquapro.ro',
          hqAddress: 'Str. Meșteșugarilor nr. 12, Timișoara',
          iban: 'RO22BRDE445SV75312344500',
          bankName: 'BRD - Groupe Société Générale',
          portfolios: {
            create: [
              { title: 'Instalații termice și încălzire', imageUrl: 'https://placehold.co/400x300?text=Termice' },
              { title: 'Reparații conducte apă', imageUrl: 'https://placehold.co/400x300?text=Conducte' },
              { title: 'Montaj centrale termice', imageUrl: 'https://placehold.co/400x300?text=Centrale' },
              { title: 'Desfundare canalizări', imageUrl: 'https://placehold.co/400x300?text=Canalizari' }
            ]
          }
        }
      }
    },
    include: { firm: { include: { portfolios: true } } }
  });
  console.log(`  FIRM #2: ${firmUser2.email} | Firm ID: ${firmUser2.firm.id}`);

  // ═══════════════════════════════════════════
  // 2c. Cont FIRM #3
  // ═══════════════════════════════════════════
  console.log('Creare cont FIRM #3...');
  const firmUser3 = await prisma.user.create({
    data: {
      email: 'firma3@test.ro',
      passwordHash: hash,
      role: 'FIRM',
      firm: {
        create: {
          companyName: 'ElectroService Expert SRL',
          cui: 'RO11223344',
          caen: '4321',
          adminName: 'Mihai Diaconu',
          phone: '0755333444',
          email: 'contact@electroservice.ro',
          hqAddress: 'Calea Victoriei nr. 88, București',
          iban: 'RO55RNCB0082044171830001',
          bankName: 'BCR',
          portfolios: {
            create: [
              { title: 'Instalații electrice rezidențiale', imageUrl: 'https://placehold.co/400x300?text=Electrice' },
              { title: 'Tablouri electrice', imageUrl: 'https://placehold.co/400x300?text=Tablouri' },
              { title: 'Sisteme iluminat LED scări bloc', imageUrl: 'https://placehold.co/400x300?text=LED' },
              { title: 'Interfoane și videointerfoane', imageUrl: 'https://placehold.co/400x300?text=Interfoane' },
              { title: 'Camere supraveghere', imageUrl: 'https://placehold.co/400x300?text=Camere' }
            ]
          }
        }
      }
    },
    include: { firm: { include: { portfolios: true } } }
  });
  console.log(`  FIRM #3: ${firmUser3.email} | Firm ID: ${firmUser3.firm.id}`);

  // ═══════════════════════════════════════════
  // 3b. Cont TENANT #2 (locatar in HOA #1, Scara B)
  // ═══════════════════════════════════════════
  console.log('Creare cont TENANT #2...');
  const tenantUser2 = await prisma.user.create({
    data: {
      email: 'locatar2@test.ro',
      passwordHash: hash,
      role: 'TENANT',
      tenant: {
        create: {
          hoaId: hoaUser.hoa.id,
          staircaseId: hoaUser.hoa.staircases[1].id,
          firstName: 'Maria',
          lastName: 'Constantinescu',
          phone: '0766555666',
          cnp: '2850315223344',
          addressText: 'Str. Florilor nr. 10, Bloc A, București',
          apartmentNumber: '7',
          isApproved: true
        }
      }
    },
    include: { tenant: true }
  });
  console.log(`  TENANT #2: ${tenantUser2.email} | Tenant ID: ${tenantUser2.tenant.id}`);

  // ═══════════════════════════════════════════
  // 3c. Cont TENANT #3 (locatar in HOA #2, Scara 1)
  // ═══════════════════════════════════════════
  console.log('Creare cont TENANT #3...');
  const tenantUser3 = await prisma.user.create({
    data: {
      email: 'locatar3@test.ro',
      passwordHash: hash,
      role: 'TENANT',
      tenant: {
        create: {
          hoaId: hoaUser2.hoa.id,
          staircaseId: hoaUser2.hoa.staircases[0].id,
          firstName: 'Radu',
          lastName: 'Gheorghescu',
          phone: '0777666777',
          cnp: '1920505334455',
          addressText: 'Bd. Unirii nr. 42, Bloc C1, Sector 3, București',
          apartmentNumber: '22',
          isApproved: true
        }
      }
    },
    include: { tenant: true }
  });
  console.log(`  TENANT #3: ${tenantUser3.email} | Tenant ID: ${tenantUser3.tenant.id}`);

  // ═══════════════════════════════════════════
  // 4. Cont PLATFORM_ADMIN
  // ═══════════════════════════════════════════
  console.log('Creare cont PLATFORM_ADMIN...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@blocmanage.ro',
      passwordHash: hash,
      role: 'PLATFORM_ADMIN'
    }
  });
  console.log(`  ADMIN: ${adminUser.email} | ID: ${adminUser.id}`);

  // ═══════════════════════════════════════════
  // 5. Cereri de test
  // ═══════════════════════════════════════════
  console.log('Creare cereri de test...');

  // ── Cereri de la tenantUser (HOA #1) ──
  const reqCompleted = await prisma.request.create({
    data: {
      requesterId: tenantUser.id,
      firmId: firmUser.firm.id,
      category: 'Instalații Sanitare (apă, canalizare)',
      workType: 'Reparație (Defecțiune/Avarie)',
      description: 'Țeavă spartă la baie, apartamentul 12, scara A. Curge apa pe la vecini.',
      urgencyLevel: 'CRITICAL',
      status: 'COMPLETED'
    }
  });
  console.log(`  Cerere COMPLETED: ${reqCompleted.id}`);

  const reqInProgress = await prisma.request.create({
    data: {
      requesterId: tenantUser.id,
      firmId: firmUser.firm.id,
      category: 'Instalații Electrice',
      workType: 'Reparație (Defecțiune/Avarie)',
      description: 'Nu funcționează iluminatul pe scara A, etajele 2-4. Becurile sunt OK, probabil problema la tabloul electric.',
      urgencyLevel: 'MEDIUM',
      status: 'IN_PROGRESS'
    }
  });
  console.log(`  Cerere IN_PROGRESS: ${reqInProgress.id}`);

  const reqPending = await prisma.request.create({
    data: {
      requesterId: tenantUser.id,
      category: 'Curățenie și Igienizare',
      workType: 'Întreținere periodică / Mentenanță',
      description: 'Casa scării B are nevoie de curățenie generală. Geamurile sunt murdare și pe paliere sunt resturi.',
      urgencyLevel: 'LOW',
      status: 'PENDING'
    }
  });
  console.log(`  Cerere PENDING: ${reqPending.id}`);

  // Cerere de la HOA direct
  const reqValidated = await prisma.request.create({
    data: {
      requesterId: hoaUser.id,
      firmId: firmUser.firm.id,
      category: 'Lifturi și Ascensoare',
      workType: 'Inspecție / Verificare tehnică',
      description: 'Liftul de pe scara A se blochează frecvent între etajele 3 și 4. Necesită revizie urgentă.',
      urgencyLevel: 'CRITICAL',
      status: 'VALIDATED'
    }
  });
  console.log(`  Cerere VALIDATED: ${reqValidated.id}`);

  // ── Cereri de la tenantUser2 (HOA #1, Scara B) ──
  const req2Completed = await prisma.request.create({
    data: {
      requesterId: tenantUser2.id,
      firmId: firmUser2.firm.id,
      category: 'Instalații Sanitare (apă, canalizare)',
      workType: 'Reparație (Defecțiune/Avarie)',
      description: 'Scurgerea de la chiuvetă este înfundată complet. Apa stagnează în chiuvetă.',
      urgencyLevel: 'MEDIUM',
      status: 'COMPLETED'
    }
  });
  console.log(`  Cerere T2 COMPLETED: ${req2Completed.id}`);

  const req2InProgress = await prisma.request.create({
    data: {
      requesterId: tenantUser2.id,
      firmId: firmUser3.firm.id,
      category: 'Instalații Electrice',
      workType: 'Reparație (Defecțiune/Avarie)',
      description: 'Priză defectă în bucătărie, scoate scântei la conectarea aparatelor. Pericol de incendiu.',
      urgencyLevel: 'CRITICAL',
      status: 'IN_PROGRESS'
    }
  });
  console.log(`  Cerere T2 IN_PROGRESS: ${req2InProgress.id}`);

  const req2Pending = await prisma.request.create({
    data: {
      requesterId: tenantUser2.id,
      category: 'Amenajări Spații Verzi / Exterioare',
      workType: 'Remodernizare / Înlocuire totală',
      description: 'Pereții de pe hol au igrasie și mucegai. Se cere zugrăvire și tratament antiumezeală.',
      urgencyLevel: 'LOW',
      status: 'PENDING'
    }
  });
  console.log(`  Cerere T2 PENDING: ${req2Pending.id}`);

  // ── Cereri de la tenantUser3 (HOA #2) ──
  const req3Completed = await prisma.request.create({
    data: {
      requesterId: tenantUser3.id,
      firmId: firmUser.firm.id,
      category: 'Instalații Sanitare (apă, canalizare)',
      workType: 'Reparație (Defecțiune/Avarie)',
      description: 'Robinet spart în baie, curge continuu. Am închis apa de pe riser dar trebuie reparat urgent.',
      urgencyLevel: 'CRITICAL',
      status: 'COMPLETED'
    }
  });
  console.log(`  Cerere T3 COMPLETED: ${req3Completed.id}`);

  const req3InProgress = await prisma.request.create({
    data: {
      requesterId: tenantUser3.id,
      firmId: firmUser2.firm.id,
      category: 'Instalații Sanitare (apă, canalizare)',
      workType: 'Întreținere periodică / Mentenanță',
      description: 'Caloriferul din living nu se încălzește deloc. Toate celelalte funcționează normal.',
      urgencyLevel: 'MEDIUM',
      status: 'IN_PROGRESS'
    }
  });
  console.log(`  Cerere T3 IN_PROGRESS: ${req3InProgress.id}`);

  const req3Validated = await prisma.request.create({
    data: {
      requesterId: hoaUser2.id,
      firmId: firmUser3.firm.id,
      category: 'Lăcătușerie și Interfoane',
      workType: 'Reparație (Defecțiune/Avarie)',
      description: 'Sistemul de interfon de pe scara 1 nu funcționează de 3 zile. Locuitorii nu pot deschide ușa vizitatorilor.',
      urgencyLevel: 'MEDIUM',
      status: 'VALIDATED'
    }
  });
  console.log(`  Cerere T3 VALIDATED: ${req3Validated.id}`);

  const req3Pending = await prisma.request.create({
    data: {
      requesterId: tenantUser3.id,
      category: 'Curățenie și Igienizare',
      workType: 'Întreținere periodică / Mentenanță',
      description: 'Subsolul blocului C1 este plin de gunoaie și resturi de construcție. Necesită igienizare.',
      urgencyLevel: 'LOW',
      status: 'PENDING'
    }
  });
  console.log(`  Cerere T3 PENDING: ${req3Pending.id}`);

  // ── Cereri suplimentare HOA #3 ──
  const req4Pending = await prisma.request.create({
    data: {
      requesterId: hoaUser3.id,
      category: 'Reparații Acoperiș / Hidroizolații',
      workType: 'Reparație (Defecțiune/Avarie)',
      description: 'Acoperișul are infiltrații vizibile la ultimul etaj, scara B. Apa curge pe perete când plouă.',
      urgencyLevel: 'CRITICAL',
      status: 'PENDING'
    }
  });
  console.log(`  Cerere HOA3 PENDING: ${req4Pending.id}`);

  // ═══════════════════════════════════════════
  // 6. Reviews
  // ═══════════════════════════════════════════
  console.log('Creare reviews...');
  const review1 = await prisma.review.create({
    data: {
      requestId: reqCompleted.id,
      reviewerId: tenantUser.id,
      firmId: firmUser.firm.id,
      rating: 5,
      comment: 'Excelent! Au venit rapid și au rezolvat problema în aceeași zi. Recomand cu încredere.'
    }
  });
  console.log(`  Review: ${review1.id} (${review1.rating} stele) → TehnoFix`);

  const review2 = await prisma.review.create({
    data: {
      requestId: req2Completed.id,
      reviewerId: tenantUser2.id,
      firmId: firmUser2.firm.id,
      rating: 4,
      comment: 'Au rezolvat problema bine, dar au întârziat puțin față de programare. Per total, mulțumită.'
    }
  });
  console.log(`  Review: ${review2.id} (${review2.rating} stele) → AquaPro`);

  const review3 = await prisma.review.create({
    data: {
      requestId: req3Completed.id,
      reviewerId: tenantUser3.id,
      firmId: firmUser.firm.id,
      rating: 3,
      comment: 'Lucrarea a fost ok, dar prețul li s-a părut cam mare. Comunicarea putea fi mai bună.'
    }
  });
  console.log(`  Review: ${review3.id} (${review3.rating} stele) → TehnoFix`);

  // ═══════════════════════════════════════════
  // 7. Facturi
  // ═══════════════════════════════════════════
  console.log('Creare facturi...');
  const invoice1 = await prisma.invoice.create({
    data: {
      requestId: reqCompleted.id,
      firmId: firmUser.firm.id,
      clientId: tenantUser.id,
      amount: 450.00,
      status: 'PAID'
    }
  });
  console.log(`  Factura PAID: ${invoice1.id} - ${invoice1.amount} RON`);

  const invoice2 = await prisma.invoice.create({
    data: {
      requestId: reqInProgress.id,
      firmId: firmUser.firm.id,
      clientId: tenantUser.id,
      amount: 1200.50,
      status: 'UNPAID'
    }
  });
  console.log(`  Factura UNPAID: ${invoice2.id} - ${invoice2.amount} RON`);

  const invoice3 = await prisma.invoice.create({
    data: {
      requestId: req2Completed.id,
      firmId: firmUser2.firm.id,
      clientId: tenantUser2.id,
      amount: 320.00,
      status: 'PAID'
    }
  });
  console.log(`  Factura PAID: ${invoice3.id} - ${invoice3.amount} RON`);

  const invoice4 = await prisma.invoice.create({
    data: {
      requestId: req2InProgress.id,
      firmId: firmUser3.firm.id,
      clientId: tenantUser2.id,
      amount: 780.00,
      status: 'UNPAID'
    }
  });
  console.log(`  Factura UNPAID: ${invoice4.id} - ${invoice4.amount} RON`);

  const invoice5 = await prisma.invoice.create({
    data: {
      requestId: req3Completed.id,
      firmId: firmUser.firm.id,
      clientId: tenantUser3.id,
      amount: 550.00,
      status: 'PAID'
    }
  });
  console.log(`  Factura PAID: ${invoice5.id} - ${invoice5.amount} RON`);

  const invoice6 = await prisma.invoice.create({
    data: {
      requestId: req3InProgress.id,
      firmId: firmUser2.firm.id,
      clientId: tenantUser3.id,
      amount: 920.00,
      status: 'UNPAID'
    }
  });
  console.log(`  Factura UNPAID: ${invoice6.id} - ${invoice6.amount} RON`);

  const invoice7 = await prisma.invoice.create({
    data: {
      requestId: req3Validated.id,
      firmId: firmUser3.firm.id,
      clientId: hoaUser2.id,
      amount: 2100.00,
      status: 'OVERDUE'
    }
  });
  console.log(`  Factura OVERDUE: ${invoice7.id} - ${invoice7.amount} RON`);

  // ═══════════════════════════════════════════
  // 8. Contracte
  // ═══════════════════════════════════════════
  console.log('Creare contracte...');
  const contract1 = await prisma.contract.create({
    data: {
      requestId: reqValidated.id,
      firmId: firmUser.firm.id,
      clientId: hoaUser.id,
      status: 'SIGNED_AND_ACTIVE'
    }
  });
  console.log(`  Contract SIGNED: ${contract1.id}`);

  const contract2 = await prisma.contract.create({
    data: {
      requestId: req3Validated.id,
      firmId: firmUser3.firm.id,
      clientId: hoaUser2.id,
      status: 'AWAITING_FIRM_DRAFT'
    }
  });
  console.log(`  Contract AWAITING_DRAFT: ${contract2.id}`);

  // ═══════════════════════════════════════════
  console.log('\n════════════════════════════════════════');
  console.log('  SEED FINALIZAT CU SUCCES!');
  console.log('════════════════════════════════════════');
  console.log('\nConturi de test (parola: Test1234):');
  console.log(`  ADMIN:     admin@blocmanage.ro`);
  console.log(`  HOA #1:    hoa@test.ro`);
  console.log(`  HOA #2:    hoa2@test.ro`);
  console.log(`  HOA #3:    hoa3@test.ro`);
  console.log(`  FIRMA #1:  firma@test.ro`);
  console.log(`  FIRMA #2:  firma2@test.ro`);
  console.log(`  FIRMA #3:  firma3@test.ro`);
  console.log(`  LOCATAR #1: locatar@test.ro`);
  console.log(`  LOCATAR #2: locatar2@test.ro`);
  console.log(`  LOCATAR #3: locatar3@test.ro`);
  console.log('\nDate populate:');
  console.log(`  - 3 asociații (7 scări total)`);
  console.log(`  - 12 elemente portofoliu (3 firme)`);
  console.log(`  - 12 cereri (diverse statusuri)`);
  console.log(`  - 3 reviews`);
  console.log(`  - 7 facturi (3 PAID, 3 UNPAID, 1 OVERDUE)`);
  console.log(`  - 2 contracte`);
}

main()
  .catch((e) => {
    console.error('Eroare la seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
