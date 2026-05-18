const { Resend } = require("resend");

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

console.log('🔥 Mailer loaded: using Resend HTTP API');

async function sendEmail({ to, subject, html }) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`❌ Error sending email: ${error.message}`);
      throw new Error(error.message);
    }

    console.log(`✅ Email sent to ${to}`, data?.id);
    return data;
  } catch (error) {
    console.error(`❌ Error sending email: ${error.message}`);
    throw error;
  }
}
module.exports = { sendEmail };