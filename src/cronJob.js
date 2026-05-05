// src/cronJob.js
const cron = require('node-cron');
const { pool } = require('./db');
const { addEmailJob } = require('./queue');

function startCronJob() {
  cron.schedule('0 7 * * *', async () => {
    console.log('⏰ Running birthday check...');
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const monthDay = `${month}-${day}`; // e.g., "08-17"

    try {
      const result = await pool.query(
        `SELECT username, email FROM users
         WHERE to_char(date_of_birth, 'MM-DD') = $1 AND is_verified = TRUE`,
        [monthDay]
      );

      const celebrants = result.rows;
      if (celebrants.length === 0) {
        console.log('No birthdays today.');
        return;
      }

      console.log(`Found ${celebrants.length} birthday(s). Adding to queue...`);
      for (const user of celebrants) {
        await addEmailJob('birthday', {
          to: user.email,
          username: user.username,
        });
      }
    } catch (err) {
      console.error('Error in birthday check:', err);
    }
  }, {
    scheduled: true,
    timezone: 'America/New_York'  // set your own timezone
  });

  console.log('⏱️ Cron job scheduled (daily at 7am).');
}

module.exports = { startCronJob };