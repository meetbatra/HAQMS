const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing connection...');
    const result = await prisma.queueToken.findMany({
      include: {
        patient: true,
        doctor: true,
      }
    });
    console.log('Query success! Number of tokens:', result.length);
  } catch (error) {
    console.error('Query failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
