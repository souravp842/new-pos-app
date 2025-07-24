import { json } from '@remix-run/node';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../shopify.server';

const prisma = new PrismaClient();

export async function loader({ request }) {
    console.log('calleddddd')
    try {
        const { session } = await authenticate.admin(request);
        const shop = session.shop;

        const signedContracts = await prisma.signedContract.findMany({
            where: { shop },
            orderBy: { signedAt: 'desc' },
        });
   console.log(signedContracts,'skjdfjskjfkdjsgkjdfg')
        return json({ signedContracts });
    } catch (error) {
        console.error('Error fetching signed contracts:', error);
        return json({ error: 'Failed to fetch signed contracts' }, { status: 500 });
    }
}
