import { json } from '@remix-run/node';

export async function action({ request }) {
  try {
    // Parse JSON body (POST request)
    const data = await request.json();

    console.log('Received data:', data);

    return json({ message: 'Data received' });
  } catch (error) {
    console.error('Error processing data:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
