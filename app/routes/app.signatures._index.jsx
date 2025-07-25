import { useState, useEffect } from 'react';
import {
  Page,
  Card,
  DataTable,
  Badge,
  EmptyState,
  Text,
  Select,
  InlineStack
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
    console.log('Fetching signatures...');
    try {
      const response = await fetch('/api/signature');
      const data = await response.json();
      console.log('Fetched signature data:', data);

      if (Array.isArray(data)) {
        setSignatures(data);
      } else if (Array.isArray(data.signedContracts)) {
        setSignatures(data.signedContracts);
      } else {
        console.warn('Expected array but got:', data);
        setSignatures([]);
      }
    } catch (error) {
      console.error('Error fetching signatures:', error);
      setSignatures([]);
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
      value: contract.id.toString(),
    })),
  ];

  // Filter signatures based on selected contract
  const filteredSignatures =
    filterContract === 'all'
      ? signatures
      : signatures.filter(
          signature => signature.contractId.toString() === filterContract
        );

  const rows = filteredSignatures.map(signature => {
    const contract = contracts.find(c => c.id === signature.contractId);
    return [
      contract ? contract.name : 'Unknown Contract',
      signature.customerName || 'Anonymous',
      signature.customerEmail || 'No email',
      signature.orderId || 'No order',
      new Date(signature.signedAt).toLocaleDateString(),
      <Badge tone={signature.signatureData === 'Yes I Agree' ? 'success' : 'critical'}>
        {signature.signatureData}
      </Badge>,
    ];
  });

  const headings = [
    'Contract',
    'Customer Name',
    'Email',
    'Order ID',
    'Signed Date',
    'Status',
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
            columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
            headings={headings}
            rows={rows}
            loading={loading}
          />
        )}
      </Card>
    </Page>
  );
}
