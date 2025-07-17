export async function action({ request }) {
    const body = await request.json();
    const { orderId, imageData } = body;
  
    // TODO: Store in database or cloud storage
    console.log(`Received signature for order ${orderId}`);
    console.log(imageData.substring(0, 100)); // preview base64
  
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  