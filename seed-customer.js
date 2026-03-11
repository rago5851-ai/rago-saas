const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = "rago.facturacion1@gmail.com";
  const password = "Usuario1";
  
  const existingUser = await prisma.user.findUnique({ where: { email } });
  
  if (!existingUser) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "CUSTOMER", // default role
      }
    });
    console.log(`User created successfully: ${email}`);
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { passwordHash }
    });
    console.log(`User already exists. Password updated for: ${email}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
