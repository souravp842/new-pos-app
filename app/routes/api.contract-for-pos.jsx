// app/routes/api.contract-details.jsx
import { json } from '@remix-run/node';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // 🔐 Tighten for production
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

export async function loader({ request }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(request.url);
    const skusParam = url.searchParams.get('skus');
    const shop = url.searchParams.get('shop');

    if (!skusParam ) {
      return json({ error: 'Missing skus' }, { status: 400, headers: corsHeaders });
    }

    const skus = skusParam.split(',').map((sku) => sku.trim());

    // ✅ Query the ContractSkuMapping table
    const mappings = await prisma.contractSkuMapping.findMany({
      where: {
        sku: { in: skus },
      },
      include: {
        contract: true,
      },
    });

    return json(mappings, { status: 200, headers: corsHeaders });

  } catch (err) {
    console.error('Contract fetch error:', err);
    return json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
