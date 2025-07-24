import { json } from '@remix-run/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function action({ request }) {
  try {
    const {
      contractId,
      orderId,
      customerName,
      customerEmail,
      shop,
      signatureData,
      ipAddress,
    } = await request.json();

    if (!contractId || !customerName || !shop) {
      return json({ error: 'Missing required data' }, { status: 400 });
    }

    const signed = await prisma.signedContract.create({
      data: {
        contractId,
        orderId,
        customerName,
        customerEmail,
        shop,
        signatureData,
        ipAddress,
      },
    });

    return json({ success: true, id: signed.id });
  } catch (error) {
    console.error('Error saving signed contract:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
}
