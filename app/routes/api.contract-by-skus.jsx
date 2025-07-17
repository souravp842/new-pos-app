import { json } from '@remix-run/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function action({ request }) {
  try {
    const { skus, shop } = await request.json();

    if (!skus?.length || !shop) {
      return json({ contract: null });
    }

    const mapping = await prisma.contractSkuMapping.findFirst({
      where: {
        sku: { in: skus },
        contract: {
          isActive: true,
          shop,
        },
      },
      include: {
        contract: true,
      },
    });

    if (!mapping) {
      return json({ contract: null });
    }

    const { contract } = mapping;

    return json({
      contract: {
        id: contract.id,
        name: contract.name,
        content: contract.content,
      },
    });
  } catch (error) {
    console.error('Error finding contract:', error);
    return json({ contract: null, error: 'Server error' }, { status: 500 });
  }
}
