const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email provider
  auth: {
    user: process.env.EMAIL_USER, // set in your .env file
    pass: process.env.EMAIL_PASS
  }
});

function sendMail({ to, subject, html }) {
  return transporter.sendMail({
    from: `"Brilliant Consulting" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
}

module.exports = { sendMail };