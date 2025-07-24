import {
  reactExtension,
  Screen,
  ScrollView,
  Text,
  useApi,
  Button,
  RadioButtonList,
} from '@shopify/ui-extensions-react/point-of-sale';
import React, { useEffect, useState, useRef } from 'react';

export default reactExtension('pos.purchase.post.action.render', () => <OrderDetailsScreen />);

function OrderDetailsScreen() {
  const api = useApi();

  const [orderData, setOrderData] = useState(null);
  const [contractData, setContractData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('Yes I Agree');

  const isSubmittingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  async function handleSubmit(contract) {
    if (isSubmittingRef.current) {
      console.warn('Duplicate submission prevented');
      return;
    }

    isSubmittingRef.current = true;

    if (!contract) {
      api.toast.show('Contract not available.');
      isSubmittingRef.current = false;
      return;
    }

    try {
      console.log('Submitting contract...');
      const response = await fetch(
        `/api/save-signed-contract?orderId=${api.order.id}&shop=${api.session.currentSession.shopDomain}&orderData=${encodeURIComponent(
          JSON.stringify(orderData)
        )}&contract=${encodeURIComponent(
          JSON.stringify(contract)
        )}&signatureData=${selected}`
      );

      const result = await response.json();
      console.log('Submission response:', result);
      api.toast.show('Contract saved!!!');
    } catch (err) {
      console.error('Error submitting contract:', err);
      api.toast.show('Failed to save contract.');
    } finally {
      isSubmittingRef.current = false;
    }
  }

  useEffect(() => {
    async function fetchOrderAndContracts() {
      if (hasFetchedRef.current) {
        console.log('Prevented double fetch');
        return;
      }

      hasFetchedRef.current = true;

      if (!api?.order?.id || !api?.session?.currentSession?.shopDomain) return;

      try {
        const orderRes = await fetch(
          `/api/full-order?orderId=${api.order.id}&shop=${api.session.currentSession.shopDomain}`
        );
        const order = await orderRes.json();
        console.log('Parsed order payload:', order);
        setOrderData(order);

        const skus = order.lineItems.map((item) => item.variant?.sku).filter(Boolean);
        const uniqueSkus = [...new Set(skus)];
        if (uniqueSkus.length === 0) return;

        const contractRes = await fetch(`/api/contract-for-pos?skus=${uniqueSkus.join(',')}`);
        const contractMappings = await contractRes.json();

        const contractMap = {};
        for (const mapping of contractMappings) {
          contractMap[mapping.sku] = mapping.contract;
        }

        console.log('Received contract object:', contractMap);
        setContractData(contractMap);
      } catch (err) {
        console.error('Error fetching order/contract:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrderAndContracts();
  }, []);

  if (loading) {
    return (
      <Screen name="Loading" title="Loading">
        <ScrollView padding>
          <Text>Loading order and contract details...</Text>
        </ScrollView>
      </Screen>
    );
  }

  // 🛑 Use only the FIRST item with a contract (even if duplicates exist)
  const itemWithContract = orderData?.lineItems?.find(
    (item) => contractData[item.variant?.sku]
  );

  const contract = itemWithContract ? contractData[itemWithContract.variant?.sku] : null;

  return (
    <Screen name="Order Details" title="Order Details">
      <ScrollView padding>
        {itemWithContract && contract ? (
          <>
            <Text emphasis="bold">📄 Contract Name:</Text>
            <Text>{contract.name}</Text>

            <Text emphasis="bold">📜 Contract Content:</Text>
            <Text>{contract.content}</Text>

            <RadioButtonList
              items={['Yes I Agree', `No , I don't`]}
              onItemSelected={setSelected}
              initialSelectedItem={selected}
            />

            {orderData?.customer ? (
              <Button title="Submit" onPress={() => handleSubmit(contract)} />
            ) : (
              <Text style={{ color: 'red', marginTop: 10 }}>
                ⚠️ You must be logged in as a customer to submit this contract.
              </Text>
            )}
          </>
        ) : (
          <Text>No contract found for any item in this order.</Text>
        )}
      </ScrollView>
    </Screen>
  );
}
