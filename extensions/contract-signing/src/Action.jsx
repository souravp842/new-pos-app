import React from "react";

import {
  Text,
  Screen,
  ScrollView,
  Navigator,
  reactExtension,
  useApi,
} from "@shopify/ui-extensions-react/point-of-sale";

const Modal = () => {
  const api = useApi();
  
  return (
    <Navigator>
      <Screen name="CartLineItem" title="Cart Line Item">
        <ScrollView>
        <Text>{`Title for this line item: ${api.cartLineItem.title}`}</Text>
        </ScrollView>
      </Screen>   
    </Navigator>
  );
};

export default reactExtension("pos.customer-details.action.render", () => (
  <Modal />
));