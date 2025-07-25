import { json } from '@remix-run/node';
import { authenticate } from '../shopify.server/';

export async function loader({ request }) {
  try {
    const { admin } = await authenticate.admin(request);
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';

    console.log('search', search)

    const query = `
      query getProducts($first: Int!, $after: String, $query: String) {
        products(first: $first, after: $after, query: $query) {
          pageInfo {
            hasNextPage
          }
          edges {
            cursor
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

    let allProducts = [];
    let hasNextPage = true;
    let afterCursor = null;

    while (hasNextPage) {
      const response = await admin.graphql(query, {
        variables: {
          first: 250,
          after: afterCursor,
          query: search ? `(title:*${search}*) OR (sku:*${search}*)` : undefined
        }
      });

      const data = await response.json();
      const edges = data.data.products.edges;

      edges.forEach(({ node }) => {
        allProducts.push({
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
        });
      });

      hasNextPage = data.data.products.pageInfo.hasNextPage;
      afterCursor = edges.length ? edges[edges.length - 1].cursor : null;
    }

    return json({ products: allProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    return json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
