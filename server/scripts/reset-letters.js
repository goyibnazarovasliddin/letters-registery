const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Deleting all files...');
        await prisma.file.deleteMany({});

        console.log('Deleting all letters...');
        await prisma.letter.deleteMany({});

        console.log('Deleting year counters...');
        await prisma.yearCounter.deleteMany({});

        console.log('Database reset successful. Ready for fresh numbering.');
    } catch (e) {
        console.error('Error resetting database:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
