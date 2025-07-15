import { useState, useEffect } from 'react';
import {
  Page,
  Card,
  DataTable,
  Badge,
  EmptyState,
  Text,
  Button,
  InlineStack,
  Select
} from '@shopify/polaris';

export default function SignaturesIndex() {
  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterContract, setFilterContract] = useState('all');
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    fetchSignatures();
    fetchContracts();
  }, []);

  const fetchSignatures = async () => {
    try {
      // This endpoint will be created in the next step
      const response = await fetch('/api/signatures');
      const data = await response.json();
      setSignatures(data.signatures || []);
    } catch (error) {
      console.error('Error fetching signatures:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/contracts');
      const data = await response.json();
      setContracts(data.contracts || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  const contractOptions = [
    { label: 'All Contracts', value: 'all' },
    ...contracts.map(contract => ({
      label: contract.name,
      value: contract.id.toString()
    }))
  ];

  const filteredSignatures = filterContract === 'all' 
    ? signatures 
    : signatures.filter(sig => sig.contractId.toString() === filterContract);

  const rows = filteredSignatures.map(signature => [
    signature.contract?.name || 'Unknown Contract',
    signature.customerName || 'Anonymous',
    signature.customerEmail || 'No email',
    signature.orderId || 'No order',
    new Date(signature.signedAt).toLocaleDateString(),
    <Badge tone="success">Signed</Badge>
  ]);

  const headings = [
    'Contract',
    'Customer Name',
    'Email',
    'Order ID',
    'Signed Date',
    'Status'
  ];

  return (
    <Page title="Contract Signatures">
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <InlineStack align="space-between">
            <Text variant="headingMd" as="h2">
              All Signatures
            </Text>
            <Select
              label="Filter by contract"
              options={contractOptions}
              value={filterContract}
              onChange={setFilterContract}
            />
          </InlineStack>
        </div>

        {filteredSignatures.length === 0 && !loading ? (
          <EmptyState
            heading="No signatures yet"
            image="https://cdn.shopify.com/s/files/1/0005/4175/0643/files/empty-state.svg"
          >
            <p>When customers sign contracts at checkout, they'll appear here.</p>
          </EmptyState>
        ) : (
          <DataTable
            columnContentTypes={[
              'text',
              'text',
              'text',
              'text',
              'text',
              'text'
            ]}
            headings={headings}
            rows={rows}
            loading={loading}
          />
        )}
      </Card>
    </Page>
  );
}