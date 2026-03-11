const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

function prepareRecord(record, userId) {
  const parsed = { ...record };
  if (parsed.createdAt) parsed.createdAt = new Date(parsed.createdAt);
  if (parsed.updatedAt) parsed.updatedAt = new Date(parsed.updatedAt);
  if (parsed.completedAt) parsed.completedAt = new Date(parsed.completedAt);
  if (userId) parsed.userId = userId;
  return parsed;
}

async function main() {
  const email = 'admin@rago.com';
  const adminUser = await prisma.user.findUnique({ where: { email } });

  if (!adminUser) {
    throw new Error("Admin user not found in Supabase. Please ensure seed-admin.js ran successfully.");
  }

  console.log(`Using admin userId: ${adminUser.id}`);

  function safeParseFile(filePath) {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf8').trim();
    return content ? JSON.parse(content) : [];
  }

  // Load JSON dumps
  const materials = safeParseFile('./dump_materials.json');
  const formulas = safeParseFile('./dump_formulas.json');
  const ingredients = safeParseFile('./dump_ingredients.json');
  const orders = safeParseFile('./dump_orders.json');

  console.log(`Migrating ${materials.length} RawMaterials...`);
  for (const m of materials) {
    const data = prepareRecord(m, adminUser.id);
    await prisma.rawMaterial.upsert({
      where: { id: m.id },
      create: data,
      update: data
    });
  }

  console.log(`Migrating ${formulas.length} Formulas...`);
  for (const f of formulas) {
    const data = prepareRecord(f, adminUser.id);
    await prisma.formula.upsert({
      where: { id: f.id },
      create: data,
      update: data
    });
  }

  console.log(`Migrating ${ingredients.length} FormulaIngredients...`);
  for (const i of ingredients) {
    const data = prepareRecord(i, null); // Has formulaId and rawMaterialId, no userId
    await prisma.formulaIngredient.upsert({
      where: { id: i.id },
      create: data,
      update: data
    });
  }

  console.log(`Migrating ${orders.length} WorkOrders...`);
  for (const o of orders) {
    const data = prepareRecord(o, adminUser.id);
    await prisma.workOrder.upsert({
      where: { id: o.id },
      create: data,
      update: data
    });
  }

  console.log("Migration complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
