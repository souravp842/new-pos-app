import {
  reactExtension,
  Screen,
  ScrollView,
  Text,
  useApi,
} from '@shopify/ui-extensions-react/point-of-sale';
import React, { useEffect, useState } from 'react';

export default reactExtension('pos.purchase.post.action.render', () => <OrderDetailsScreen />);

function OrderDetailsScreen() {
  const api = useApi();
  const [orderData, setOrderData] = useState(null);
   const [orderData1, setOrderData1] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      if (!api?.order?.id || !api?.session?.currentSession?.shopDomain) return;

      try {
        const res = await fetch(`/api/full-order?orderId=${api.order.id}&shop=${api.session.currentSession.shopDomain}`);
        const data = await res.json();
       setOrderData(data);
       console.log('jhdjhsdfgdfg')
       setLoading(false);
      } catch (err) {
        console.error('Error fetching order:', err);
         setOrderData(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

     setOrderData1("Testing data2");

    fetchOrder();
  }, []);

  if (loading) {
    return (
      <Screen name="Loading" title="Loading">
        <ScrollView padding>
          <Text>Loading order details...</Text>
        </ScrollView>
      </Screen>
    );
  }

 return (
<Screen name="Order Details" title="Order Details">
  <ScrollView padding>
    <Text size="medium">🧾 Line Itemsssss: {api.order.id}</Text>
     <Text size="medium">fhfghfghf {orderData?.name} :: {orderData?.orderId} :  {orderData1}</Text>
         <Text size="medium" emphasis="bold">📦 Line Items:</Text>

    {orderData?.lineItems?.map((item) => (
      <Text key={item.id}>
        • {item.title} | SKU: {item.variant?.sku || 'N/A'} | Qty: {item.quantity}
      </Text>
    ))}
  </ScrollView>
</Screen> 
);

}
