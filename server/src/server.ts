import app from './app';
import { prisma } from './db';

const PORT = process.env.PORT || 3000;

async function main() {
    try {
        await prisma.$connect();
        console.log('Connected to Database (SQLite)');

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

main();
