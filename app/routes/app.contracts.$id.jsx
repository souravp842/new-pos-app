// app/routes/app.contracts.$id.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@remix-run/react';
import {
  Page,
  Card,
  FormLayout,
  TextField,
  Button,
  Select,
  ResourceList,
  ResourceItem,
  Text,
  InlineStack,
  BlockStack,
  Box,
  Badge,
  Autocomplete,
  Tag,
  Checkbox
} from '@shopify/polaris';
import { DeleteIcon } from '@shopify/polaris-icons';

export default function EditContract() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    isActive: true
  });
  const [selectedSkus, setSelectedSkus] = useState([]);
  const [products, setProducts] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchContract();
    fetchProducts();
  }, [id]);

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/contracts/${id}`);
      const data = await response.json();
      
      if (data.contract) {
        setFormData({
          name: data.contract.name,
          content: data.contract.content,
          isActive: data.contract.isActive
        });
        
        // Convert SKU mappings to the format expected by the UI
        const skuMappings = data.contract.skuMappings.map(mapping => ({
          sku: mapping.sku,
          productId: mapping.productId,
          variantId: mapping.variantId,
          // We'll need to fetch product details to get titles
          productTitle: 'Loading...',
          variantTitle: 'Loading...'
        }));
        
        setSelectedSkus(skuMappings);
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchProducts = async (search = '') => {
    try {
      const response = await fetch(`/api/products?search=${search}&limit=50`);
      const data = await response.json();
      setProducts(data.products || []);
      
      // Create options for autocomplete
      const options = [];
      data.products?.forEach(product => {
        product.variants.forEach(variant => {
          if (variant.sku) {
            options.push({
              value: `${variant.id}`,
              label: `${product.title} - ${variant.title} (SKU: ${variant.sku})`,
              sku: variant.sku,
              productId: product.id,
              variantId: variant.id,
              productTitle: product.title,
              variantTitle: variant.title
            });
          }
        });
      });
      setProductOptions(options);
      
      // Update selected SKUs with product titles
      setSelectedSkus(prev => prev.map(selectedSku => {
        const option = options.find(opt => opt.variantId === selectedSku.variantId);
        if (option) {
          return {
            ...selectedSku,
            productTitle: option.productTitle,
            variantTitle: option.variantTitle
          };
        }
        return selectedSku;
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkuAdd = (selected) => {
    const option = productOptions.find(opt => opt.value === selected[0]);
    if (option && !selectedSkus.find(sku => sku.variantId === option.variantId)) {
      setSelectedSkus(prev => [...prev, option]);
    }
    setSelectedOptions([]);
    setInputValue('');
  };

  const handleSkuRemove = (variantId) => {
    setSelectedSkus(prev => prev.filter(sku => sku.variantId !== variantId));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.content) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/contracts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          skus: selectedSkus.map(sku => ({
            sku: sku.sku,
            productId: sku.productId,
            variantId: sku.variantId
          }))
        })
      });

      if (response.ok) {
        navigate('/app/contracts');
      } else {
        alert('Error updating contract');
      }
    } catch (error) {
      console.error('Error updating contract:', error);
      alert('Error updating contract');
    } finally {
      setLoading(false);
    }
  };

  const filteredOptions = productOptions.filter(option =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  if (initialLoading) {
    return (
      <Page title="Loading...">
        <Card>
          <Box padding="400">
            <Text>Loading contract...</Text>
          </Box>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title="Edit Contract"
      backAction={{
        content: 'Contracts',
        onAction: () => navigate('/app/contracts')
      }}
    >
      <Card>
        <FormLayout>
          <TextField
            label="Contract Name"
            value={formData.name}
            onChange={(value) => handleInputChange('name', value)}
            placeholder="Enter contract name"
            requiredIndicator
          />

          <TextField
            label="Contract Content"
            value={formData.content}
            onChange={(value) => handleInputChange('content', value)}
            multiline={8}
            placeholder="Enter the contract text that customers will sign..."
            requiredIndicator
          />

          <Checkbox
            label="Contract is active"
            checked={formData.isActive}
            onChange={(value) => handleInputChange('isActive', value)}
            helpText="Inactive contracts will not appear at checkout"
          />

          <Box>
            <Text variant="headingMd" as="h3">Link to SKUs</Text>
            <Box paddingBlockStart="200">
              <Autocomplete
                options={filteredOptions}
                selected={selectedOptions}
                onSelect={handleSkuAdd}
                 textField={
                <Autocomplete.TextField
                  label="Search products and variants"
                  value={inputValue}
                  onChange={setInputValue}
                  placeholder="Type to search products..."
                />
              }



              />
            </Box>
          </Box>

          {selectedSkus.length > 0 && (
            <Box>
              <Text variant="headingMd" as="h3">Selected SKUs</Text>
              <Box paddingBlockStart="200">
                <BlockStack gap="200">
                  {selectedSkus.map(sku => (
                    <Box key={sku.variantId} padding="200" background="bg-surface-secondary">
                      <InlineStack align="space-between">
                        <BlockStack gap="100">
                          <Text variant="bodyMd" fontWeight="semibold">
                            {sku.productTitle} - {sku.variantTitle}
                          </Text>
                          <Badge>SKU: {sku.sku}</Badge>
                        </BlockStack>
                        <Button
                          icon={DeleteIcon}
                          variant="plain"
                          tone="critical"
                          onClick={() => handleSkuRemove(sku.variantId)}
                        />
                      </InlineStack>
                    </Box>
                  ))}
                </BlockStack>
              </Box>
            </Box>
          )}

          <InlineStack align="end" gap="200">
            <Button onClick={() => navigate('/app/contracts')}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
            >
              Update Contract
            </Button>
          </InlineStack>
        </FormLayout>
      </Card>
    </Page>
  );
}