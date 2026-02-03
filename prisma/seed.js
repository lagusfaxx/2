import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.category.createMany({
    data: [
      { name: "Masajes", type: "PROFESSIONAL" },
      { name: "Belleza", type: "PROFESSIONAL" },
      { name: "Spa", type: "ESTABLISHMENT" },
      { name: "Wellness", type: "ESTABLISHMENT" }
    ],
    skipDuplicates: true
  });

  await prisma.plan.createMany({
    data: [
      { name: "Silver", price: 19990, features: "Perfil básico, chat" },
      { name: "Gold", price: 39990, features: "Perfil destacado, analytics" },
      { name: "Premium", price: 69990, features: "Prioridad, campañas" }
    ],
    skipDuplicates: true
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
