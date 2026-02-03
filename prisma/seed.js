const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: "Masajes", type: "PROFESSIONAL" },
    { name: "Strippers", type: "PROFESSIONAL" },
    { name: "Night Clubs", type: "ESTABLISHMENT" },
    { name: "Sex-shops", type: "ESTABLISHMENT" }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category
    });
  }

  const plans = [
    { name: "Plan Premium", tier: "PREMIUM", price: 30000, active: true },
    { name: "Plan Gold", tier: "GOLD", price: 20000, active: true },
    { name: "Plan Silver", tier: "SILVER", price: 12000, active: true }
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: { price: plan.price, tier: plan.tier, active: plan.active },
      create: plan
    });
  }

  console.log("Seed completado");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
