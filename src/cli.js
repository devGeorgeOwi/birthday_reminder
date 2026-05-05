#!/usr/bin/env node
require('dotenv').config();
const { Command } = require('commander');
const { pool } = require('./db');
const program = new Command();

program
  .name('birthday-cli')
  .description('CLI to add a birthday user');

program
  .command('add')
  .description('Add a new user')
  .requiredOption('-u, --username <name>', 'username')
  .requiredOption('-e, --email <email>', 'email')
  .requiredOption('-d, --dob <date>', 'date of birth (YYYY-MM-DD)')
  .action(async (options) => {
    try {
      // Note: CLI adds user without password – you can extend to accept one
      await pool.query(
        'INSERT INTO users (username, email, date_of_birth) VALUES ($1, $2, $3)',
        [options.username, options.email, options.dob]
      );
      console.log(`✅ User ${options.username} added.`);
    } catch (err) {
      console.error('❌ Error:', err.message);
    } finally {
      await pool.end();
    }
  });

program.parse();