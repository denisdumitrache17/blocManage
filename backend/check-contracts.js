import prisma from './src/config/prisma.js';

const contracts = await prisma.contract.findMany();
console.log('Contracts count:', contracts.length);
console.log(JSON.stringify(contracts, null, 2));

const requests = await prisma.request.findMany({ where: { status: { in: ['IN_PROGRESS', 'VALIDATED'] } } });
console.log('\nRequests IN_PROGRESS/VALIDATED:', requests.length);
for (const r of requests) {
  console.log(`  - ${r.id} | ${r.category} | status=${r.status} | firmId=${r.firmId}`);
}

await prisma.$disconnect();
