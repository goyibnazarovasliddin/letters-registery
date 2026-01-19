
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DB Timestamp Debug ---');
    try {
        const letters = await prisma.letter.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                status: true,
                letterNumber: true,
                updatedAt: true,
                registeredAt: true,
                createdAt: true
            }
        });

        if (letters.length === 0) {
            console.log('No letters found.');
        }

        letters.forEach(l => {
            console.log(`ID: ${l.id}`);
            console.log(`Status: ${l.status}`);
            console.log(`LN: ${l.letterNumber}`);
            console.log(`UpdatedAt: ${l.updatedAt ? l.updatedAt.toISOString() : 'MISSING'} (${typeof l.updatedAt})`);
            console.log(`RegisteredAt: ${l.registeredAt ? l.registeredAt.toISOString() : 'MISSING'} (${typeof l.registeredAt})`);
            console.log('----------------');
        });
    } catch (e) {
        console.error("Error querying DB:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
