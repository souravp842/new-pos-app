// api/contracts/by-skus.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { skus } = req.body;
    
    if (!skus || !Array.isArray(skus)) {
      return res.status(400).json({ message: 'SKUs array is required' });
    }

    // Get shop from session or request headers
    const shop = req.headers['x-shopify-shop-domain'] || req.session?.shop;
    
    if (!shop) {
      return res.status(401).json({ message: 'Shop not found' });
    }

    // Find active contracts that match any of the SKUs
    const contracts = await prisma.contract.findMany({
      where: {
        shop,
        isActive: true,
        skuMappings: {
          some: {
            sku: {
              in: skus
            }
          }
        }
      },
      include: {
        skuMappings: {
          where: {
            sku: {
              in: skus
            }
          }
        },
        signedContracts: {
          where: {
            customerEmail: req.body.customerEmail || undefined,
            // Only check recent signatures (last 24 hours)
            signedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          },
          orderBy: {
            signedAt: 'desc'
          },
          take: 1
        }
      }
    });

    res.status(200).json({ contracts });
  } catch (error) {
    console.error('Error fetching contracts by SKUs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// api/contracts/sign.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      contractId,
      customerName,
      customerEmail,
      signatureData,
      orderId,
      ipAddress
    } = req.body;

    // Validate required fields
    if (!contractId || !customerName || !signatureData) {
      return res.status(400).json({ 
        message: 'Contract ID, customer name, and signature are required' 
      });
    }

    // Get shop from session or request headers
    const shop = req.headers['x-shopify-shop-domain'] || req.session?.shop;
    
    if (!shop) {
      return res.status(401).json({ message: 'Shop not found' });
    }

    // Verify contract exists and is active
    const contract = await prisma.contract.findFirst({
      where: {
        id: contractId,
        shop,
        isActive: true
      }
    });

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found or inactive' });
    }

    // Check if customer has already signed this contract recently (last 24 hours)
    const existingSignature = await prisma.signedContract.findFirst({
      where: {
        contractId,
        customerEmail: customerEmail || undefined,
        customerName,
        signedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    if (existingSignature) {
      return res.status(400).json({ 
        message: 'Contract already signed recently' 
      });
    }

    // Create signed contract record
    const signedContract = await prisma.signedContract.create({
      data: {
        contractId,
        customerName,
        customerEmail,
        signatureData,
        orderId,
        ipAddress,
        shop
      }
    });

    res.status(201).json({ 
      message: 'Contract signed successfully',
      signedContract: {
        id: signedContract.id,
        contractId: signedContract.contractId,
        customerName: signedContract.customerName,
        signedAt: signedContract.signedAt
      }
    });

  } catch (error) {
    console.error('Error signing contract:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// api/contracts/check-signed.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { contractId, customerEmail, customerName } = req.body;

    if (!contractId) {
      return res.status(400).json({ message: 'Contract ID is required' });
    }

    // Get shop from session or request headers
    const shop = req.headers['x-shopify-shop-domain'] || req.session?.shop;
    
    if (!shop) {
      return res.status(401).json({ message: 'Shop not found' });
    }

    // Check if contract is signed
    const whereClause = {
      contractId,
      shop
    };

    if (customerEmail) {
      whereClause.customerEmail = customerEmail;
    }
    
    if (customerName) {
      whereClause.customerName = customerName;
    }

    const signedContract = await prisma.signedContract.findFirst({
      where: whereClause,
      orderBy: {
        signedAt: 'desc'
      }
    });

    res.status(200).json({
      isSigned: !!signedContract,
      signedContract: signedContract ? {
        id: signedContract.id,
        signedAt: signedContract.signedAt,
        customerName: signedContract.customerName
      } : null
    });

  } catch (error) {
    console.error('Error checking signed contract:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// api/contracts/update-order.js
// This endpoint can be called after order is created to update signed contracts with order ID
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { orderId, customerEmail, customerName } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Get shop from session or request headers
    const shop = req.headers['x-shopify-shop-domain'] || req.session?.shop;
    
    if (!shop) {
      return res.status(401).json({ message: 'Shop not found' });
    }

    // Update signed contracts from the last hour that match customer info
    const whereClause = {
      shop,
      orderId: null,
      signedAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
      }
    };

    if (customerEmail) {
      whereClause.customerEmail = customerEmail;
    }
    
    if (customerName) {
      whereClause.customerName = customerName;
    }

    const updatedContracts = await prisma.signedContract.updateMany({
      where: whereClause,
      data: {
        orderId
      }
    });

    res.status(200).json({
      message: 'Order ID updated successfully',
      updatedCount: updatedContracts.count
    });

  } catch (error) {
    console.error('Error updating order ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Utility function to get contracts for specific SKUs (can be used in other parts of your app)
export async function getContractsForSkus(skus, shop) {
  const contracts = await prisma.contract.findMany({
    where: {
      shop,
      isActive: true,
      skuMappings: {
        some: {
          sku: {
            in: skus
          }
        }
      }
    },
    include: {
      skuMappings: {
        where: {
          sku: {
            in: skus
          }
        }
      }
    }
  });

  return contracts;
}

// Utility function to check if all required contracts are signed
export async function areAllContractsSigned(skus, shop, customerEmail, customerName) {
  const contracts = await getContractsForSkus(skus, shop);
  
  for (const contract of contracts) {
    const whereClause = {
      contractId: contract.id,
      shop
    };

    if (customerEmail) {
      whereClause.customerEmail = customerEmail;
    }
    
    if (customerName) {
      whereClause.customerName = customerName;
    }

    const signedContract = await prisma.signedContract.findFirst({
      where: whereClause,
      orderBy: {
        signedAt: 'desc'
      }
    });

    if (!signedContract) {
      return false;
    }
  }

  return true;
}