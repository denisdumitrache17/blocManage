import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const f = await p.firm.findMany({ select: { companyName: true, domains: true } });
console.log(JSON.stringify(f, null, 2));
await p.$disconnect();
