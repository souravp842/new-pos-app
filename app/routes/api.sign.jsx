// app/routes/api/sign.jsx

export async function loader() {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Signature Pad</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: sans-serif; padding: 20px; }
          canvas { border: 2px solid black; touch-action: none; }
          button { margin-right: 10px; }
        </style>
      </head>
      <body>
        <h2>Sign Below</h2>
        <canvas id="canvas" width="400" height="200"></canvas>
        <div style="margin-top: 10px;">
          <button id="clear">Clear</button>
          <button id="download">Download PNG</button>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/signature_pad@4.1.6/dist/signature_pad.umd.min.js"></script>
        <script>
          const canvas = document.getElementById('canvas');
          const signaturePad = new SignaturePad(canvas);

          document.getElementById('clear').addEventListener('click', () => {
            signaturePad.clear();
          });

          document.getElementById('download').addEventListener('click', () => {
            if (signaturePad.isEmpty()) {
              alert('Please provide a signature first.');
              return;
            }

            const dataUrl = signaturePad.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = 'signature.png';
            a.click();
          });
        </script>
      </body>
    </html>
  `;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*', // ✅ Allow dev access
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}

// Optional OPTIONS handler
export async function action({ request }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json',
      },
    });
  }

  return new Response('Method Not Allowed', { status: 405 });
}
