import {
  reactExtension,
  Text,
  TextField,
  Button,
  ScrollView,
  Screen,
  useApi,
} from '@shopify/ui-extensions-react/point-of-sale';
import React, { useEffect, useState } from 'react';

export default reactExtension('pos.purchase.post.action.render', () => <ContractScreen />);

function ContractScreen() {
  const api = useApi();

  const [contract, setContract] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [skus, setSkus] = useState([]);

  // 1. Get SKUs from backend via order ID
  useEffect(() => {
    async function fetchOrderSkus() {
      if (!api?.order?.id) return;

      try {
        const res = await fetch(`/api/full-order?orderId=${api.order.id}&shop=${api.shop}`);
        const data = await res.json();

        const extractedSkus = (data?.lineItems || [])
          .map((item) => item?.variant?.sku)
          .filter(Boolean);

        setSkus(extractedSkus);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch order details:', err);
        setLoading(false);
      }
    }

    fetchOrderSkus();
  }, [api?.order?.id]);

  // 2. Fetch matching contract based on SKUs
  useEffect(() => {
    if (skus.length === 0) return;

    fetch('/api/contract-by-skus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skus, shop: api.shop }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.contract) {
          setContract(data.contract);
        } else {
          setContract(null);
        }
      })
      .catch((err) => {
        console.error('Error fetching contract:', err);
        setContract(null);
      });
  }, [skus]);

  // 3. Handle contract submission
  const handleSubmit = async () => {
    if (!customerName || !contract) return;

    setSubmitting(true);

    try {
      const res = await fetch('/api/save-signed-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: contract.id,
          orderId: api.order.id,
          customerName,
          customerEmail: api?.order?.customer?.email || '',
          signatureData: `Name: ${customerName}`, // If using typed name instead of drawing
          ipAddress: '', // Optional
          shop: api.shop,
        }),
      });

      if (res.ok) {
        api.done(); // Close extension on success
      } else {
        console.error('Failed to save signed contract');
      }
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // 4. UI Logic

  if (loading) {
    return (
      <Screen name="Contract" title="Loading">
        <ScrollView padding>
          <Text>Fetching order details...</Text>
        </ScrollView>
      </Screen>
    );
  }

  if (!contract) {
    return (
      <Screen name="Contract" title="Contract">
        <ScrollView padding>
          <Text>No contract required for this purchase.</Text>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen name="Contract" title="Customer Agreement">
      <ScrollView padding>
        <Text size="large">{contract.name}</Text>
        <Text>{contract.content}</Text>

        <TextField
          label="Customer Name"
          value={customerName}
          onChange={(val) => setCustomerName(val)}
          disabled={submitting}
        />

        <Button disabled={!customerName || submitting} onPress={handleSubmit}>
          {submitting ? 'Submitting...' : 'Accept & Submit'}
        </Button>
      </ScrollView>
    </Screen>
  );
}
