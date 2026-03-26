/**
 * Migration script: maps existing firm portfolios to domains.
 * Run once after adding the `domains String[]` field to the Firm model.
 *
 * Usage: node backend/scripts/migrate-firm-domains.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEYWORD_MAP = [
  { domain: 'Instalații Sanitare (apă, canalizare)', keywords: ['sanitar', 'apă', 'apa', 'canalizare', 'conducte', 'țeavă', 'teava', 'boiler', 'termic', 'încălzire', 'incalzire', 'centrală', 'centrala', 'desfundare'] },
  { domain: 'Instalații Electrice', keywords: ['electric', 'tablou', 'iluminat', 'led', 'priză', 'priza', 'cablu'] },
  { domain: 'Curățenie și Igienizare', keywords: ['curățenie', 'curatenie', 'igienizare', 'dezinfect'] },
  { domain: 'Reparații Acoperiș / Hidroizolații', keywords: ['acoperiș', 'acoperis', 'hidroizola', 'învelitoare', 'invelitoare'] },
  { domain: 'Lifturi și Ascensoare', keywords: ['lift', 'ascensor'] },
  { domain: 'Lăcătușerie și Interfoane', keywords: ['lăcătuș', 'lacatus', 'interfon', 'videointerfon', 'supraveghere', 'cameră', 'camera'] },
  { domain: 'Amenajări Spații Verzi / Exterioare', keywords: ['spații verzi', 'spatii verzi', 'grădin', 'gradin', 'exterior', 'amenaj'] }
];

function inferDomains(portfolioTitles) {
  const domains = new Set();
  for (const title of portfolioTitles) {
    const lower = title.toLowerCase();
    for (const { domain, keywords } of KEYWORD_MAP) {
      if (keywords.some((kw) => lower.includes(kw))) {
        domains.add(domain);
      }
    }
  }
  return [...domains];
}

async function main() {
  const firms = await prisma.firm.findMany({
    include: { portfolios: { select: { title: true } } }
  });

  console.log(`Found ${firms.length} firms to migrate.`);

  for (const firm of firms) {
    const titles = firm.portfolios.map((p) => p.title);
    const domains = inferDomains(titles);

    if (domains.length === 0) {
      console.log(`  [SKIP] ${firm.companyName} — no matching domains (portfolios: ${titles.join(', ')})`);
      continue;
    }

    await prisma.firm.update({
      where: { id: firm.id },
      data: { domains }
    });

    console.log(`  [OK] ${firm.companyName} → ${domains.join(', ')}`);
  }

  console.log('Migration complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
