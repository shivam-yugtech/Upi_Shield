const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SEEDED_PHRASES = [
  'electricity bill',
  'account blocked',
  'lottery win',
  'kyc updated',
  'gift card',
  'part time job',
  'apk download',
];

async function main() {
  for (const phrase of SEEDED_PHRASES) {
    await prisma.threatPhrase.upsert({
      where: { phrase },
      update: {},
      create: {
        phrase,
        source: 'seed',
        status: 'ACTIVE',
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed failed:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  });
