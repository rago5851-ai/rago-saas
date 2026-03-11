const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true }});
  console.log("Supabase Users:");
  console.table(users);

  const materials = await prisma.rawMaterial.findMany();
  console.log(`Supabase Materials count: ${materials.length}`);
  if (materials.length > 0) {
    console.table(materials.slice(0, 5));
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
