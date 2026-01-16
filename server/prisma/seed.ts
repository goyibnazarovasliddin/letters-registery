import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Create Departments
    const itDept = await prisma.department.create({
        data: {
            name: 'IT Department',
            description: 'Information Technology and Systems',
            status: 'active'
        }
    });

    const hrDept = await prisma.department.create({
        data: {
            name: 'HR Department',
            description: 'Human Resources',
            status: 'active'
        }
    });

    console.log('Departments created.');

    // 2. Create Indices
    await prisma.index.create({
        data: {
            code: '01-01',
            name: 'Rahbariyat buyruqlari',
            status: 'active'
        }
    });

    await prisma.index.create({
        data: {
            code: '01-02',
            name: 'Tashkiliy masalalar',
            status: 'active'
        }
    });

    console.log('Indices created.');

    // 3. Create Admin User
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
        data: {
            username: 'admin',
            password: hashedPassword,
            fullName: 'System Administrator',
            position: 'Admin',
            role: 'admin',
            departmentId: itDept.id,
            status: 'active'
        }
    });

    // 4. Create Regular User
    const userPassword = await bcrypt.hash('user123', 10);
    await prisma.user.create({
        data: {
            username: 'user',
            password: userPassword,
            fullName: 'Test User',
            position: 'Specialist',
            role: 'user',
            departmentId: hrDept.id,
            status: 'active'
        }
    });

    console.log('Users created.');
    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
