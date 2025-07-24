import { json } from '@remix-run/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

export async function loader({ request }) {
  console.log('API Called with method:', request.method);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(request.url);
   // console.log(url);
    const orderId = url.searchParams.get('orderId');
    const shop = url.searchParams.get('shop');
    const signatureData = url.searchParams.get('signatureData');
    const payload = url.searchParams.get('orderData');
    const contractParam = url.searchParams.get('contract');

    let contractId = null;
    let customerName = null;
    let customerEmail = null;
    let contractName = null;
    let ContractContent = null;

    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('cf-connecting-ip') ||
      '';

    // Parse order payload
    let parsedOrder;
    try {
      parsedOrder = JSON.parse(decodeURIComponent(payload));
      customerName = parsedOrder?.customer?.firstName;
      customerEmail = parsedOrder?.customer?.email;
    } catch (err) {
      return json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Parse contract
    if (contractParam) {
      try {
        const contract = JSON.parse(decodeURIComponent(contractParam));
        contractId = contract.id;
        contractName = contract.name;
        ContractContent = contract.content;
      } catch (error) {
        console.error('Contract parse error:', error);
      }
    }

    if (!contractId || !customerName || !shop) {
      return json(
        { error: 'Missing required data' },
        { status: 400, headers: corsHeaders }
      );
    }

    // ✅ Save to DB
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

    // ✅ Generate PDF
    const PDFDocument = (await import('pdfkit')).default;
    const { Readable } = await import('stream');
    const buffers = [];
    const doc = new PDFDocument();

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);

      // ✅ Send email with PDF
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: customerEmail, // or customerEmail
          subject: `Contract signed by ${customerName}`,
          html: `
            <p>A new contract has been signed:</p>
            <ul>
              <li><strong>Name:</strong> ${customerName}</li>
              <li><strong>Email:</strong> ${customerEmail}</li>
            </ul>
          `,
          attachments: [
            {
              filename: 'contract-summary.pdf',
              content: pdfBuffer,
            },
          ],
        });
      } catch (err) {
        console.error('Failed to send email:', err);
      }
    });

    // ✅ Write content to PDF
    doc.fontSize(18).text('Signed Contract Summary', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${customerName}`);
    doc.text(`Email: ${customerEmail}`);
    doc.text(`Contract Name: ${contractName}`);
    doc.text(`Contract Content: ${ContractContent}`);
    doc.end(); // 🚀 This will trigger the "end" event

    return json({ success: true, id: signed.id }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error saving signed contract:', error);
    return json({ error: 'Server error' }, { status: 500, headers: corsHeaders });
  }
}

export const action = loader;
