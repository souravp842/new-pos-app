// app/routes/app.contracts._index.jsx
import { useState, useEffect } from 'react';
import { useLoaderData, useNavigate } from '@remix-run/react';
import {
  Page,
  Card,
  DataTable,
  Button,
  Badge,
  EmptyState,
  Text,
  Box,
  InlineStack,
  BlockStack
} from '@shopify/polaris';
import { PlusIcon } from '@shopify/polaris-icons';

export default function ContractsIndex() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/contracts');
      const data = await response.json();
      setContracts(data.contracts || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this contract?')) {
      try {
        await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
        fetchContracts();
      } catch (error) {
        console.error('Error deleting contract:', error);
      }
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      const contract = contracts.find(c => c.id === id);
      const response = await fetch(`/api/contracts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contract,
          isActive: !currentStatus
        })
      });
      
      if (response.ok) {
        fetchContracts();
      }
    } catch (error) {
      console.error('Error updating contract:', error);
    }
  };

  const rows = contracts.map(contract => [
    contract.name,
    <Text variant="bodyMd" color="subdued">
      {contract.content.substring(0, 100)}...
    </Text>,
    contract.skuMappings.length,
    contract._count?.signedContracts || 0,
    <Badge tone={contract.isActive ? 'success' : 'warning'}>
      {contract.isActive ? 'Active' : 'Inactive'}
    </Badge>,
    <InlineStack gap="200">
      <Button
        size="micro"
        onClick={() => navigate(`/app/contracts/${contract.id}`)}
      >
        Edit
      </Button>
      <Button
        size="micro"
        tone={contract.isActive ? 'critical' : 'success'}
        onClick={() => toggleActive(contract.id, contract.isActive)}
      >
        {contract.isActive ? 'Deactivate' : 'Activate'}
      </Button>
      <Button
        size="micro"
        tone="critical"
        onClick={() => handleDelete(contract.id)}
      >
        Delete
      </Button>
    </InlineStack>
  ]);

  const headings = [
    'Name',
    'Content Preview',
    'SKUs',
    'Signatures',
    'Status',
    'Actions'
  ];

  return (
    <Page
      title="Contracts"
      primaryAction={{
        content: 'Create Contract',
        icon: PlusIcon,
        onAction: () => navigate('/app/contracts/new')
      }}
    >
      <Card>
        {contracts.length === 0 && !loading ? (
          <EmptyState
            heading="Create your first contract"
            action={{
              content: 'Create Contract',
              onAction: () => navigate('/app/contracts/new')
            }}
            image="https://cdn.shopify.com/s/files/1/0005/4175/0643/files/empty-state.svg"
          >
            <p>Start by creating a contract that customers can sign at checkout.</p>
          </EmptyState>
        ) : (
          <DataTable
            columnContentTypes={[
              'text',
              'text',
              'numeric',
              'numeric',
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