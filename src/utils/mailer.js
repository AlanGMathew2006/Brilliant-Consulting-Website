const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmail({ to, subject, text, html }) {
  await transporter.sendMail({
    from: `"Brilliant Consulting" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html
  });
}

module.exports = sendEmail;