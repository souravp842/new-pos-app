import { Form, useActionData } from '@remix-run/react';
import { json } from '@remix-run/node';

export const action = async ({ request }) => {
  const nodemailer = await import('nodemailer');
  const PDFDocument = (await import('pdfkit')).default;
  const { Readable } = await import('stream');

  const formData = await request.formData();
  const name = formData.get('name');
  const email = formData.get('email');
  const message = formData.get('message');

  // ✅ Generate the PDF in-memory
  const doc = new PDFDocument();
  const buffers = [];

  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', async () => {
    const pdfBuffer = Buffer.concat(buffers);

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
        to: 'tester1.kaswebtechsolutions@gmail.com',
        subject: `New contact from ${name}`,
        html: `
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong> ${message}</p>
        `,
        attachments: [
          {
            filename: 'contact-summary.pdf',
            content: pdfBuffer,
          },
        ],
      });
    } catch (error) {
      console.error('Email sending error:', error);
    }
  });

  doc.fontSize(18).text('Contact Submission', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Name: ${name}`);
  doc.text(`Email: ${email}`);
  doc.text(`Message: ${message}`);
  doc.end();

  return json({ success: true });
};

export default function Contact() {
  const actionData = useActionData();

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
      <h1>Contact Us</h1>

      {actionData?.success && (
        <p style={{ color: 'green' }}>Your message has been sent successfully!</p>
      )}
      {actionData?.error && (
        <p style={{ color: 'red' }}>{actionData.error}</p>
      )}

      <Form method="post">
        <div>
          <label>
            Name:
            <input type="text" name="name" required />
          </label>
        </div>

        <div>
          <label>
            Email:
            <input type="email" name="email" required />
          </label>
        </div>

        <div>
          <label>
            Message:
            <textarea name="message" required />
          </label>
        </div>

        <button type="submit" style={{ marginTop: '1rem' }}>Send</button>
      </Form>
    </div>
  );
}
