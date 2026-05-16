#!/usr/bin/env node
require('dotenv').config();
const { Command } = require('commander');
const { pool } = require('./db');
const bcrypt = require('bcrypt');
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
  .requiredOption('-p, --password <password>', 'password') // Optional: you can choose to not require this and set a default or random password
  .action(async (options) => {
    try {
      const hash = await bcrypt.hash(
        options.password,
        parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10
      );

      await pool.query(
        `INSERT INTO users (username, email, password_hash, date_of_birth, is_verified) 
        VALUES ($1, $2, $3, $4, TRUE)`,
        [options.username, options.email, hash, options.dob]
      );
      console.log(`✅ User ${options.username} added (verified).`);
    } catch (err) {
      console.error('❌ Error:', err.message);
    } finally {
      await pool.end();
    }
  });

program.parse();