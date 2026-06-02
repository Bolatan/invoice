import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendInvoiceEmail(to: string, invoiceNumber: string, amount: number) {
  const mailOptions = {
    from: '"Invoicing App" <noreply@example.com>',
    to,
    subject: `Invoice ${invoiceNumber} from Invoicing App`,
    text: `Hello, your invoice ${invoiceNumber} for $${amount} is ready.`,
    html: `<p>Hello, your invoice <b>${invoiceNumber}</b> for <b>$${amount}</b> is ready.</p>`,
  };

  return transporter.sendMail(mailOptions);
}
