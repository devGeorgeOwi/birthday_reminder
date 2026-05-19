const axios = require('axios');

console.log('🔥 Mailer loaded: using Brevo HTTP API');

async function sendEmail({ to, subject, text, html }) {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.EMAIL_FROM;

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: 'Birthday Reminder', email: from.match(/<(.+)>/)?.[1] || from },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html,
      },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Email sent to ${to}`, response.data.messageId);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error(`❌ Brevo API error: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

module.exports = { sendEmail };