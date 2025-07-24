// app/routes/api.full-order.jsx
import { json } from '@remix-run/node';
import { authenticate } from '../shopify.server';
export async function loader({ request }) {
  try {
    console.log('request');
    const { admin } = await authenticate.admin(request);
     console.log('request2');
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');

    if (!orderId) {
      return json({ error: 'Missing orderId' }, { status: 400 });
    }

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

    const response = await admin.graphql(query, {
      variables: {
        id: `gid://shopify/Order/${orderId}`,
      }
    });

    const data = await response.json();

    const order = data.data.order;

    const lineItems = order.lineItems.edges.map(({ node }) => ({
      id: node.id,
      title: node.title,
      quantity: node.quantity,
      variant: node.variant ? {
        id: node.variant.id,
        sku: node.variant.sku,
        title: node.variant.title
      } : null
    }));

    return json({
      orderId: order.id,
      name: order.name,
      customer: order.customer,
      lineItems,
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return json({ error: 'Failed to fetch orderfffff' }, { status: 500 });
  }
}
