import { useNavigate } from '@remix-run/react';
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  InlineStack,
  BlockStack,
  Box,
  Badge
} from '@shopify/polaris';
import { ContractIcon, PlusIcon } from '@shopify/polaris-icons';
import { useState, useEffect } from 'react';

export default function AppIndex() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalContracts: 0,
    activeContracts: 0,
    totalSignatures: 0,
    recentSignatures: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/contracts');
      const data = await response.json();
      
      if (data.contracts) {
        const contracts = data.contracts;
        const totalContracts = contracts.length;
        const activeContracts = contracts.filter(c => c.isActive).length;
        const totalSignatures = contracts.reduce((sum, c) => sum + (c._count?.signedContracts || 0), 0);
        
        setStats({
          totalContracts,
          activeContracts,
          totalSignatures,
          recentSignatures: 0 // You can implement this based on date filtering
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <Page
      title="Contract Signing App"
      subtitle="Manage contracts for your Shopify POS system"
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Welcome to Contract Signing
              </Text>
              <Text variant="bodyMd" color="subdued">
                This app allows you to create contracts that customers can sign directly at checkout using your Shopify POS system. 
                Link contracts to specific SKUs to automatically display them when those products are purchased.
              </Text>
              
              <InlineStack gap="200">
                <Button
                  variant="primary"
                  icon={PlusIcon}
                  onClick={() => navigate('/app/contracts/new')}
                >
                  Create Contract
                </Button>
                <Button
                  icon={ContractIcon}
                  onClick={() => navigate('/app/contracts')}
                >
                  View All Contracts
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Layout>
            <Layout.Section oneThird>
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">Total Contracts</Text>
                  <Text variant="heading2xl" as="p" fontWeight="bold">
                    {stats.totalContracts}
                  </Text>
                  <Badge tone="info">All contracts created</Badge>
                </BlockStack>
              </Card>
            </Layout.Section>

            <Layout.Section oneThird>
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">Active Contracts</Text>
                  <Text variant="heading2xl" as="p" fontWeight="bold">
                    {stats.activeContracts}
                  </Text>
                  <Badge tone="success">Ready for POS</Badge>
                </BlockStack>
              </Card>
            </Layout.Section>

            <Layout.Section oneThird>
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">Total Signatures</Text>
                  <Text variant="heading2xl" as="p" fontWeight="bold">
                    {stats.totalSignatures}
                  </Text>
                  <Badge tone="attention">Contracts signed</Badge>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Quick Setup Guide
              </Text>
              <BlockStack gap="300">
                <Box>
                  <Text variant="bodyMd" fontWeight="semibold">
                    1. Create a Contract
                  </Text>
                  <Text variant="bodyMd" color="subdued">
                    Write your contract terms and conditions that customers need to agree to.
                  </Text>
                </Box>
                <Box>
                  <Text variant="bodyMd" fontWeight="semibold">
                    2. Link to SKUs
                  </Text>
                  <Text variant="bodyMd" color="subdued">
                    Select which products or variants should trigger the contract signing process.
                  </Text>
                </Box>
                <Box>
                  <Text variant="bodyMd" fontWeight="semibold">
                    3. Install POS Extension (Coming Soon)
                  </Text>
                  <Text variant="bodyMd" color="subdued">
                    The contract will automatically appear on your POS when customers purchase linked products.
                  </Text>
                </Box>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}