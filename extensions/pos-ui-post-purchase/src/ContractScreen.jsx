import React from 'react';
import { Text, Screen, ScrollView } from '@shopify/ui-extensions-react/point-of-sale';

const ContractScreen = () => {
  return (
    <Screen name="ContractScreen" title="Customer Contract">
      <ScrollView>
        <Text appearance="headingLg" emphasis="bold">
          📄 Contract Title
        </Text>
        <Text>
          This agreement confirms that the customer has acknowledged the terms and conditions for the purchased product or service.
        </Text>
      </ScrollView>
    </Screen>
  );
};

export default ContractScreen;
