import React from 'react';

import {
  Text,
  useApi,
  reactExtension,
  POSBlock,
  POSBlockRow,
} from '@shopify/ui-extensions-react/point-of-sale';

const Block = () => {
  const api = useApi();
  
  return (
   
      <POSBlockRow>
        <Text>{'Test contract'}</Text>
        {/* <Text>{`Draft Order ID for this draft order: ${api.draftOrder.id}`}</Text> */}
      </POSBlockRow>
  
  );
};

export default reactExtension('pos.draft-order-details.block.render', () => (
  <Block />
));