// routes/api/contracts/sign.ts

import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const {
    contractIds,
    orderId,
    customerEmail,
    customerName,
    signatureData,
    ipAddress,
    shop,
  } = await req.json();

  await Promise.all(contractIds.map((contractId) =>
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
  ));

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
