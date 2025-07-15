import { NextResponse } from 'next/server';
import { authenticate } from '@shopify/shopify-app-remix/server';

// GET - Fetch products for SKU selection
export async function GET(request) {
  try {
    const { admin, session } = await authenticate.admin(request);
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const limit = url.searchParams.get('limit') || '50';

    const query = `
      query getProducts($first: Int!, $query: String) {
        products(first: $first, query: $query) {
          edges {
            node {
              id
              title
              handle
              variants(first: 100) {
                edges {
                  node {
                    id
                    title
                    sku
                    price
                    inventoryQuantity
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await admin.graphql(query, {
      variables: {
        first: parseInt(limit),
        query: search ? `title:*${search}*` : undefined
      }
    });

    const data = await response.json();
    
    // Transform data for easier frontend consumption
    const products = data.data.products.edges.map(({ node }) => ({
      id: node.id,
      title: node.title,
      handle: node.handle,
      variants: node.variants.edges.map(({ node: variant }) => ({
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
        price: variant.price,
        inventoryQuantity: variant.inventoryQuantity
      }))
    }));

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}