// app/api/contracts/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '@shopify/shopify-app-remix/server';

const prisma = new PrismaClient();

// GET - Fetch all contracts for the shop
export async function GET(request) {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    const contracts = await prisma.contract.findMany({
      where: { shop },
      include: {
        skuMappings: true,
        _count: {
          select: {
            signedContracts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}

// POST - Create a new contract
export async function POST(request) {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const { name, content, skus } = await request.json();

    // Validate required fields
    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      );
    }

    // Create contract with SKU mappings
    const contract = await prisma.contract.create({
      data: {
        name,
        content,
        shop,
        skuMappings: {
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
    console.error('Error creating contract:', error);
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    );
  }
}