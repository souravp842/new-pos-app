import { json } from '@remix-run/node';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../shopify.server'; // ✅ correct source for Shopify Remix apps

const prisma = new PrismaClient();

// GET - Fetch all contracts for the shop
export async function loader({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    const contracts = await prisma.contract.findMany({
      where: { shop },
      include: {
        skuMappings: true,
        _count: {
          select: {
            signedContracts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return json({ contracts });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
}

// POST - Create a new contract
export async function action({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const body = await request.json(); // ✅ Remix `Request` object

    const { name, content, skus } = body;

    if (!name || !content) {
      return json(
        { error: 'Name and content are required' },
        { status: 400 }
      );
    }

    const contract = await prisma.contract.create({
      data: {
        name,
        content,
        shop,
        skuMappings: {
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
  } catch (error) {
    console.error('Error creating contract:', error);
    return json({ error: 'Failed to create contract' }, { status: 500 });
  }
}
