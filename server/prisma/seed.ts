import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function getEnv(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

async function main() {
  console.log('Seeding database...');

  // ---------- Departments (name is not unique, so we "findFirst + create") ----------
  const itDept =
    (await prisma.department.findFirst({ where: { name: 'IT Department' } })) ??
    (await prisma.department.create({
      data: {
        name: 'IT Department',
        description: 'Information Technology and Systems',
        status: 'active',
      },
    }));

  const hrDept =
    (await prisma.department.findFirst({ where: { name: 'HR Department' } })) ??
    (await prisma.department.create({
      data: {
        name: 'HR Department',
        description: 'Human Resources',
        status: 'active',
      },
    }));

  console.log('Departments checked/created.');

  // ---------- Indices (code is unique -> upsert is perfect) ----------
  await prisma.index.upsert({
    where: { code: '01-01' },
    update: { name: 'Rahbariyat buyruqlari', status: 'active' },
    create: { code: '01-01', name: 'Rahbariyat buyruqlari', status: 'active' },
  });

  await prisma.index.upsert({
    where: { code: '01-02' },
    update: { name: 'Tashkiliy masalalar', status: 'active' },
    create: { code: '01-02', name: 'Tashkiliy masalalar', status: 'active' },
  });

  console.log('Indices checked/created.');

  // ---------- Users (safe pattern) ----------
  const isProd = process.env.NODE_ENV === 'production';
  const allowAdminReset = process.env.SEED_ALLOW_ADMIN_RESET === 'true';

  const adminUsername = getEnv('ADMIN_USERNAME', 'agrobank.sec.admin');
  const adminPasswordPlain = getEnv('ADMIN_PASSWORD'); // MUST be provided

  const userUsername = getEnv('USER_USERNAME', 'user');
  const userPasswordPlain = getEnv('USER_PASSWORD', 'user123'); // allow fallback for dev only

  const adminPasswordHash = await bcrypt.hash(adminPasswordPlain, 12);
  const userPasswordHash = await bcrypt.hash(userPasswordPlain, 12);

  // Admin: create if missing; update only if allowed (avoid accidental takeover in prod)
  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername },
    select: { id: true },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        username: adminUsername,
        password: adminPasswordHash,
        fullName: 'System Administrator',
        position: 'Admin',
        role: 'admin',
        departmentId: itDept.id,
        status: 'active',
      },
    });
    console.log('Admin user created.');
  } else if (!isProd || allowAdminReset) {
    await prisma.user.update({
      where: { username: adminUsername },
      data: {
        password: adminPasswordHash,
        fullName: 'System Administrator',
        role: 'admin',
        status: 'active',
        departmentId: itDept.id,
      },
    });
    console.log('Admin user updated.');
  } else {
    console.log('Admin exists; skipping update in production.');
  }

  // Regular user: ok to upsert (or keep same safety logic if you want)
  await prisma.user.upsert({
    where: { username: userUsername },
    update: {
      password: userPasswordHash,
      fullName: 'Test User',
      role: 'user',
      departmentId: hrDept.id,
      status: 'active',
    },
    create: {
      username: userUsername,
      password: userPasswordHash,
      fullName: 'Test User',
      position: 'Specialist',
      role: 'user',
      departmentId: hrDept.id,
      status: 'active',
    },
  });

  console.log('Regular user checked/created.');
  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });