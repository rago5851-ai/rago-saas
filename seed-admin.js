const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = "admin@rago.com";
  const existingUser = await prisma.user.findUnique({ where: { email } });
  
  if (!existingUser) {
    const passwordHash = await bcrypt.hash("Rago2026Admin", 10);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "SUPERADMIN",
      }
    });
    console.log(`Admin user created successfully: ${email}`);
  } else {
    const passwordHash = await bcrypt.hash("Rago2026Admin", 10);
    await prisma.user.update({
      where: { email },
      data: { passwordHash, role: "SUPERADMIN" }
    });
    console.log(`Admin user already exists. Password updated for: ${email}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
