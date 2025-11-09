process.env.NODE_ENV = 'test';
require('dotenv').config({ path: '.env.test' });

const { execSync } = require('node:child_process');

beforeAll(() => {
  // รีเซ็ตสคีมาทุกครั้งก่อนทดสอบ (เร็วและสะอาด)
  execSync('npx prisma migrate reset --force --skip-generate --skip-seed', {
    stdio: 'inherit',
    env: { ...process.env }
  });
});

afterAll(async () => {
  // ปิดการเชื่อมต่อ Prisma ถ้ามี instance เปิดไว้ในเทส (กรณีคุณ import prisma ตรง ๆ)
  try {
    const prisma = require('../src/config/prisma');
    await prisma.$disconnect();
  } catch (_) {}
});
