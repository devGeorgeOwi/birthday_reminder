const https = require('https');

console.log('🔥 Mailer loaded: using Keplars REST API');

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.KEPLARS_API_KEY;
  const from = process.env.EMAIL_FROM;

  const payload = JSON.stringify({
    from: from,
    to: to,
    subject: subject,
    html: html,
  });

  const options = {
    hostname: 'api.keplars.com',
    port: 443,
    path: '/api/v1/send-email/instant', // 0-5 sec delivery
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ Email sent to ${to}`, JSON.parse(data));
          resolve(JSON.parse(data));
        } else {
          console.error(`❌ Keplars API error (${res.statusCode}): ${data}`);
          reject(new Error(`Keplars API error: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Network error sending to ${to}: ${error.message}`);
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

module.exports = { sendEmail };