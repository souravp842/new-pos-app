import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '@shopify/shopify-app-remix/server';

const prisma = new PrismaClient();

// GET - Fetch specific contract
export async function GET(request, { params }) {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const contractId = parseInt(params.id);

    const contract = await prisma.contract.findFirst({
      where: {
        id: contractId,
        shop
      },
      include: {
        skuMappings: true
      }
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ contract });
  } catch (error) {
    console.error('Error fetching contract:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    );
  }
}

// PUT - Update contract
export async function PUT(request, { params }) {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const contractId = parseInt(params.id);
    const { name, content, skus, isActive } = await request.json();

    // Update contract and replace SKU mappings
    const contract = await prisma.contract.update({
      where: {
        id: contractId,
        shop
      },
      data: {
        name,
        content,
        isActive,
        skuMappings: {
          deleteMany: {}, // Remove all existing mappings
          create: skus?.map(sku => ({
            sku: sku.sku,
            productId: sku.productId,
            variantId: sku.variantId
          })) || []
        }
      },
      include: {
        skuMappings: true
      }
    });

    return NextResponse.json({ contract });
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json(
      { error: 'Failed to update contract' },
      { status: 500 }
    );
  }
}

// DELETE - Delete contract
export async function DELETE(request, { params }) {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const contractId = parseInt(params.id);

    await prisma.contract.delete({
      where: {
        id: contractId,
        shop
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json(
      { error: 'Failed to delete contract' },
      { status: 500 }
    );
  }
}
