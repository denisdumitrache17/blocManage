import app from './app.js';
import env from './config/env.js';
import prisma from './config/prisma.js';

const server = app.listen(env.PORT, () => {
  console.log(`BlocManage API ruleaza pe portul ${env.PORT}`);
});

const shutdown = async (signal) => {
  console.log(`Semnal primit: ${signal}. Se opreste serverul...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);