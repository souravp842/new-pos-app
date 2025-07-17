// routes/api/contracts/check.jsx (or app/api/contracts/check/route.jsx for Next.js App Router)

import { prisma } from '@/lib/prisma';

export async function POST(req) {
  const { skus, shop, orderId } = await req.json();

  const mappings = await prisma.contractSkuMapping.findMany({
    where: {
      sku: { in: skus },
      contract: {
        isActive: true,
        shop: shop,
      },
    },
    include: {
      contract: true,
    },
  });

  // Get unique contracts by ID
  const uniqueContracts = new Map();
  mappings.forEach((m) => {
    uniqueContracts.set(m.contract.id, m.contract);
  });

  return new Response(JSON.stringify([...uniqueContracts.values()]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
