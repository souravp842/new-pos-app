import { json } from '@remix-run/node';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../shopify.server';

const prisma = new PrismaClient();

// GET - Fetch a single contract
export async function loader({ request, params }) {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const contractId = parseInt(params.id);

    const contract = await prisma.contract.findFirst({
      where: {
        id: contractId,
        shop,
      },
      include: {
        skuMappings: true,
      },
    });

    if (!contract) {
      return json({ error: 'Contract not found' }, { status: 404 });
    }

    return json({ contract });
  } catch (error) {
    console.error('Error fetching contract:', error);
    return json({ error: 'Failed to fetch contract' }, { status: 500 });
  }
}

// PUT / DELETE - Update or delete contract
export async function action({ request, params }) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const contractId = parseInt(params.id);

  try {
    const method = request.method;

    if (method === 'PUT') {
      const { name, content, skus, isActive } = await request.json();

      const contract = await prisma.contract.update({
        where: {
          id: contractId,
          shop,
        },
        data: {
          name,
          content,
          isActive,
          skuMappings: {
            deleteMany: {}, // Clear all existing mappings
            create: skus?.map((sku) => ({
              sku: sku.sku,
              productId: sku.productId,
              variantId: sku.variantId,
            })) || [],
          },
        },
        include: {
          skuMappings: true,
        },
      });

      return json({ contract });
    }

    if (method === 'DELETE') {
      await prisma.contract.delete({
        where: {
          id: contractId,
          shop,
        },
      });

      return json({ success: true });
    }

    return json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('Error handling contract action:', error);
    return json({ error: 'Failed to process contract action' }, { status: 500 });
  }
}
