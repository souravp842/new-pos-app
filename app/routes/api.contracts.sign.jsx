// routes/api/contracts/sign.jsx or app/api/contracts/sign/route.jsx (depending on framework)

import { prisma } from '@/lib/prisma';

export async function POST(req) {
  const {
    contractIds,
    orderId,
    customerEmail,
    customerName,
    signatureData,
    ipAddress,
    shop,
  } = await req.json();

  await Promise.all(
    contractIds.map((contractId) =>
      prisma.signedContract.create({
        data: {
          contractId,
          orderId,
          customerEmail,
          customerName,
          signatureData,
          ipAddress,
          shop,
        },
      })
    )
  );

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
