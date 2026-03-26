import prisma from './src/config/prisma.js';
const result = await prisma.contract.deleteMany();
console.log('Deleted', result.count, 'contracts');
await prisma.$disconnect();
