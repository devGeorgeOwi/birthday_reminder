// src/mailer.js
// MOCK – logs emails to console instead of sending.
// Replace with real Brevo/SendGrid/Nodemailer transporter later.
async function sendEmail({ to, subject, html }) {
  console.log('────────── MOCK EMAIL ──────────');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`HTML: ${html.substring(0, 200)}...`);
  console.log('────────────────────────────────');
  return { messageId: 'mock-msg-id' };
}

module.exports = { sendEmail };