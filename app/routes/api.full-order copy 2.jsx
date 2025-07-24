// app/routes/api.full-order.jsx
import { json } from '@remix-run/node';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    const shop = url.searchParams.get('shop');

    if (!orderId || !shop) {
      return json({ error: 'Missing orderId or shop' }, { status: 400 });
    }

    // 🔐 Get access token for the shop from your Session table
    const session = await prisma.session.findFirst({
      where: { shop }, // assuming your Prisma model has `shop` and `accessToken`
    });

   // console.log(session, 'session');

    if (!session || !session.accessToken) {
      return json({ error: 'Shop not authenticated' }, { status: 403 });
    }

    const accessToken = session.accessToken;

    // 📦 GraphQL query to get order details
    const query = `
      query getOrder($id: ID!) {
        order(id: $id) {
          id
          name
          customer {
            id
            firstName
            lastName
            email
          }
          lineItems(first: 100) {
            edges {
              node {
                id
                title
                quantity
                variant {
                  id
                  sku
                  title
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(`https://${shop}/admin/api/2024-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        query,
        variables: {
          id: `gid://shopify/Order/${orderId}`,
        },
      }),
    });

    const data = await response.json();

    if (data.errors || !data.data?.order) {
      return json({ error: 'Failed to fetch order from Shopify', details: data.errors }, { status: 502 });
    }

    const order = data.data.order;

    const lineItems = order.lineItems.edges.map(({ node }) => ({
      id: node.id,
      title: node.title,
      quantity: node.quantity,
      variant: node.variant
        ? {
            id: node.variant.id,
            sku: node.variant.sku,
            title: node.variant.title,
          }
        : null,
    }));


    console.log(lineItems)
    return json({
      orderId: order.id,
      name: order.name,
      customer: order.customer,
      lineItems,
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
