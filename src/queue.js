const Queue = require('bull');
const { sendEmail } = require('./mailer');
const axios = require('axios');

const emailQueue = new Queue('email queue', process.env.REDIS_URL);

// Process all email jobs (verification, password-reset, birthday)
emailQueue.process(async (job) => {
  const { type, to, username, ...rest } = job.data;

  let subject, html;

  switch (type) {
    case 'verification':
      console.log('\n🔐 VERIFICATION TOKEN:', rest.token);
      console.log('📧 Email:', to);
      console.log('👉 Build your link:');
      console.log(`${process.env.APP_BASE_URL}/verify-email?token=${rest.token}&email=${to}\n`);

      const verifyLink = `${process.env.APP_BASE_URL}/verify-email?token=${rest.token}&email=${to}`;
      subject = 'Verify your email';
      html = `<h1>Welcome ${username}!</h1>
              <p>Please verify your email by clicking the link below:</p>
              <a href="${verifyLink}">Verify Email</a>`;
      break;

    case 'password-reset':
      console.log('\n🔑 PASSWORD RESET TOKEN:', rest.token);
      console.log('📧 Email:', to);
      console.log('👉 Build your link:');
      console.log(`${process.env.APP_BASE_URL}/reset-password?token=${rest.token}&email=${to}`);

      const resetLink = `${process.env.APP_BASE_URL}/reset-password?token=${rest.token}&email=${to}`;

      subject = 'Password Reset Request';
      html = `<h1>Password Reset</h1>
              <p>Click the link below to reset your password (expires in 1 hour):</p>
              <a href="${resetLink}">Reset Password</a>`;
      break;

    case 'birthday':
      subject = '🎉 Happy Birthday!';
      html = `<div style="font-family: Arial; padding: 20px; background: #f0f8ff;">
                <h1>Happy Birthday, ${username}!</h1>
                <p>Wishing you a day filled with joy and laughter.</p>
                <p>Enjoy your special day! 🎂🎈</p>
              </div>`;
      break;

    default:
      throw new Error('Unknown email type');
  }

  try {
    await sendEmail({ to, subject, html });
    console.log(`📧 Real email sent to ${to}`);

    // Notify webhook about successful send
    await axios.post(`${process.env.APP_BASE_URL}/webhook/email-status`, {
      email: to,
      type,
      status: 'sent',
      timestamp: new Date().toISOString(),
    });
  }catch (error) {
    console.error('❌ Queue job failed:', error.message);
    // Rethrow so Bull knows the job failed and can retry if attempts remain
    throw error;
  }
});
  

// Helper to add a job
function addEmailJob(type, data) {
  return emailQueue.add({ type, ...data }, {
    attempts: 3,        // retry 3 times
    backoff: 5000,      // wait 5 seconds between retries
  });
}

module.exports = { emailQueue, addEmailJob };